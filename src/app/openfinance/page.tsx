"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@/components/ConnectButton";
import { type StoredItem, addStoredItem, saveStoredItems } from "@/lib/stored-item";

export default function OpenFinancePage() {
  const router = useRouter();

  // Clean slate on mount
  useEffect(() => {
    saveStoredItems([]);
    localStorage.removeItem("manhattan_all_item_ids");
    localStorage.removeItem("manhattan_simulated");
    localStorage.removeItem("manhattan_simulated_investments");
  }, []);

  function handleSuccess(item: StoredItem) {
    addStoredItem(item);
    router.push("/arca");
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/background.png')" }}>
      <main className="mx-auto max-w-lg px-6 py-16 flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Open Finance</h1>
          <p className="mt-2 text-sm text-gray-500">Conecte sua XP, BTG ou outra corretora</p>
        </div>

        <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 flex flex-col items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-900">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
            </svg>
          </div>
          <p className="text-sm text-gray-400 text-center">
            Ao conectar, seus investimentos reais serão carregados e comparados com a carteira ARCA.
          </p>
          <ConnectButton
            onSuccess={handleSuccess}
            label="Conectar"
            className="w-full rounded-lg bg-gray-900 px-6 py-3 text-lg font-semibold text-white hover:bg-gray-800 transition disabled:opacity-50"
          />
        </div>

        <button
          onClick={() => router.push("/")}
          className="text-sm text-gray-400 hover:text-gray-600 transition"
        >
          Voltar
        </button>
      </main>
    </div>
  );
}
