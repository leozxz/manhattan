"use client";

import { useEffect, useState } from "react";

interface Transaction {
  id: string;
  description: string;
  descriptionRaw?: string;
  amount: number;
  date: string;
  type: string;
  category?: string;
  currencyCode?: string;
}

interface TransactionListProps {
  accountId: string;
}

export function TransactionList({ accountId }: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/transactions?accountId=${accountId}`
        );
        if (!res.ok) throw new Error("Failed to fetch transactions");
        const data = await res.json();
        setTransactions(data.transactions);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [accountId]);

  if (loading) {
    return (
      <div className="animate-pulse text-gray-500">
        Carregando transacoes...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600">Erro: {error}</div>;
  }

  if (transactions.length === 0) {
    return (
      <div className="text-gray-500">Nenhuma transacao encontrada.</div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold text-gray-900">Transacoes</h2>
      <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
        {transactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between p-4">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-gray-900">
                {tx.description}
              </div>
              <div className="mt-1 flex gap-3 text-sm text-gray-500">
                <span>
                  {new Date(tx.date).toLocaleDateString("pt-BR")}
                </span>
                {tx.category && <span>{tx.category}</span>}
              </div>
            </div>
            <div
              className={`ml-4 whitespace-nowrap text-lg font-semibold ${
                tx.amount >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: tx.currencyCode || "BRL",
              }).format(tx.amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
