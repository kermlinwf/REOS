import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { TermHelp } from "@/components/term-help";
import { useOpsLists } from "@/hooks/use-ops";
import {
  computeFinancialSummary,
  computeUnitCashFlows,
  formatCapRate,
  sumMonthlyMortgagePayments,
} from "@/lib/finance";
import { formatCents } from "@/lib/money";

export function PropertyPnlPage() {
  const { properties, transactions, units, mortgages } = useOpsLists();
  const [propertyId, setPropertyId] = React.useState(
    properties[0]?.id ?? "",
  );

  React.useEffect(() => {
    if (!propertyId && properties[0]) setPropertyId(properties[0].id);
  }, [properties, propertyId]);

  const property = properties.find((p) => p.id === propertyId);
  const lines = transactions.filter((t) => t.property_id === propertyId);
  const propertyUnits = units.filter((u) => u.property_id === propertyId);
  const monthlyMortgage = sumMonthlyMortgagePayments(mortgages, propertyId);

  const ledgerLines = lines.map((t) => ({
    category: t.category,
    amount_cents: t.amount_cents,
    type: t.type,
    unit_id: t.unit_id,
    occurred_on: t.occurred_on,
  }));

  const summary = computeFinancialSummary(
    ledgerLines,
    property?.purchase_price_cents ?? null,
    { monthlyMortgagePaymentsCents: monthlyMortgage },
  );

  const unitRows = computeUnitCashFlows(
    propertyUnits.map((u) => ({ id: u.id, label: u.label })),
    ledgerLines,
    { monthlyMortgagePaymentsCents: monthlyMortgage },
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Property P&L"
        description="Operating statement per asset. Mortgage payments reduce cash flow (not NOI)."
      />
      <select
        className="flex h-11 w-full max-w-md rounded-md border bg-white px-3 text-sm"
        value={propertyId}
        onChange={(e) => setPropertyId(e.target.value)}
      >
        {properties.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Metric
          label="Gross income"
          value={formatCents(summary.grossIncomeCents)}
          helpTerm="Gross income"
        />
        <Metric
          label="OpEx"
          value={formatCents(summary.operatingExpensesCents)}
          helpTerm="OpEx"
        />
        <Metric
          label="NOI"
          value={formatCents(summary.noiCents)}
          helpTerm="NOI"
        />
        <Metric
          label="CapEx"
          value={formatCents(summary.capexCents)}
          helpTerm="CapEx"
        />
        <Metric
          label="Debt service"
          value={formatCents(summary.debtServiceCents)}
          helpTerm="Debt service"
          hint={
            summary.debtFromMortgageModule
              ? "From Mortgages screen"
              : undefined
          }
        />
        <Metric
          label="Cash flow"
          value={formatCents(summary.netCashFlowCents)}
          helpTerm="Cash flow"
        />
        <Metric
          label="Cap rate"
          value={formatCapRate(summary.capRate)}
          helpTerm="Cap rate"
        />
        <Metric
          label="Basis"
          helpTerm="Basis"
          value={
            property?.purchase_price_cents != null
              ? formatCents(property.purchase_price_cents)
              : "—"
          }
        />
      </div>

      {unitRows.length > 0 ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <div>
              <p className="font-medium">By unit (cash flow)</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Building costs and mortgage are split evenly across units so
                financed units don’t look richer than they are.
              </p>
            </div>
            <ul className="divide-y divide-[var(--color-border)]">
              {unitRows.map((row) => (
                <li
                  key={row.unitId}
                  className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm"
                >
                  <span className="font-medium">{row.label}</span>
                  <span className="flex flex-wrap gap-x-4 gap-y-1 tabular-nums text-[var(--color-muted-foreground)]">
                    <span>Income {formatCents(row.grossIncomeCents)}</span>
                    <span>Debt {formatCents(row.debtServiceCents)}</span>
                    <span
                      className={
                        row.netCashFlowCents >= 0
                          ? "font-semibold text-[var(--color-foreground)]"
                          : "font-semibold text-red-700"
                      }
                    >
                      Cash {formatCents(row.netCashFlowCents)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  helpTerm,
  hint,
}: {
  label: string;
  value: string;
  helpTerm?: string;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
          {label}
          {helpTerm ? <TermHelp term={helpTerm} /> : null}
        </p>
        <p
          className="text-lg font-semibold tabular-nums"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {value}
        </p>
        {hint ? (
          <p className="mt-0.5 text-[10px] text-[var(--color-muted-foreground)]">
            {hint}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
