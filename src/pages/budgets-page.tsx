import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useOpsLists } from "@/hooks/use-ops";
import { formatCents, sumCents } from "@/lib/money";
import { TRANSACTION_CATEGORY_LABELS } from "@/types/database";

export function BudgetsPage() {
  const { budgets, transactions, properties } = useOpsLists();
  const year = new Date().getFullYear();

  return (
    <div>
      <PageHeader
        title="Budgets"
        description={`OpEx / CapEx plans vs actuals for ${year}.`}
      />
      <ul className="space-y-3">
        {budgets
          .filter((b) => b.year === year)
          .map((b) => {
            const property = properties.find((p) => p.id === b.property_id);
            const actual = sumCents(
              transactions
                .filter(
                  (t) =>
                    t.property_id === b.property_id &&
                    t.type === "expense" &&
                    t.category === b.category &&
                    t.occurred_on.startsWith(String(year)),
                )
                .map((t) => t.amount_cents),
            );
            const pct =
              b.amount_cents > 0
                ? Math.round((actual / b.amount_cents) * 100)
                : 0;
            return (
              <li key={b.id}>
                <Card>
                  <CardContent className="space-y-2 p-4">
                    <p className="font-semibold">
                      {property?.name} ·{" "}
                      {TRANSACTION_CATEGORY_LABELS[b.category] ?? b.category}{" "}
                      <span className="text-xs font-normal uppercase text-[var(--color-muted-foreground)]">
                        {b.kind}
                      </span>
                    </p>
                    <p className="text-sm tabular-nums">
                      {formatCents(actual)} / {formatCents(b.amount_cents)} (
                      {pct}%)
                    </p>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--color-muted)]">
                      <div
                        className="h-full bg-[var(--color-accent)]"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
