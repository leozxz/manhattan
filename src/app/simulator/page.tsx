"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { type StoredItem, addStoredItem, saveStoredItems } from "@/lib/stored-item";

const BROKER_OPTIONS = [
  { name: "XP Investimentos", logo: "" },
  { name: "BTG Pactual", logo: "" },
] as const;

function generateSimulatedInvestments(broker: string, totalAmount: number, pctAcoes: number, pctFiis: number, pctRendaFixa: number, pctIntl: number) {
  const investments = [];
  const acoes = totalAmount * (pctAcoes / 100);
  const fiis = totalAmount * (pctFiis / 100);
  const rf = totalAmount * (pctRendaFixa / 100);
  const intl = totalAmount * (pctIntl / 100);

  if (acoes > 0) {
    const fundPct = 0.6;
    investments.push({
      name: `${broker} - Fundo de Ações Carteira Livre`,
      balance: acoes * fundPct,
      type: "MUTUAL_FUND",
      subtype: "STOCK_FUND",
    });
    if (acoes * (1 - fundPct) > 100) {
      investments.push({
        name: "BOVA11 - ETF Ibovespa",
        balance: acoes * 0.25,
        type: "EQUITY",
        subtype: "ETF",
      });
      investments.push({
        name: "PETR4 - Petrobras PN",
        balance: acoes * 0.15,
        type: "EQUITY",
        subtype: "STOCK",
      });
    }
  }

  if (fiis > 0) {
    investments.push({
      name: "HGLG11 - FII Logística",
      balance: fiis * 0.4,
      type: "EQUITY",
      subtype: "REAL_ESTATE_FUND",
    });
    investments.push({
      name: "XPML11 - FII Shoppings",
      balance: fiis * 0.35,
      type: "EQUITY",
      subtype: "REAL_ESTATE_FUND",
    });
    investments.push({
      name: "KNRI11 - FII Híbrido",
      balance: fiis * 0.25,
      type: "EQUITY",
      subtype: "REAL_ESTATE_FUND",
    });
  }

  if (rf > 0) {
    investments.push({
      name: "Tesouro Selic 2029",
      balance: rf * 0.5,
      type: "FIXED_INCOME",
      subtype: "TREASURY",
    });
    investments.push({
      name: "Tesouro IPCA+ 2035",
      balance: rf * 0.3,
      type: "FIXED_INCOME",
      subtype: "TREASURY",
    });
    if (rf * 0.2 > 50) {
      investments.push({
        name: "CDB Banco Master 120% CDI",
        balance: rf * 0.2,
        type: "FIXED_INCOME",
        subtype: "CDB",
      });
    }
  }

  if (intl > 0) {
    investments.push({
      name: "IVVB11 - ETF S&P 500",
      balance: intl * 0.5,
      type: "EQUITY",
      subtype: "BDR",
    });
    investments.push({
      name: "NASD11 - ETF Nasdaq 100",
      balance: intl * 0.3,
      type: "EQUITY",
      subtype: "BDR",
    });
    investments.push({
      name: "GOLD11 - ETF Ouro",
      balance: intl * 0.2,
      type: "EQUITY",
      subtype: "BDR",
    });
  }

  return investments;
}

function formatMoney(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits === "") return "";
  const num = parseInt(digits, 10);
  const intPart = Math.floor(num / 100).toString();
  const decPart = (num % 100).toString().padStart(2, "0");
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formatted},${decPart}`;
}

function parseMoney(value: string): number {
  const cleaned = value.replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

export default function SimulatorPage() {
  const router = useRouter();

  // Clean slate on mount
  useEffect(() => {
    saveStoredItems([]);
    localStorage.removeItem("manhattan_all_item_ids");
    localStorage.removeItem("manhattan_simulated");
    localStorage.removeItem("manhattan_simulated_investments");
  }, []);

  const [selectedBroker, setSelectedBroker] = useState<number | null>(null);
  const [investTotal, setInvestTotal] = useState("");
  const [pctAcoes, setPctAcoes] = useState("40");
  const [pctFiis, setPctFiis] = useState("15");
  const [pctRendaFixa, setPctRendaFixa] = useState("35");
  const [pctIntl, setPctIntl] = useState("10");

  function handleMoneyChange(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(formatMoney(e.target.value));
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedBroker === null) return;
    const broker = BROKER_OPTIONS[selectedBroker];
    const total = parseMoney(investTotal);
    if (total <= 0) return;

    const a = parseInt(pctAcoes) || 0;
    const f = parseInt(pctFiis) || 0;
    const r = parseInt(pctRendaFixa) || 0;
    const i = parseInt(pctIntl) || 0;

    const investments = generateSimulatedInvestments(broker.name, total, a, f, r, i);
    localStorage.setItem("manhattan_simulated_investments", JSON.stringify(investments));

    const simItem: StoredItem = {
      id: `sim-invest-${Date.now()}`,
      connectorName: broker.name,
      connectorImageUrl: broker.logo,
    };
    addStoredItem(simItem);
    router.push("/arca");
  }

  const totalPct = (parseInt(pctAcoes) || 0) + (parseInt(pctFiis) || 0) + (parseInt(pctRendaFixa) || 0) + (parseInt(pctIntl) || 0);

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/background.png')" }}>
      <main className="mx-auto max-w-lg px-6 py-16 flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Simulador</h1>
          <p className="mt-2 text-sm text-gray-500">Teste com investimentos simulados</p>
        </div>

        <div className="w-full rounded-2xl border border-gray-200 bg-white p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Corretora
              </label>
              <div className="relative">
                <select
                  value={selectedBroker ?? ""}
                  onChange={(e) => setSelectedBroker(e.target.value === "" ? null : Number(e.target.value))}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-8 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
                >
                  <option value="">Selecione a corretora</option>
                  {BROKER_OPTIONS.map((b, i) => (
                    <option key={b.name} value={i}>{b.name}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total investido (R$)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={investTotal}
                onChange={handleMoneyChange(setInvestTotal)}
                placeholder="50.000,00"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alocação por classe (%)
              </label>
              <div className="space-y-3">
                {[
                  { label: "Ações e Fundos", color: "bg-red-500", value: pctAcoes, setter: setPctAcoes },
                  { label: "FIIs (Real Estate)", color: "bg-sky-500", value: pctFiis, setter: setPctFiis },
                  { label: "Renda Fixa (Caixa)", color: "bg-amber-500", value: pctRendaFixa, setter: setPctRendaFixa },
                  { label: "Internacionais", color: "bg-indigo-500", value: pctIntl, setter: setPctIntl },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${item.color} shrink-0`} />
                    <span className="text-sm text-gray-700 w-36">{item.label}</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.value}
                      onChange={(e) => item.setter(e.target.value)}
                      className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center text-gray-900 focus:border-gray-900 focus:outline-none"
                    />
                    <span className="text-xs text-gray-400">%</span>
                  </div>
                ))}
                <div className={`text-xs font-medium ${totalPct === 100 ? "text-emerald-600" : "text-red-500"}`}>
                  Total: {totalPct}% {totalPct !== 100 && "(deve somar 100%)"}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                selectedBroker === null ||
                parseMoney(investTotal) <= 0 ||
                totalPct !== 100
              }
              className="w-full rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Gerar simulação
            </button>
          </form>
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
