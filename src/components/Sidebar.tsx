"use client";

import Image from "next/image";
import { type StoredItem, getLogoUrl } from "@/lib/stored-item";

interface AccountData {
  id: string;
  name: string;
  balance: number;
  type: string;
  currencyCode: string;
}

type View = "dashboard" | "history";

interface SidebarProps {
  items: StoredItem[];
  accounts: Record<string, AccountData[]>;
  selectedItemId: string | null;
  onSelectItem: (id: string | null) => void;
  onRemoveItem: (id: string) => void;
  onConnectClick: () => void;
  totalBalance: number;
  open: boolean;
  onToggle: () => void;
  view: View;
  onViewChange: (view: View) => void;
  privacy?: boolean;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);

export function Sidebar({
  items,
  accounts,
  selectedItemId,
  onSelectItem,
  onRemoveItem,
  onConnectClick,
  totalBalance,
  open,
  onToggle,
  view,
  onViewChange,
  privacy = false,
}: SidebarProps) {
  const blur = privacy ? "blur-[8px] select-none" : "";
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-gray-200 bg-white transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center px-6">
          <h2 className="text-xl font-bold text-gray-900">Manhattan</h2>
        </div>

        {/* Overview button */}
        <div className="px-3">
          <button
            onClick={() => { onSelectItem(null); onViewChange("dashboard"); }}
            className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
              selectedItemId === null && view === "dashboard"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <span>Visão geral</span>
              <span className={`text-xs font-normal text-gray-400 transition ${blur}`}>
                {fmt(totalBalance)}
              </span>
            </div>
          </button>
        </div>

        {/* Bank list */}
        <div className="mt-2 flex-1 overflow-y-auto px-3">
          <div className="space-y-1">
            {items.map((item) => {
              const logoUrl = getLogoUrl(item);
              const accs = accounts[item.id] || [];
              const isSelected = selectedItemId === item.id;

              return (
                <div key={item.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      onSelectItem(isSelected ? null : item.id);
                      onViewChange("dashboard");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectItem(isSelected ? null : item.id);
                        onViewChange("dashboard");
                      }
                    }}
                    className={`group flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
                      isSelected
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {logoUrl && (
                        <Image
                          src={logoUrl}
                          alt={item.connectorName}
                          width={20}
                          height={20}
                          className="shrink-0 rounded object-contain"
                          unoptimized={logoUrl.startsWith("http")}
                        />
                      )}
                      <span className="truncate font-medium">
                        {item.connectorName}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem(item.id);
                      }}
                      className="ml-2 shrink-0 text-xs text-gray-400 opacity-0 transition hover:text-red-600 group-hover:opacity-100"
                    >
                      remover
                    </button>
                  </div>

                  {/* Sub-accounts */}
                  {accs.map((acc) => (
                    <div
                      key={acc.id}
                      className="ml-7 flex items-center justify-between rounded-md px-3 py-1.5 text-xs text-gray-500"
                    >
                      <span className="truncate">{acc.name}</span>
                      <span className={`ml-2 shrink-0 font-medium text-gray-700 transition ${blur}`}>
                        {fmt(acc.balance)}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* History link */}
        <div className="px-3 mb-2">
          <button
            onClick={() => onViewChange("history")}
            className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
              view === "history"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            Histórico
          </button>
        </div>

        {/* Connect button at bottom */}
        <div className="shrink-0 border-t border-gray-200 p-3">
          <button
            onClick={onConnectClick}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
          >
            + Conectar conta
          </button>
        </div>
      </aside>
    </>
  );
}

export function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 lg:hidden"
      aria-label="Abrir menu"
    >
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  );
}
