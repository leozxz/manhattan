"use client";

import Image from "next/image";
import { type StoredItem, getLogoUrl } from "@/lib/stored-item";

interface TransactionEntry {
  date: string;
  description: string;
  category: string;
  amount: number;
  accountId: string;
}

interface AccountData {
  id: string;
  name: string;
  balance: number;
  type: string;
  currencyCode: string;
}

interface TransactionHistoryProps {
  incomeTx: TransactionEntry[];
  expenseTx: TransactionEntry[];
  accounts: Record<string, AccountData[]>;
  items: StoredItem[];
  privacy?: boolean;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);

export function TransactionHistory({
  incomeTx,
  expenseTx,
  accounts,
  items,
  privacy = false,
}: TransactionHistoryProps) {
  const blur = privacy ? "blur-[8px] select-none" : "";
  // Build accountId → StoredItem map
  const accountToItem = new Map<string, StoredItem>();
  for (const item of items) {
    const accs = accounts[item.id] || [];
    for (const acc of accs) {
      accountToItem.set(acc.id, item);
    }
  }

  // Merge all transactions with a type indicator, sort by date desc
  const allTx = [
    ...incomeTx.map((tx) => ({ ...tx, type: "income" as const })),
    ...expenseTx.map((tx) => ({ ...tx, type: "expense" as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Group by date
  const grouped = new Map<string, typeof allTx>();
  for (const tx of allTx) {
    const dateKey = new Date(tx.date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    if (!grouped.has(dateKey)) grouped.set(dateKey, []);
    grouped.get(dateKey)!.push(tx);
  }

  if (allTx.length === 0) {
    return (
      <div className="text-sm text-gray-400">
        Nenhuma transação encontrada neste período.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Array.from(grouped.entries()).map(([dateLabel, txs]) => (
        <div key={dateLabel}>
          <div className="mb-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
            {dateLabel}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
            {txs.map((tx, i) => {
              const item = accountToItem.get(tx.accountId);
              const logoUrl = item ? getLogoUrl(item) : null;

              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  {/* Bank logo */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    {logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt={item?.connectorName || ""}
                        width={18}
                        height={18}
                        className="rounded object-contain"
                        unoptimized={logoUrl.startsWith("http")}
                      />
                    ) : (
                      <span className="text-xs text-gray-400">?</span>
                    )}
                  </div>

                  {/* Description + category */}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-900">
                      {tx.description}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{tx.category}</span>
                      {item && (
                        <>
                          <span>·</span>
                          <span>{item.connectorName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div
                    className={`shrink-0 text-sm font-semibold transition ${blur} ${
                      tx.type === "income"
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"} {fmt(tx.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
