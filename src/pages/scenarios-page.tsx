import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TermHelp } from "@/components/term-help";
import { useOpsLists } from "@/hooks/use-ops";
import { computeFinancialSummary, formatCapRate } from "@/lib/finance";
import { formatCents } from "@/lib/money";

export function ScenariosPage() {
  const { transactions, properties, mortgages } = useOpsLists();
  const [rentBump, setRentBump] = React.useState("5");
  const [price, setPrice] = React.useState("");

  const basis =
    properties.reduce((a, p) => a + (p.purchase_price_cents ?? 0), 0) || null;

  const monthlyMortgage = mortgages.reduce(
    (acc, m) => acc + m.payment_cents,
    0,
  );
  const base = computeFinancialSummary(
    transactions.map((t) => ({
      category: t.category,
      amount_cents: t.amount_cents,
      type: t.type,
      occurred_on: t.occurred_on,
    })),
    basis,
    { monthlyMortgagePaymentsCents: monthlyMortgage },
  );

  const bump = Number(rentBump) || 0;
  const scenarioIncome = Math.round(
    base.grossIncomeCents * (1 + bump / 100),
  );
  const scenarioNoi =
    scenarioIncome - base.operatingExpensesCents;
  const scenarioPrice = price
    ? Math.round(Number(price) * 100)
    : basis;
  const scenarioCap =
    scenarioPrice && scenarioPrice > 0
      ? scenarioNoi / scenarioPrice
      : null;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Scenarios"
        description="What-if rent bumps and refinance / buy basis."
      />
      <Card>
        <CardHeader>
          <CardTitle>Assumptions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Rent / income bump %</Label>
            <Input
              inputMode="decimal"
              value={rentBump}
              onChange={(e) => setRentBump(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Alternate basis ($)</Label>
            <Input
              inputMode="decimal"
              placeholder={basis ? String(basis / 100) : "Purchase price"}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-medium text-[var(--color-muted-foreground)]">
              Current
            </p>
            <Row label="Gross income" value={formatCents(base.grossIncomeCents)} />
            <Row label="NOI" value={formatCents(base.noiCents)} />
            <Row label="Cap rate" value={formatCapRate(base.capRate)} />
            <Row
              label="Cash flow"
              value={formatCents(base.netCashFlowCents)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-medium text-[var(--color-accent)]">
              Scenario (+{bump}%)
            </p>
            <Row label="Gross income" value={formatCents(scenarioIncome)} />
            <Row label="NOI" value={formatCents(scenarioNoi)} />
            <Row label="Cap rate" value={formatCapRate(scenarioCap)} />
            <Row
              label="Cash flow"
              value={formatCents(
                scenarioNoi - base.capexCents - base.debtServiceCents,
              )}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="inline-flex items-center gap-1 text-[var(--color-muted-foreground)]">
        {label}
        <TermHelp term={label} />
      </span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
