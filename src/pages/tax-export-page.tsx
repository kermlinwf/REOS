import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOpsLists } from "@/hooks/use-ops";
import { computeFinancialSummary } from "@/lib/finance";
import { formatCents } from "@/lib/money";
import { TRANSACTION_CATEGORY_LABELS } from "@/types/database";
import { useToast } from "@/components/ui/toast";

export function TaxExportPage() {
  const { transactions, properties, mortgages } = useOpsLists();
  const { toast } = useToast();
  const year = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = React.useState(String(year));

  const rows = transactions.filter((t) =>
    t.occurred_on.startsWith(selectedYear),
  );

  function downloadCsv() {
    const header = [
      "date",
      "property",
      "type",
      "category",
      "amount_dollars",
      "description",
    ];
    const lines = rows.map((t) => {
      const property = properties.find((p) => p.id === t.property_id);
      return [
        t.occurred_on,
        csv(property?.name ?? ""),
        t.type,
        csv(TRANSACTION_CATEGORY_LABELS[t.category] ?? t.category),
        (t.amount_cents / 100).toFixed(2),
        csv(t.description ?? ""),
      ].join(",");
    });
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reos-schedule-e-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV downloaded", variant: "success" });
  }

  const byProperty = properties.map((p) => {
    const lines = rows.filter((t) => t.property_id === p.id);
    const monthlyMortgage = mortgages
      .filter((m) => m.property_id === p.id)
      .reduce((acc, m) => acc + m.payment_cents, 0);
    const summary = computeFinancialSummary(
      lines.map((t) => ({
        category: t.category,
        amount_cents: t.amount_cents,
        type: t.type,
        occurred_on: t.occurred_on,
      })),
      p.purchase_price_cents,
      { monthlyMortgagePaymentsCents: monthlyMortgage },
    );
    return { p, summary, count: lines.length };
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tax export"
        description="Schedule E–friendly CSV by property and category."
        action={
          <Button size="sm" onClick={downloadCsv}>
            Download CSV
          </Button>
        }
      />
      <label className="flex items-center gap-2 text-sm">
        Year
        <select
          className="h-11 rounded-md border bg-white px-3"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {[year, year - 1, year - 2].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </label>
      <ul className="space-y-3">
        {byProperty.map(({ p, summary, count }) => (
          <li key={p.id}>
            <Card>
              <CardContent className="space-y-1 p-4 text-sm">
                <p className="font-semibold">{p.name}</p>
                <p>{count} ledger lines</p>
                <p>Income {formatCents(summary.grossIncomeCents)}</p>
                <p>OpEx {formatCents(summary.operatingExpensesCents)}</p>
                <p>NOI {formatCents(summary.noiCents)}</p>
                <p>Debt {formatCents(summary.debtServiceCents)}</p>
                <p>Cash flow {formatCents(summary.netCashFlowCents)}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

function csv(value: string) {
  if (value.includes(",") || value.includes('"')) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}
