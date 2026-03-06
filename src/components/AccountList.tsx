"use client";

import { useEffect, useState } from "react";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currencyCode: string;
  number: string;
}

interface AccountListProps {
  itemId: string;
  onSelectAccount: (accountId: string) => void;
  selectedAccountId: string | null;
}

export function AccountList({
  itemId,
  onSelectAccount,
  selectedAccountId,
}: AccountListProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch(`/api/accounts?itemId=${itemId}`);
        if (!res.ok) throw new Error("Failed to fetch accounts");
        const data = await res.json();
        setAccounts(data.accounts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchAccounts();
  }, [itemId]);

  if (loading) {
    return (
      <div className="animate-pulse text-gray-400">Carregando contas...</div>
    );
  }

  if (error) {
    return <div className="text-red-400">Erro: {error}</div>;
  }

  if (accounts.length === 0) {
    return <div className="text-gray-400">Nenhuma conta encontrada.</div>;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-gray-100">Contas</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {accounts.map((account) => (
          <button
            key={account.id}
            onClick={() => onSelectAccount(account.id)}
            className={`rounded-lg border p-4 text-left transition ${
              selectedAccountId === account.id
                ? "border-white bg-gray-800"
                : "border-gray-700 bg-gray-900 hover:border-gray-500"
            }`}
          >
            <div className="font-medium text-gray-100">{account.name}</div>
            <div className="mt-1 text-sm text-gray-400">
              {account.type} {account.number && `- ${account.number}`}
            </div>
            <div className="mt-2 text-lg font-semibold text-gray-100">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: account.currencyCode || "BRL",
              }).format(account.balance)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
