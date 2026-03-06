"use client";

import { useState } from "react";

interface TransactionEntry {
  date: string;
  description: string;
  category: string;
  amount: number;
  accountId: string;
}

interface CategoryCardProps {
  categories: { name: string; amount: number }[];
  totalExpenses: number;
  transactions: TransactionEntry[];
  periodLabel: string;
  privacy?: boolean;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });

const COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-lime-500",
  "bg-fuchsia-500",
];

const DOT_COLORS = [
  "bg-blue-400",
  "bg-emerald-400",
  "bg-amber-400",
  "bg-rose-400",
  "bg-violet-400",
  "bg-cyan-400",
  "bg-orange-400",
  "bg-teal-400",
  "bg-pink-400",
  "bg-indigo-400",
  "bg-lime-400",
  "bg-fuchsia-400",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function getColorIndex(name: string): number {
  return hashString(name) % COLORS.length;
}

export function CategoryCards({
  categories,
  totalExpenses,
  transactions,
  periodLabel,
  privacy = false,
}: CategoryCardProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const blur = privacy ? "blur-[8px] select-none" : "";

  if (categories.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="text-sm text-gray-500">{periodLabel}</div>
        <div className="mt-2 text-sm text-gray-400">
          Sem dados de categoria neste período
        </div>
      </div>
    );
  }

  const maxAmount = categories[0]?.amount ?? 1;

  return (
    <div>
      <div className="mb-4 text-sm text-gray-500">{periodLabel}</div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((cat) => {
          const colorIdx = getColorIndex(cat.name);
          const pct = totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0;
          const isExpanded = expandedCategory === cat.name;
          const catTx = isExpanded
            ? transactions
                .filter((tx) => tx.category === cat.name)
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
            : [];

          return (
            <div key={cat.name}>
              <button
                onClick={() =>
                  setExpandedCategory(isExpanded ? null : cat.name)
                }
                className={`w-full rounded-xl border bg-white p-4 text-left transition ${
                  isExpanded
                    ? "border-gray-300 shadow-sm"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${DOT_COLORS[colorIdx]}`}
                  />
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {cat.name}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className={`text-lg font-semibold text-gray-900 transition ${blur}`}>
                    {fmt(cat.amount)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {pct.toFixed(0)}% despesas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${COLORS[colorIdx]}`}
                      style={{
                        width: `${(cat.amount / maxAmount) * 100}%`,
                      }}
                    />
                  </div>
                  <svg
                    className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {/* Expanded transactions */}
              {isExpanded && catTx.length > 0 && (
                <div className="mt-1 rounded-b-xl border border-t-0 border-gray-200 bg-gray-50 px-4 py-2">
                  <div className="space-y-1">
                    {catTx.map((tx, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-1.5 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="shrink-0 text-gray-400 w-12">
                            {fmtDate(tx.date)}
                          </span>
                          <span className="truncate text-gray-700">
                            {tx.description}
                          </span>
                        </div>
                        <span className={`ml-2 shrink-0 font-medium text-red-600 transition ${blur}`}>
                          {fmt(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
