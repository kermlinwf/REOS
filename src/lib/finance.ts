import type { Cents } from "./money";
import { sumCents } from "./money";

/** Revenue categories that count toward Gross Operating Income */
export const REVENUE_CATEGORIES = [
  "rent",
  "fees",
  "other_income",
] as const;

/** OpEx categories for NOI (excludes CapEx, debt service, deposits) */
export const OPEX_CATEGORIES = [
  "opex",
  "maintenance",
  "utilities",
  "insurance",
  "property_tax",
  "management",
] as const;

export const CAPEX_CATEGORIES = ["capex"] as const;
export const DEBT_CATEGORIES = ["mortgage", "debt_service"] as const;
export const DEPOSIT_CATEGORIES = ["security_deposit"] as const;

export type TransactionCategory =
  | (typeof REVENUE_CATEGORIES)[number]
  | (typeof OPEX_CATEGORIES)[number]
  | (typeof CAPEX_CATEGORIES)[number]
  | (typeof DEBT_CATEGORIES)[number]
  | (typeof DEPOSIT_CATEGORIES)[number]
  | "other_expense";

export interface LedgerLine {
  category: string;
  amount_cents: Cents;
  type: "income" | "expense";
}

export interface FinancialSummary {
  grossIncomeCents: Cents;
  operatingExpensesCents: Cents;
  noiCents: Cents;
  capexCents: Cents;
  debtServiceCents: Cents;
  netCashFlowCents: Cents;
  /** Cap rate as decimal (e.g. 0.065 = 6.5%). Null if no purchase price. */
  capRate: number | null;
}

function isIn(list: readonly string[], category: string): boolean {
  return (list as readonly string[]).includes(category);
}

export function computeFinancialSummary(
  lines: LedgerLine[],
  purchasePriceCents: Cents | null = null,
): FinancialSummary {
  const income = lines.filter((l) => l.type === "income");
  const expenses = lines.filter((l) => l.type === "expense");

  const grossIncomeCents = sumCents(
    income
      .filter(
        (l) =>
          isIn(REVENUE_CATEGORIES, l.category) || l.category === "other_income",
      )
      .map((l) => l.amount_cents),
  );

  const operatingExpensesCents = sumCents(
    expenses
      .filter((l) => isIn(OPEX_CATEGORIES, l.category))
      .map((l) => l.amount_cents),
  );

  const capexCents = sumCents(
    expenses
      .filter((l) => isIn(CAPEX_CATEGORIES, l.category))
      .map((l) => l.amount_cents),
  );

  const debtServiceCents = sumCents(
    expenses
      .filter((l) => isIn(DEBT_CATEGORIES, l.category))
      .map((l) => l.amount_cents),
  );

  const noiCents = grossIncomeCents - operatingExpensesCents;
  const netCashFlowCents = noiCents - capexCents - debtServiceCents;

  const capRate =
    purchasePriceCents && purchasePriceCents > 0
      ? noiCents / purchasePriceCents
      : null;

  return {
    grossIncomeCents,
    operatingExpensesCents,
    noiCents,
    capexCents,
    debtServiceCents,
    netCashFlowCents,
    capRate,
  };
}

export function formatCapRate(capRate: number | null): string {
  if (capRate === null) return "—";
  return `${(capRate * 100).toFixed(2)}%`;
}
