import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useOpsLists } from "@/hooks/use-ops";
import { computeFinancialSummary, formatCapRate } from "@/lib/finance";
import { formatCents } from "@/lib/money";

export function PropertyPnlPage() {
  const { properties, transactions } = useOpsLists();
  const [propertyId, setPropertyId] = React.useState(
    properties[0]?.id ?? "",
  );

  React.useEffect(() => {
    if (!propertyId && properties[0]) setPropertyId(properties[0].id);
  }, [properties, propertyId]);

  const property = properties.find((p) => p.id === propertyId);
  const lines = transactions.filter((t) => t.property_id === propertyId);
  const summary = computeFinancialSummary(
    lines.map((t) => ({
      category: t.category,
      amount_cents: t.amount_cents,
      type: t.type,
    })),
    property?.purchase_price_cents ?? null,
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Property P&L"
        description="One-tap operating statement per asset."
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
        <Metric label="Gross income" value={formatCents(summary.grossIncomeCents)} />
        <Metric label="OpEx" value={formatCents(summary.operatingExpensesCents)} />
        <Metric label="NOI" value={formatCents(summary.noiCents)} />
        <Metric label="CapEx" value={formatCents(summary.capexCents)} />
        <Metric label="Debt service" value={formatCents(summary.debtServiceCents)} />
        <Metric label="Cash flow" value={formatCents(summary.netCashFlowCents)} />
        <Metric label="Cap rate" value={formatCapRate(summary.capRate)} />
        <Metric
          label="Basis"
          value={
            property?.purchase_price_cents != null
              ? formatCents(property.purchase_price_cents)
              : "—"
          }
        />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-[var(--color-muted-foreground)]">{label}</p>
        <p
          className="text-lg font-semibold tabular-nums"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
