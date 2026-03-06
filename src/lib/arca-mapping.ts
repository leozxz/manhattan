export type ArcaPillar = "acoes" | "realestate" | "caixa" | "internacionais" | "outro";

export interface PillarAllocation {
  balance: number;
  percentage: number;
  investments: { name: string; balance: number; type: string; subtype: string | null }[];
}

interface PluggyInvestment {
  name: string;
  balance: number;
  type: string;
  subtype: string | null;
}

function classifyInvestment(type: string, subtype: string | null): ArcaPillar {
  const t = type.toUpperCase();
  const s = (subtype ?? "").toUpperCase();

  // Fixed income → Caixa
  if (t === "FIXED_INCOME") return "caixa";

  // COE → Caixa
  if (t === "COE") return "caixa";

  // ETF (top-level type) → Acoes
  if (t === "ETF") return "acoes";

  // Security
  if (t === "SECURITY") {
    if (s === "RETIREMENT") return "caixa";
    return "outro";
  }

  // Equity
  if (t === "EQUITY") {
    if (s === "REAL_ESTATE_FUND") return "realestate";
    if (s === "BDR") return "internacionais";
    // STOCK, ETF, DERIVATIVES, OPTION
    return "acoes";
  }

  // Mutual Fund
  if (t === "MUTUAL_FUND") {
    if (s === "FIXED_INCOME_FUND") return "caixa";
    if (s === "OFFSHORE_FUND" || s === "EXCHANGE_FUND") return "internacionais";
    if (s === "FI_INFRA" || s === "FI_AGRO") return "realestate";
    // STOCK_FUND, MULTIMARKET_FUND, INVESTMENT_FUND, FIP_FUND, ETF_FUND
    return "acoes";
  }

  if (t === "OTHER") return "outro";

  return "outro";
}

export function mapInvestmentsToPillars(
  investments: PluggyInvestment[]
): Record<ArcaPillar, PillarAllocation> {
  const result: Record<ArcaPillar, PillarAllocation> = {
    acoes: { balance: 0, percentage: 0, investments: [] },
    realestate: { balance: 0, percentage: 0, investments: [] },
    caixa: { balance: 0, percentage: 0, investments: [] },
    internacionais: { balance: 0, percentage: 0, investments: [] },
    outro: { balance: 0, percentage: 0, investments: [] },
  };

  let total = 0;

  for (const inv of investments) {
    const pillar = classifyInvestment(inv.type, inv.subtype);
    result[pillar].balance += inv.balance;
    result[pillar].investments.push({
      name: inv.name,
      balance: inv.balance,
      type: inv.type,
      subtype: inv.subtype,
    });
    total += inv.balance;
  }

  if (total > 0) {
    for (const key of Object.keys(result) as ArcaPillar[]) {
      result[key].percentage = (result[key].balance / total) * 100;
    }
  }

  return result;
}
