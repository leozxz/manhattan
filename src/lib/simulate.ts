// Simulated data generator for the bank simulator

interface SimulationInput {
  bankName: string;
  accountName: string;
  balance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  categories: string[];
}

interface CategoryData {
  name: string;
  amount: number;
}

interface TransactionEntry {
  date: string;
  description: string;
  category: string;
  amount: number;
  accountId: string;
}

interface MonthSummary {
  income: number;
  expenses: number;
  categories: CategoryData[];
  incomeTx: TransactionEntry[];
  expenseTx: TransactionEntry[];
}

interface AccountData {
  id: string;
  name: string;
  balance: number;
  type: string;
  currencyCode: string;
}

interface OverviewData {
  totalBalance: number;
  accounts: Record<string, AccountData[]>;
  thisMonth: MonthSummary;
  lastMonth: MonthSummary;
}

const DESCRIPTIONS: Record<string, string[]> = {
  Alimentação: [
    "iFood",
    "Supermercado Extra",
    "Padaria Pão Quente",
    "Restaurante Sabor & Arte",
    "Uber Eats",
    "Mercado Livre - Alimentos",
  ],
  Transporte: [
    "Uber",
    "99",
    "Posto Shell - Combustível",
    "Estacionamento Centro",
    "Recarga Bilhete Único",
    "Pedágio Via Rápida",
  ],
  Moradia: [
    "Aluguel",
    "Condomínio",
    "CPFL Energia",
    "Sabesp - Água",
    "Comgás",
    "Internet Vivo Fibra",
  ],
  Saúde: [
    "Drogasil",
    "Consulta Dr. Silva",
    "Plano de Saúde Unimed",
    "Farmácia Pacheco",
    "Laboratório Fleury",
  ],
  Lazer: [
    "Netflix",
    "Spotify",
    "Cinema Cinemark",
    "Bar do Zé",
    "Ingresso.com",
    "Steam Games",
  ],
  Educação: [
    "Udemy",
    "Mensalidade Faculdade",
    "Livraria Cultura",
    "Curso de Inglês",
    "Alura",
  ],
  Compras: [
    "Amazon",
    "Magazine Luiza",
    "Shopee",
    "Renner",
    "Mercado Livre",
    "Americanas",
  ],
  Serviços: [
    "Barbeiro",
    "Lavanderia",
    "Contabilidade",
    "Assinatura iCloud",
    "Manutenção Carro",
    "Seguro Auto",
  ],
};

const INCOME_DESCRIPTIONS = [
  "Salário",
  "Freelance",
  "Rendimento Investimentos",
  "Transferência recebida",
  "Cashback",
];

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(year: number, month: number): string {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const day = randInt(1, daysInMonth);
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function distributeProportion(total: number, n: number): number[] {
  const weights = Array.from({ length: n }, () => rand(0.5, 2));
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => Math.round((w / sum) * total * 100) / 100);
}

function generateMonth(
  input: SimulationInput,
  accountId: string,
  expenses: number,
  income: number,
  year: number,
  month: number,
): MonthSummary {
  const { categories } = input;

  // Distribute expenses across categories
  const amounts = distributeProportion(expenses, categories.length);
  const categoryData: CategoryData[] = categories.map((name, i) => ({
    name,
    amount: amounts[i],
  }));

  // Generate expense transactions
  const expenseTx: TransactionEntry[] = [];
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const catAmount = amounts[i];
    const txCount = randInt(3, 6);
    const txAmounts = distributeProportion(catAmount, txCount);
    const descs = DESCRIPTIONS[cat] || [`Pagamento ${cat}`];

    for (let j = 0; j < txCount; j++) {
      expenseTx.push({
        date: randomDate(year, month),
        description: pick(descs),
        category: cat,
        amount: txAmounts[j],
        accountId,
      });
    }
  }

  // Sort by date
  expenseTx.sort((a, b) => a.date.localeCompare(b.date));

  // Generate income transactions
  const incomeTxCount = randInt(1, 3);
  const incomeAmounts = distributeProportion(income, incomeTxCount);
  const incomeTx: TransactionEntry[] = incomeAmounts.map((amount, i) => ({
    date: randomDate(year, month),
    description: i === 0 ? "Salário" : pick(INCOME_DESCRIPTIONS.slice(1)),
    category: "Receita",
    amount,
    accountId,
  }));
  incomeTx.sort((a, b) => a.date.localeCompare(b.date));

  return {
    income,
    expenses,
    categories: categoryData.sort((a, b) => b.amount - a.amount),
    incomeTx,
    expenseTx,
  };
}

export function generateSimulatedOverview(
  input: SimulationInput,
): OverviewData {
  const accountId = `sim-acc-${Date.now()}`;
  const itemId = `sim-${Date.now()}`;

  const account: AccountData = {
    id: accountId,
    name: input.accountName,
    balance: input.balance,
    type: "BANK",
    currencyCode: "BRL",
  };

  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonthIdx = now.getMonth();
  const lastMonthDate = new Date(thisYear, thisMonthIdx - 1, 1);

  const thisMonth = generateMonth(
    input,
    accountId,
    input.monthlyExpenses,
    input.monthlyIncome,
    thisYear,
    thisMonthIdx,
  );

  // Last month with ±15% variation
  const variation = () => rand(0.85, 1.15);
  const lastMonth = generateMonth(
    input,
    accountId,
    Math.round(input.monthlyExpenses * variation()),
    Math.round(input.monthlyIncome * variation()),
    lastMonthDate.getFullYear(),
    lastMonthDate.getMonth(),
  );

  return {
    totalBalance: input.balance,
    accounts: { [itemId]: [account] },
    thisMonth,
    lastMonth,
  };
}

export type { SimulationInput, OverviewData };
