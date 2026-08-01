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
  "other_expense",
] as const;

export const CAPEX_CATEGORIES = ["capex"] as const;
export const DEBT_CATEGORIES = ["mortgage", "debt_service"] as const;
export const DEPOSIT_CATEGORIES = ["security_deposit"] as const;

export type TransactionCategory =
  | (typeof REVENUE_CATEGORIES)[number]
  | (typeof OPEX_CATEGORIES)[number]
  | (typeof CAPEX_CATEGORIES)[number]
  | (typeof DEBT_CATEGORIES)[number]
  | (typeof DEPOSIT_CATEGORIES)[number];

export interface LedgerLine {
  category: string;
  amount_cents: Cents;
  type: "income" | "expense";
  unit_id?: string | null;
  occurred_on?: string;
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
  /** True when Mortgages-module payments were used (ledger had no debt lines). */
  debtFromMortgageModule: boolean;
}

export interface FinanceOptions {
  /**
   * Sum of monthly payments from the Mortgages screen.
   * Used only when the ledger has no mortgage/debt_service lines
   * so we don't double-count.
   */
  monthlyMortgagePaymentsCents?: Cents;
  /**
   * Months to apply those payments. Defaults to distinct months in the
   * ledger lines, or 1 when empty.
   */
  mortgageMonthCount?: number;
}

function isIn(list: readonly string[], category: string): boolean {
  return (list as readonly string[]).includes(category);
}

/** Distinct YYYY-MM values (min 1 when empty unless minOne is false). */
export function ledgerMonthCount(
  occurredOns: (string | undefined | null)[],
  { minOne = true }: { minOne?: boolean } = {},
): number {
  const months = new Set(
    occurredOns
      .filter((d): d is string => Boolean(d && d.length >= 7))
      .map((d) => d.slice(0, 7)),
  );
  if (months.size === 0) return minOne ? 1 : 0;
  return months.size;
}

export function sumMonthlyMortgagePayments(
  mortgages: { payment_cents: number; property_id?: string }[],
  propertyId?: string,
): Cents {
  return sumCents(
    mortgages
      .filter((m) => !propertyId || m.property_id === propertyId)
      .map((m) => m.payment_cents),
  );
}

export function computeFinancialSummary(
  lines: LedgerLine[],
  purchasePriceCents: Cents | null = null,
  options: FinanceOptions = {},
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

  const ledgerDebtCents = sumCents(
    expenses
      .filter((l) => isIn(DEBT_CATEGORIES, l.category))
      .map((l) => l.amount_cents),
  );

  const monthly = options.monthlyMortgagePaymentsCents ?? 0;
  const months =
    options.mortgageMonthCount ??
    ledgerMonthCount(lines.map((l) => l.occurred_on));
  const moduleDebtCents = monthly > 0 ? monthly * Math.max(1, months) : 0;

  const debtFromMortgageModule = ledgerDebtCents === 0 && moduleDebtCents > 0;
  const debtServiceCents = debtFromMortgageModule
    ? moduleDebtCents
    : ledgerDebtCents;

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
    debtFromMortgageModule,
  };
}

export interface UnitCashFlowRow {
  unitId: string;
  label: string;
  grossIncomeCents: Cents;
  operatingExpensesCents: Cents;
  noiCents: Cents;
  debtServiceCents: Cents;
  netCashFlowCents: Cents;
}

/**
 * Per-unit cash view: unit-tagged lines plus an equal share of property-level
 * (no unit) OpEx, CapEx, and debt so a building mortgage hits every unit.
 */
export function computeUnitCashFlows(
  units: { id: string; label: string }[],
  lines: LedgerLine[],
  options: FinanceOptions = {},
): UnitCashFlowRow[] {
  if (units.length === 0) return [];

  const propertyLines = lines.filter((l) => !l.unit_id);
  const propertySummary = computeFinancialSummary(propertyLines, null, options);
  const n = units.length;
  const shareOpex = Math.round(propertySummary.operatingExpensesCents / n);
  const shareCapex = Math.round(propertySummary.capexCents / n);
  const shareDebt = Math.round(propertySummary.debtServiceCents / n);

  return units.map((unit) => {
    const unitLines = lines.filter((l) => l.unit_id === unit.id);
    const own = computeFinancialSummary(unitLines, null, {
      monthlyMortgagePaymentsCents: 0,
    });
    const operatingExpensesCents = own.operatingExpensesCents + shareOpex;
    const noiCents = own.grossIncomeCents - operatingExpensesCents;
    const debtServiceCents = own.debtServiceCents + shareDebt;
    const netCashFlowCents =
      noiCents - own.capexCents - shareCapex - debtServiceCents;

    return {
      unitId: unit.id,
      label: unit.label,
      grossIncomeCents: own.grossIncomeCents,
      operatingExpensesCents,
      noiCents,
      debtServiceCents,
      netCashFlowCents,
    };
  });
}

export function formatCapRate(capRate: number | null): string {
  if (capRate === null) return "—";
  return `${(capRate * 100).toFixed(2)}%`;
}
