import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useOpsLists } from "@/hooks/use-ops";
import { formatCents } from "@/lib/money";

export function MortgagesPage() {
  const { mortgages, properties } = useOpsLists();

  return (
    <div>
      <PageHeader
        title="Mortgages & escrow"
        description="Debt service, rate, balance, and escrow cushion."
      />
      <ul className="space-y-3">
        {mortgages.map((m) => {
          const property = properties.find((p) => p.id === m.property_id);
          return (
            <li key={m.id}>
              <Card>
                <CardContent className="space-y-2 p-4">
                  <p className="font-semibold">
                    {property?.name} · {m.lender}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    <Stat label="Balance" value={formatCents(m.balance_cents)} />
                    <Stat
                      label="Rate"
                      value={`${(m.rate_bps / 100).toFixed(2)}%`}
                    />
                    <Stat label="Payment" value={formatCents(m.payment_cents)} />
                    <Stat
                      label="Escrow"
                      value={formatCents(m.escrow_balance_cents)}
                    />
                  </div>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    Next payment {m.next_payment_on}
                  </p>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--color-muted-foreground)]">{label}</p>
      <p className="font-medium tabular-nums">{value}</p>
    </div>
  );
}
