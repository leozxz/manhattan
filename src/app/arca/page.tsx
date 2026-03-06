"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { loadStoredItems, addStoredItem, type StoredItem } from "@/lib/stored-item";
import { ConnectButton } from "@/components/ConnectButton";
import { mapInvestmentsToPillars, type ArcaPillar, type PillarAllocation } from "@/lib/arca-mapping";


type Pillar = "acoes" | "realestate" | "caixa" | "internacionais";

const PILLARS: Record<
  Pillar,
  {
    letter: string;
    label: string;
    subtitle: string;
    color: string;
    bg: string;
    border: string;
    description: string;
    examples: string[];
    role: string;
    suggestions: { asset: string; desc: string; pct: number }[];
  }
> = {
  acoes: {
    letter: "A",
    label: "Ações e Negócios",
    subtitle: "Participação em empresas brasileiras",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    description:
      "Motor de crescimento no longo prazo. Conecta a construção de patrimônio aos seus objetivos através de participação em empresas listadas na bolsa.",
    examples: ["Ações na B3", "ETFs (BOVA11, IVVB11)", "Fundos de Ações", "Fundos Multimercado"],
    role: "Crescimento",
    suggestions: [
      { asset: "BOVA11", desc: "ETF Ibovespa — exposição ampla ao mercado brasileiro", pct: 30 },
      { asset: "PETR4", desc: "Petrobras — dividendos e commodities", pct: 15 },
      { asset: "VALE3", desc: "Vale — mineração e exportação", pct: 15 },
      { asset: "ITUB4", desc: "Itaú — setor financeiro sólido", pct: 15 },
      { asset: "WEGE3", desc: "WEG — crescimento e inovação", pct: 10 },
      { asset: "MXRF11", desc: "Fundo multimercado diversificado", pct: 15 },
    ],
  },
  realestate: {
    letter: "R",
    label: "Real Estate",
    subtitle: "Imóveis e Fundos Imobiliários",
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
    description:
      "Renda passiva e exposição a ativos reais. Gera fluxo de caixa recorrente através de aluguéis e dividendos de FIIs, com potencial de valorização.",
    examples: ["FIIs (Fundos Imobiliários)", "Imóveis físicos", "CRIs e LCIs", "Fundos de desenvolvimento"],
    role: "Renda passiva",
    suggestions: [
      { asset: "HGLG11", desc: "FII logística — galpões de alta demanda", pct: 20 },
      { asset: "XPML11", desc: "FII shoppings — renda recorrente", pct: 20 },
      { asset: "KNRI11", desc: "FII híbrido — escritórios e logística", pct: 20 },
      { asset: "BTLG11", desc: "FII logística — contratos atípicos", pct: 15 },
      { asset: "VISC11", desc: "FII shoppings — diversificado", pct: 15 },
      { asset: "IRDM11", desc: "FII papel — CRIs indexados ao IPCA", pct: 10 },
    ],
  },
  caixa: {
    letter: "C",
    label: "Caixa",
    subtitle: "Renda fixa e liquidez",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    description:
      "Proteção e liquidez. Amortece a volatilidade do portfólio e garante recursos disponíveis para emergências e para aproveitar oportunidades de compra.",
    examples: ["Tesouro Selic", "CDBs de liquidez diária", "Fundos DI", "LCAs e LCIs"],
    role: "Proteção",
    suggestions: [
      { asset: "Tesouro Selic", desc: "Liquidez diária — reserva de emergência", pct: 35 },
      { asset: "CDB 100% CDI", desc: "Liquidez diária — com FGC", pct: 25 },
      { asset: "Tesouro IPCA+", desc: "Proteção inflação — longo prazo", pct: 20 },
      { asset: "LCA/LCI", desc: "Isento de IR — atrelado ao CDI", pct: 20 },
    ],
  },
  internacionais: {
    letter: "A",
    label: "Ativos Internacionais",
    subtitle: "Moedas fortes e mercado global",
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    description:
      "Diversificação geográfica e proteção cambial. Dilui o risco Brasil e conecta seu patrimônio às maiores economias do mundo em moedas fortes.",
    examples: ["BDRs", "ETFs internacionais", "Stocks (EUA)", "Fundos cambiais"],
    role: "Hedge cambial",
    suggestions: [
      { asset: "IVVB11", desc: "ETF S&P 500 — economia americana", pct: 35 },
      { asset: "NASD11", desc: "ETF Nasdaq — tecnologia global", pct: 25 },
      { asset: "EURP11", desc: "ETF Europa — diversificação geográfica", pct: 15 },
      { asset: "GOLD11", desc: "ETF Ouro — proteção e reserva de valor", pct: 15 },
      { asset: "BDR (AAPL34)", desc: "BDRs de big techs americanas", pct: 10 },
    ],
  },
};

const PILLAR_ORDER: Pillar[] = ["acoes", "realestate", "caixa", "internacionais"];

export default function ArcaPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<Pillar>>(new Set());
  const [carteiraExpanded, setCarteiraExpanded] = useState<Set<string>>(new Set());

  // Investment data
  const [pillarData, setPillarData] = useState<Record<ArcaPillar, PillarAllocation> | null>(null);
  const [investLoading, setInvestLoading] = useState(true);
  const [investError, setInvestError] = useState<string | null>(null);
  const [hasInvestments, setHasInvestments] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadInvestments = useCallback(async () => {
    setInvestLoading(true);
    setInvestError(null);
    setIsSyncing(false);

    const items = loadStoredItems();

    // Check for simulated investments first
    const hasSimInvest = items.some((i) => i.id.startsWith("sim-invest-"));
    if (hasSimInvest) {
      try {
        const raw = localStorage.getItem("manhattan_simulated_investments");
        if (raw) {
          const simInvestments = JSON.parse(raw);
          if (Array.isArray(simInvestments) && simInvestments.length > 0) {
            const mapped = mapInvestmentsToPillars(simInvestments);
            setPillarData(mapped);
            setHasInvestments(true);
          }
        }
      } catch (err) {
        console.error("Failed to load simulated investments:", err);
      }
      setInvestLoading(false);
      return;
    }

    const isSimOnly = items.length > 0 && items.every((i) => i.id.startsWith("sim-"));
    if (isSimOnly || items.length === 0) {
      setInvestLoading(false);
      return;
    }

    try {
      const allIds = items.filter((i) => !i.id.startsWith("sim-")).map((i) => i.id);

      if (allIds.length === 0) {
        setInvestLoading(false);
        return;
      }

      const res = await fetch(`/api/investments?itemIds=${allIds.join(",")}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setInvestError(errData.error || "Erro ao carregar investimentos");
        return;
      }
      const data = await res.json();

      if (data.syncing) {
        setIsSyncing(true);
      }

      if (data.investments && Array.isArray(data.investments) && data.investments.length > 0) {
        const mapped = mapInvestmentsToPillars(data.investments);
        setPillarData(mapped);
        setHasInvestments(true);
      } else {
        setHasInvestments(false);
        setPillarData(null);
      }
    } catch (err) {
      console.error("Failed to load investments:", err);
      setInvestError("Erro ao carregar investimentos");
    } finally {
      setInvestLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvestments();
  }, [loadInvestments]);

  const DEMO_ITEM_ID = "21a92251-4afe-47f5-9894-0d45e3c6d264";
  const isOpenFinance = (() => {
    const items = loadStoredItems();
    if (items.length === 0) return false;
    if (items.some((i) => i.id.startsWith("sim-"))) return false;
    if (items.every((i) => i.id === DEMO_ITEM_ID)) return false;
    return true;
  })();

  function handleAddConnection(item: StoredItem) {
    addStoredItem(item);
    loadInvestments();
  }

  const PILLAR_COLORS: Record<string, string> = {
    acoes: "#b91c1c",
    realestate: "#0369a1",
    caixa: "#b45309",
    internacionais: "#4338ca",
    outro: "#6b7280",
  };

  const PILLAR_BG_LIGHT: Record<string, string> = {
    acoes: "#fef2f2",
    realestate: "#f0f9ff",
    caixa: "#fffbeb",
    internacionais: "#eef2ff",
    outro: "#f9fafb",
  };

  const PILLAR_LABELS: Record<string, string> = {
    acoes: "Acoes",
    realestate: "Real Estate",
    caixa: "Caixa",
    internacionais: "Internacionais",
    outro: "Outro",
  };

  function toggleSet<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/background.png')" }}>
      <main className="mx-auto max-w-5xl px-6 py-8 pb-24">

        <div className="mb-8">
          <p className="text-[11px] text-gray-400 uppercase tracking-widest mb-1">Alocação recomendada</p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Metodologia ARCA</h1>
          <p className="text-sm text-gray-400 mt-1">Balanceamento em 4 pilares para crescer e proteger seu patrimônio</p>
          <div className="mt-3 h-px bg-gray-200"></div>
        </div>

        {/* Removed tab bar — both charts shown side by side below */}

        {/* Loading / error / syncing states */}
        {investLoading && (
          <div className="mb-8 flex items-center justify-center py-8">
            <div className="animate-pulse text-sm text-gray-400">Carregando investimentos...</div>
          </div>
        )}

        {investError && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
            {investError}
          </div>
        )}

        {!investLoading && !hasInvestments && !investError && isSyncing && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 shadow-sm p-6 text-center">
            <div className="text-sm font-semibold text-gray-900 mb-1">Sincronizando investimentos...</div>
            <p className="text-xs text-gray-400">
              Sua conexao esta sendo processada. Atualize a pagina em alguns instantes.
            </p>
          </div>
        )}

        {!investLoading && !hasInvestments && !investError && !isSyncing && loadStoredItems().some((i) => !i.id.startsWith("sim-")) && (
          <div className="mb-8 rounded-2xl border border-gray-200 bg-white shadow-sm p-6 flex flex-col items-center gap-4">
            <div className="text-sm font-semibold text-gray-900">Nenhum investimento encontrado</div>
            <p className="text-xs text-gray-400">
              {isOpenFinance
                ? "Essa conta não possui investimentos. Conecte outra corretora para ver o comparativo ARCA."
                : "Nenhum investimento foi encontrado nessa conta."}
            </p>
            {isOpenFinance && (
              <ConnectButton
                onSuccess={handleAddConnection}
                label="Adicionar conexão"
                className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition disabled:opacity-50"
              />
            )}
          </div>
        )}

        {/* ===== SIDE BY SIDE: Sua Carteira | Carteira ARCA ===== */}
        {!investLoading && hasInvestments && pillarData && (() => {
          const pillarKeys = (["acoes", "realestate", "caixa", "internacionais"] as ArcaPillar[]);
          const hasOutro = pillarData.outro.percentage > 0;
          const allKeys = hasOutro ? [...pillarKeys, "outro" as ArcaPillar] : pillarKeys;
          const totalBalance = allKeys.reduce((s, k) => s + pillarData[k].balance, 0);
          const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
          const idealPerPillar = totalBalance / 4;

          const pctAcoes = pillarData.acoes.percentage;
          const pctRealestate = pillarData.realestate.percentage;
          const pctCaixa = pillarData.caixa.percentage;
          const pctInternacionais = pillarData.internacionais.percentage;

          const ArcCircle = ({ pcts, centerText, onClickArc, activeArcs }: { pcts: { acoes: string; realestate: string; caixa: string; internacionais: string }; centerText: React.ReactNode; onClickArc?: (key: string) => void; activeArcs?: Set<string> }) => (
            <div className="relative w-[320px] h-[320px]">
              <svg viewBox="0 0 300 300" className="w-full h-full">
                {([
                  { key: "acoes", d: "M60,150 A90,90 0 0,1 150,60", color: "#b91c1c", tx: "-6px", ty: "-6px", shadow: "rgba(220,38,38,.5)" },
                  { key: "realestate", d: "M150,60 A90,90 0 0,1 240,150", color: "#0369a1", tx: "6px", ty: "-6px", shadow: "rgba(2,132,199,.5)" },
                  { key: "internacionais", d: "M240,150 A90,90 0 0,1 150,240", color: "#4338ca", tx: "6px", ty: "6px", shadow: "rgba(67,56,202,.5)" },
                  { key: "caixa", d: "M150,240 A90,90 0 0,1 60,150", color: "#b45309", tx: "-6px", ty: "6px", shadow: "rgba(217,119,6,.5)" },
                ] as const).map((arc) => (
                  <g
                    key={arc.key}
                    className="cursor-pointer arc-hover"
                    style={{ transition: "transform 0.3s cubic-bezier(.34,1.56,.64,1), filter 0.3s ease", transform: activeArcs?.has(arc.key) ? `translate(${arc.tx}, ${arc.ty})` : undefined, filter: activeArcs?.has(arc.key) ? `drop-shadow(0 0 6px ${arc.shadow})` : "none" }}
                    onClick={() => onClickArc?.(arc.key)}
                  >
                    <path
                      d={arc.d}
                      fill="none" stroke={arc.color} strokeLinecap="butt"
                      strokeWidth={activeArcs?.has(arc.key) ? 16 : 12}
                      opacity={activeArcs?.has(arc.key) ? 1 : 0.35}
                      style={{ transition: "opacity 0.3s ease, stroke-width 0.3s ease" }}
                    />
                  </g>
                ))}

                <text x="150" y="155" fontSize="12" fontWeight="700" fill="#111827" textAnchor="middle">{centerText}</text>

                <text x="86" y="40" fontSize="8" fontWeight="700" fill="#b91c1c" textAnchor="middle">AÇÕES E</text>
                <text x="86" y="50" fontSize="8" fontWeight="700" fill="#b91c1c" textAnchor="middle">NEGÓCIOS</text>
                <text x="214" y="40" fontSize="8" fontWeight="700" fill="#0369a1" textAnchor="middle">REAL</text>
                <text x="214" y="50" fontSize="8" fontWeight="700" fill="#0369a1" textAnchor="middle">ESTATE</text>
                <text x="86" y="260" fontSize="8" fontWeight="700" fill="#b45309" textAnchor="middle">CAIXA</text>
                <text x="214" y="255" fontSize="8" fontWeight="700" fill="#4338ca" textAnchor="middle">ATIVOS</text>
                <text x="214" y="265" fontSize="8" fontWeight="700" fill="#4338ca" textAnchor="middle">INTERNACIONAIS</text>

                <rect x="68" y="78" width="36" height="18" rx="9" fill="white" stroke="#b91c1c" strokeWidth="1.2" />
                <text x="86" y="91" fontSize="9" fontWeight="700" fill="#b91c1c" textAnchor="middle">{pcts.acoes}</text>
                <rect x="196" y="78" width="36" height="18" rx="9" fill="white" stroke="#0369a1" strokeWidth="1.2" />
                <text x="214" y="91" fontSize="9" fontWeight="700" fill="#0369a1" textAnchor="middle">{pcts.realestate}</text>
                <rect x="196" y="202" width="36" height="18" rx="9" fill="white" stroke="#4338ca" strokeWidth="1.2" />
                <text x="214" y="215" fontSize="9" fontWeight="700" fill="#4338ca" textAnchor="middle">{pcts.internacionais}</text>
                <rect x="68" y="202" width="36" height="18" rx="9" fill="white" stroke="#b45309" strokeWidth="1.2" />
                <text x="86" y="215" fontSize="9" fontWeight="700" fill="#b45309" textAnchor="middle">{pcts.caixa}</text>
              </svg>
            </div>
          );

          return (
            <div className="mb-8">
              {/* Two charts side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-0 items-start">
                {/* LEFT: Sua Carteira */}
                <div className="flex flex-col items-center gap-4">
                  <div className="text-sm font-semibold text-gray-900">Sua Carteira</div>
                  <ArcCircle
                    pcts={{ acoes: `${pctAcoes.toFixed(0)}%`, realestate: `${pctRealestate.toFixed(0)}%`, caixa: `${pctCaixa.toFixed(0)}%`, internacionais: `${pctInternacionais.toFixed(0)}%` }}
                    centerText={fmt(totalBalance)}
                    onClickArc={(key) => setCarteiraExpanded(toggleSet(carteiraExpanded, key))}
                    activeArcs={carteiraExpanded}
                  />
                  {/* Cards below chart */}
                  <div className="grid gap-2 w-full max-w-xs">
                    {allKeys.filter((key) => pillarData[key].investments.length > 0).map((key) => {
                      const p = pillarData[key];
                      const isActive = carteiraExpanded.has(key);
                      return (
                        <button
                          key={key}
                          onClick={() => setCarteiraExpanded(toggleSet(carteiraExpanded, key))}
                          className={`rounded-xl border px-3 py-2.5 text-left bg-white transition-all duration-300 ${
                            isActive
                              ? "border-gray-400 -translate-y-0.5 shadow-md"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-[9px] font-bold"
                              style={{ backgroundColor: PILLAR_BG_LIGHT[key], color: PILLAR_COLORS[key] }}
                            >
                              {p.percentage.toFixed(0)}%
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-gray-900">{PILLAR_LABELS[key]}</div>
                              <div className="text-[10px] text-gray-400">{p.investments.length} ativo{p.investments.length !== 1 ? "s" : ""}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-semibold text-gray-900">{fmt(p.balance)}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    {isOpenFinance && (
                      <ConnectButton
                        onSuccess={handleAddConnection}
                        label="+ Adicionar corretora"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-400 hover:border-gray-300 hover:text-gray-600 transition text-center"
                      />
                    )}
                  </div>
                </div>

                {/* Vertical divider */}
                <div className="hidden lg:block w-px bg-gray-200 self-stretch mx-6" />

                {/* RIGHT: Carteira ARCA */}
                <div className="flex flex-col items-center gap-4 mt-8 lg:mt-0">
                  <div className="text-sm font-semibold text-gray-900">Carteira ARCA</div>
                  <ArcCircle
                    pcts={{ acoes: "25%", realestate: "25%", caixa: "25%", internacionais: "25%" }}
                    centerText={fmt(totalBalance)}
                    onClickArc={(key) => setSelected(toggleSet(selected, key as Pillar))}
                    activeArcs={selected as Set<string>}
                  />
                  {/* Cards below chart */}
                  <div className="grid gap-2 w-full max-w-xs">
                    {PILLAR_ORDER.map((key) => {
                      const p = PILLARS[key];
                      const isActive = selected.has(key);
                      const diff = idealPerPillar - pillarData[key].balance;
                      return (
                        <button
                          key={key}
                          onClick={() => setSelected(toggleSet(selected, key))}
                          className={`rounded-xl border px-3 py-2.5 text-left bg-white transition-all duration-300 ${
                            isActive
                              ? `${p.border} -translate-y-0.5 shadow-md`
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-[9px] font-bold"
                              style={{ backgroundColor: PILLAR_BG_LIGHT[key], color: PILLAR_COLORS[key] }}
                            >
                              25%
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-gray-900">{p.label}</div>
                              <div className="text-[10px] text-gray-400">Ideal: {fmt(idealPerPillar)}</div>
                            </div>
                            <div className="text-right">
                              <div className={`text-xs font-semibold ${diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-500" : "text-gray-900"}`}>
                                {diff > 0 ? "+" : ""}{fmt(diff)}
                              </div>
                              <div className="text-[10px] text-gray-400">
                                {diff > 0 ? "Comprar" : diff < 0 ? "Reduzir" : "OK"}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Expanded detail for Sua Carteira */}
              {carteiraExpanded.size > 0 && (
                <div className="mt-4 rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
                  {[...carteiraExpanded].filter((k) => pillarData[k as ArcaPillar]).map((key, idx) => {
                    const k = key as ArcaPillar;
                    const p = pillarData[k];
                    return (
                      <div key={k}>
                        {idx > 0 && <div className="my-4 h-px bg-gray-200" />}
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold"
                            style={{ backgroundColor: PILLAR_BG_LIGHT[k], color: PILLAR_COLORS[k] }}
                          >
                            {p.percentage.toFixed(0)}%
                          </div>
                          <div>
                            <div className="text-base font-semibold text-gray-900">{PILLAR_LABELS[k]}</div>
                            <div className="text-xs text-gray-500">{fmt(p.balance)} — {p.investments.length} ativo{p.investments.length !== 1 ? "s" : ""}</div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {p.investments
                            .sort((a, b) => b.balance - a.balance)
                            .map((inv, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50"
                              >
                                <div className="min-w-0 pr-3">
                                  <div className="text-sm text-gray-700 truncate">{inv.name}</div>
                                  <div className="text-[11px] text-gray-400">
                                    {inv.type}{inv.subtype ? ` / ${inv.subtype}` : ""}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-sm font-medium text-gray-900">{fmt(inv.balance)}</div>
                                  {totalBalance > 0 && (
                                    <div className="text-[11px] text-gray-400">
                                      {((inv.balance / totalBalance) * 100).toFixed(1)}% do total
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Expanded detail for ARCA */}
              {selected.size > 0 && (
                <div className="mt-4 rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
                  {[...selected].map((key, idx) => {
                    const d = PILLARS[key];
                    const currentBal = pillarData[key].balance;
                    const diffBal = idealPerPillar - currentBal;
                    return (
                      <div key={key}>
                        {idx > 0 && <div className="my-5 h-px bg-gray-200" />}
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-base font-bold ${d.bg} ${d.color}`}>
                            {d.letter}
                          </div>
                          <div>
                            <div className="text-base font-semibold text-gray-900">{d.label}</div>
                            <div className="text-xs text-gray-500">{d.subtitle}</div>
                          </div>
                        </div>
                        <div className="mb-4 grid grid-cols-3 gap-3">
                          <div className="rounded-xl bg-gray-50 p-3 text-center">
                            <div className="text-[11px] text-gray-400 mb-1">Atual</div>
                            <div className="text-sm font-semibold text-gray-900">{fmt(currentBal)}</div>
                            <div className="text-[11px] text-gray-400">{pillarData[key].percentage.toFixed(1)}%</div>
                          </div>
                          <div className="rounded-xl bg-gray-50 p-3 text-center">
                            <div className="text-[11px] text-gray-400 mb-1">Ideal (25%)</div>
                            <div className="text-sm font-semibold text-gray-900">{fmt(idealPerPillar)}</div>
                          </div>
                          <div className={`rounded-xl p-3 text-center ${diffBal > 0 ? "bg-emerald-50" : diffBal < 0 ? "bg-red-50" : "bg-gray-50"}`}>
                            <div className="text-[11px] text-gray-400 mb-1">Ajuste</div>
                            <div className={`text-sm font-semibold ${diffBal > 0 ? "text-emerald-600" : diffBal < 0 ? "text-red-500" : "text-gray-900"}`}>
                              {diffBal > 0 ? "+" : ""}{fmt(diffBal)}
                            </div>
                            <div className={`text-[11px] ${diffBal > 0 ? "text-emerald-500" : diffBal < 0 ? "text-red-400" : "text-gray-400"}`}>
                              {diffBal > 0 ? "Comprar" : diffBal < 0 ? "Reduzir" : "Equilibrado"}
                            </div>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-3">Sugestão de alocação do aporte</div>
                          <div className="space-y-2">
                            {d.suggestions.map((s) => {
                              const suggestedValue = diffBal > 0 ? diffBal * (s.pct / 100) : 0;
                              return (
                                <div key={s.asset} className="flex items-center justify-between rounded-lg px-3 py-2 bg-gray-50">
                                  <div className="min-w-0 pr-3">
                                    <div className="text-sm font-medium text-gray-900">{s.asset}</div>
                                    <div className="text-[11px] text-gray-400">{s.desc}</div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className="text-sm font-semibold text-gray-900">
                                      {suggestedValue > 0 ? fmt(suggestedValue) : `${s.pct}%`}
                                    </div>
                                    {suggestedValue > 0 && (
                                      <div className="text-[11px] text-gray-400">{s.pct}% do pilar</div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {diffBal <= 0 && (
                            <p className="text-xs text-gray-400 mt-3">Este pilar já está equilibrado ou acima do ideal. Direcione novos aportes para os pilares com déficit.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* Fallback: only ARCA view when no investments */}
        {!investLoading && !hasInvestments && (() => {
          return (
            <div className="mb-8 flex flex-col items-center gap-4">
              <div className="text-sm font-semibold text-gray-900">Carteira ARCA</div>
              <div className="relative w-[320px] h-[320px]">
                <svg viewBox="0 0 300 300" className="w-full h-full">
                  {([
                    { key: "acoes", d: "M60,150 A90,90 0 0,1 150,60", color: "#b91c1c" },
                    { key: "realestate", d: "M150,60 A90,90 0 0,1 240,150", color: "#0369a1" },
                    { key: "internacionais", d: "M240,150 A90,90 0 0,1 150,240", color: "#4338ca" },
                    { key: "caixa", d: "M150,240 A90,90 0 0,1 60,150", color: "#b45309" },
                  ] as const).map((arc) => (
                    <g
                      key={arc.key}
                      className="cursor-pointer"
                      style={{ transition: "transform 0.3s ease, filter 0.3s ease", filter: selected.has(arc.key as Pillar) ? `drop-shadow(0 0 6px ${arc.color}88)` : "none" }}
                      onClick={() => setSelected(toggleSet(selected, arc.key as Pillar))}
                    >
                      <path d={arc.d} fill="none" stroke={arc.color} strokeLinecap="butt" strokeWidth={selected.has(arc.key as Pillar) ? 16 : 12} opacity={selected.has(arc.key as Pillar) ? 1 : 0.35} style={{ transition: "opacity 0.3s ease, stroke-width 0.3s ease" }} />
                    </g>
                  ))}
                  <circle cx="150" cy="150" r="50" fill="white" stroke="#e5e7eb" strokeWidth="2" />
                  <line x1="150" y1="108" x2="150" y2="192" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="108" y1="150" x2="192" y2="150" stroke="#e5e7eb" strokeWidth="1" />
                  <text x="130" y="140" fontSize="24" fontWeight="800" fill="#b91c1c" textAnchor="middle">A</text>
                  <text x="170" y="140" fontSize="24" fontWeight="800" fill="#0369a1" textAnchor="middle">R</text>
                  <text x="130" y="175" fontSize="24" fontWeight="800" fill="#b45309" textAnchor="middle">C</text>
                  <text x="170" y="175" fontSize="24" fontWeight="800" fill="#4338ca" textAnchor="middle">A</text>
                  <text x="86" y="40" fontSize="8" fontWeight="700" fill="#b91c1c" textAnchor="middle">AÇÕES E</text>
                  <text x="86" y="50" fontSize="8" fontWeight="700" fill="#b91c1c" textAnchor="middle">NEGÓCIOS</text>
                  <text x="214" y="40" fontSize="8" fontWeight="700" fill="#0369a1" textAnchor="middle">REAL</text>
                  <text x="214" y="50" fontSize="8" fontWeight="700" fill="#0369a1" textAnchor="middle">ESTATE</text>
                  <text x="86" y="260" fontSize="8" fontWeight="700" fill="#b45309" textAnchor="middle">CAIXA</text>
                  <text x="214" y="255" fontSize="8" fontWeight="700" fill="#4338ca" textAnchor="middle">ATIVOS</text>
                  <text x="214" y="265" fontSize="8" fontWeight="700" fill="#4338ca" textAnchor="middle">INTERNACIONAIS</text>
                  <rect x="68" y="78" width="36" height="18" rx="9" fill="white" stroke="#b91c1c" strokeWidth="1.2" />
                  <text x="86" y="91" fontSize="9" fontWeight="700" fill="#b91c1c" textAnchor="middle">25%</text>
                  <rect x="196" y="78" width="36" height="18" rx="9" fill="white" stroke="#0369a1" strokeWidth="1.2" />
                  <text x="214" y="91" fontSize="9" fontWeight="700" fill="#0369a1" textAnchor="middle">25%</text>
                  <rect x="196" y="202" width="36" height="18" rx="9" fill="white" stroke="#4338ca" strokeWidth="1.2" />
                  <text x="214" y="215" fontSize="9" fontWeight="700" fill="#4338ca" textAnchor="middle">25%</text>
                  <rect x="68" y="202" width="36" height="18" rx="9" fill="white" stroke="#b45309" strokeWidth="1.2" />
                  <text x="86" y="215" fontSize="9" fontWeight="700" fill="#b45309" textAnchor="middle">25%</text>
                </svg>
              </div>
              <div className="grid gap-2 w-full max-w-xs">
                {PILLAR_ORDER.map((key) => {
                  const p = PILLARS[key];
                  const isActive = selected.has(key);
                  return (
                    <button
                      key={key}
                      onClick={() => setSelected(toggleSet(selected, key))}
                      className={`rounded-xl border px-3 py-2.5 text-left bg-white transition-all duration-300 ${
                        isActive ? `${p.border} -translate-y-0.5 shadow-md` : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg text-[9px] font-bold" style={{ backgroundColor: PILLAR_BG_LIGHT[key], color: PILLAR_COLORS[key] }}>25%</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-gray-900">{p.label}</div>
                          <div className="text-[10px] text-gray-400">{p.role}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {selected.size > 0 && (
                <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-sm p-6 mt-2">
                  {[...selected].map((key, idx) => {
                    const d = PILLARS[key];
                    return (
                      <div key={key}>
                        {idx > 0 && <div className="my-5 h-px bg-gray-200" />}
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-base font-bold ${d.bg} ${d.color}`}>{d.letter}</div>
                          <div>
                            <div className="text-base font-semibold text-gray-900">{d.label}</div>
                            <div className="text-xs text-gray-500">{d.subtitle}</div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed mb-4">{d.description}</p>
                        <div className="text-xs font-medium text-gray-500 mb-2">Exemplos de ativos</div>
                        <div className="flex flex-wrap gap-2">
                          {d.examples.map((ex: string) => (
                            <span key={ex} className={`rounded-full border bg-white px-3 py-1 text-xs font-medium ${d.border} ${d.color}`}>{ex}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* Limites de alocação */}
        <div className="mb-4">
          <div className="text-sm font-semibold text-gray-900 mb-3">Limites de alocação</div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 text-center">
              <div className="text-lg font-bold text-gray-400">15%</div>
              <div className="text-[11px] text-gray-400 mt-1">Mínimo por pilar</div>
            </div>
            <div className="rounded-2xl border border-gray-400 bg-gray-50 shadow-sm p-5 text-center">
              <div className="text-lg font-bold text-gray-900">25%</div>
              <div className="text-[11px] text-gray-500 mt-1">Ideal</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 text-center">
              <div className="text-lg font-bold text-gray-400">40%</div>
              <div className="text-[11px] text-gray-400 mt-1">Máximo por pilar</div>
            </div>
          </div>
        </div>

        {/* Princípio e Rebalanceamento — abaixo */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
            <div className="text-sm font-semibold text-gray-900 mb-2">Princípio fundamental</div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Dividir o patrimônio em 4 classes de ativos com peso igual (25% cada).
              A diversificação inteligente protege contra cenários adversos e permite
              aproveitar oportunidades em qualquer momento do mercado.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
            <div className="text-sm font-semibold text-gray-900 mb-2">Rebalanceamento</div>
            <p className="text-sm text-gray-500 leading-relaxed">
              Periodicamente, redistribuir o portfólio para manter os 25%.
              Isso força a compra de ativos baratos e venda dos valorizados
              — uma forma sistemática de comprar barato e vender caro.
            </p>
          </div>
        </div>

        {/* Bottom navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/80 backdrop-blur-sm p-3">
          <div className="flex gap-3 max-w-5xl mx-auto">
            <button
              onClick={() => router.push("/")}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition"
            >
              Voltar
            </button>
            <button
              disabled
              className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-300 cursor-not-allowed flex items-center justify-center gap-2"
            >
              Avançar
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
