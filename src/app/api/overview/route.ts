import { NextRequest, NextResponse } from "next/server";
import { createPluggyClient } from "@/lib/pluggy";

export async function GET(request: NextRequest) {
  const itemIds = request.nextUrl.searchParams.get("itemIds");
  const period = request.nextUrl.searchParams.get("period") || "current";

  if (!itemIds) {
    return NextResponse.json(
      { error: "itemIds is required" },
      { status: 400 }
    );
  }

  const ids = itemIds.split(",").filter(Boolean);

  try {
    const client = createPluggyClient();

    // Fetch all accounts for all items in parallel
    const accountResults = await Promise.all(
      ids.map((id) => client.fetchAccounts(id))
    );

    const allAccounts = accountResults.flatMap((r) => r.results);
    const totalBalance = allAccounts.reduce((sum, a) => sum + a.balance, 0);

    // Build account summaries per item
    const accountsByItem: Record<
      string,
      { id: string; name: string; balance: number; type: string; currencyCode: string }[]
    > = {};
    for (const id of ids) {
      const result = accountResults[ids.indexOf(id)];
      accountsByItem[id] = result.results.map((a) => ({
        id: a.id,
        name: a.name,
        balance: a.balance,
        type: a.type,
        currencyCode: a.currencyCode,
      }));
    }

    // Calculate date ranges based on period
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let primaryStart: Date;
    let primaryEnd: Date;
    let comparisonStart: Date;
    let comparisonEnd: Date;

    if (period === "1m") {
      // Last month as primary, month before as comparison
      primaryStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      primaryEnd = new Date(firstDayThisMonth.getTime() - 1); // last ms of last month
      comparisonStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      comparisonEnd = new Date(primaryStart.getTime() - 1);
    } else if (period === "3m") {
      // Last 3 complete months as primary, 3 months before as comparison
      primaryStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      primaryEnd = new Date(firstDayThisMonth.getTime() - 1);
      comparisonStart = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      comparisonEnd = new Date(primaryStart.getTime() - 1);
    } else {
      // "current" - current month as primary, last month as comparison
      primaryStart = firstDayThisMonth;
      primaryEnd = now;
      comparisonStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      comparisonEnd = new Date(firstDayThisMonth.getTime() - 1);
    }

    const from = comparisonStart.toISOString().split("T")[0];
    const to = (period === "current" ? now : firstDayThisMonth).toISOString().split("T")[0];

    const txResults = await Promise.all(
      allAccounts.map((a) =>
        client.fetchTransactions(a.id, { from, to }).catch(() => ({ results: [] }))
      )
    );

    const allTransactions = txResults.flatMap((r) => r.results);

    // Build a set of BANK-type account IDs (checking/savings)
    // Only these represent real money movement (avoids double-counting with credit card accounts)
    const bankAccountIds = new Set(
      allAccounts.filter((a) => a.type === "BANK").map((a) => a.id)
    );
    const hasBankAccounts = bankAccountIds.size > 0;

    // Collect all BANK transactions to build user identity ONCE (across all periods)
    const allBankTx = allTransactions.filter(
      (tx) => !hasBankAccounts || bankAccountIds.has(tx.accountId)
    );

    // Build user identity from paymentData across all transactions:
    // - In DEBITs: payer = the account owner (user)
    // - In CREDITs: receiver = the account owner (user)
    const userDocuments = new Set<string>();
    const userNames = new Set<string>();

    for (const tx of allBankTx) {
      const pd = tx.paymentData;
      if (!pd) continue;
      if (tx.type !== "CREDIT") {
        if (pd.payer?.documentNumber?.value) userDocuments.add(pd.payer.documentNumber.value);
        if (pd.payer?.name) userNames.add(pd.payer.name.toUpperCase().trim());
      } else {
        if (pd.receiver?.documentNumber?.value) userDocuments.add(pd.receiver.documentNumber.value);
        if (pd.receiver?.name) userNames.add(pd.receiver.name.toUpperCase().trim());
      }
    }

    function isOwnTransfer(tx: (typeof allTransactions)[number]): boolean {
      const pd = tx.paymentData;

      // Check via paymentData: counterparty matches user's CPF or name
      if (pd) {
        if (tx.type === "CREDIT") {
          // Received transfer — check if SENDER is the user
          if (pd.payer?.documentNumber?.value && userDocuments.has(pd.payer.documentNumber.value)) return true;
          if (pd.payer?.name && userNames.has(pd.payer.name.toUpperCase().trim())) return true;
        } else {
          // Sent transfer — check if RECEIVER is the user
          if (pd.receiver?.documentNumber?.value && userDocuments.has(pd.receiver.documentNumber.value)) return true;
          if (pd.receiver?.name && userNames.has(pd.receiver.name.toUpperCase().trim())) return true;
        }
      }

      // Fallback: description pattern "Transferência Recebida|NAME" / "Transferência Enviada|NAME"
      const desc = tx.description || "";
      const pipeIdx = desc.indexOf("|");
      if (pipeIdx !== -1) {
        const prefix = desc.substring(0, pipeIdx).toLowerCase();
        const name = desc.substring(pipeIdx + 1).toUpperCase().trim();
        if (name && (prefix.includes("transferência") || prefix.includes("transferencia"))) {
          if (userNames.has(name)) return true;
        }
      }

      return false;
    }

    // Split into primary period vs comparison period
    const primaryTx = allTransactions.filter((tx) => {
      const d = new Date(tx.date);
      return d >= primaryStart && d <= primaryEnd;
    });
    const comparisonTx = allTransactions.filter((tx) => {
      const d = new Date(tx.date);
      return d >= comparisonStart && d <= comparisonEnd;
    });

    function summarize(transactions: typeof allTransactions) {
      let income = 0;
      let expenses = 0;
      const byCategory: Record<string, number> = {};
      const incomeTx: { date: string; description: string; category: string; amount: number; accountId: string }[] = [];
      const expenseTx: { date: string; description: string; category: string; amount: number; accountId: string }[] = [];

      // Filter to BANK-only transactions
      const bankTx = transactions.filter(
        (tx) => !hasBankAccounts || bankAccountIds.has(tx.accountId)
      );

      // Detect internal transfers using two strategies:
      const transferIds = new Set<string>();

      // 1) Pair matching: DEBIT on account A ↔ CREDIT on account B (same amount, ±1 day)
      const credits = bankTx.filter((tx) => tx.type === "CREDIT");
      const debits = bankTx.filter((tx) => tx.type !== "CREDIT");
      const usedDebitIds = new Set<string>();

      for (const credit of credits) {
        const creditDate = new Date(credit.date).getTime();
        const match = debits.find((debit) => {
          if (usedDebitIds.has(debit.id)) return false;
          if (debit.accountId === credit.accountId) return false;
          const dayMs = 86_400_000;
          const debitDate = new Date(debit.date).getTime();
          return (
            Math.abs(Math.abs(debit.amount) - credit.amount) < 0.01 &&
            Math.abs(debitDate - creditDate) <= dayMs
          );
        });
        if (match) {
          transferIds.add(credit.id);
          transferIds.add(match.id);
          usedDebitIds.add(match.id);
        }
      }

      // 2) Identity matching: counterparty CPF/name matches account owner
      for (const tx of bankTx) {
        if (transferIds.has(tx.id)) continue;
        if (isOwnTransfer(tx)) transferIds.add(tx.id);
      }

      for (const tx of bankTx) {
        if (transferIds.has(tx.id)) continue;

        const entry = {
          date: typeof tx.date === "string" ? tx.date : new Date(tx.date).toISOString(),
          description: tx.description,
          category: tx.category || "Sem categoria",
          amount: Math.abs(tx.amount),
          accountId: tx.accountId,
        };

        if (tx.type === "CREDIT") {
          income += tx.amount;
          incomeTx.push(entry);
        } else {
          expenses += Math.abs(tx.amount);
          expenseTx.push(entry);
          byCategory[entry.category] = (byCategory[entry.category] || 0) + entry.amount;
        }
      }

      // Sort transactions by date descending
      const sortByDate = (a: { date: string }, b: { date: string }) =>
        new Date(b.date).getTime() - new Date(a.date).getTime();
      incomeTx.sort(sortByDate);
      expenseTx.sort(sortByDate);

      // Sort categories by amount descending
      const categories = Object.entries(byCategory)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount);

      return { income, expenses, categories, incomeTx, expenseTx };
    }

    const thisMonth = summarize(primaryTx);
    const lastMonth = summarize(comparisonTx);

    return NextResponse.json({
      totalBalance,
      accounts: accountsByItem,
      thisMonth,
      lastMonth,
    });
  } catch (error) {
    console.error("Error fetching overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch overview" },
      { status: 500 }
    );
  }
}
