import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOpsLists } from "@/hooks/use-ops";
import { demoPostRecurringBill } from "@/lib/demo-store";
import { formatCents } from "@/lib/money";
import { useToast } from "@/components/ui/toast";

export function RecurringPage() {
  const { recurringBills, properties, reload } = useOpsLists();
  const { toast } = useToast();

  return (
    <div>
      <PageHeader
        title="Recurring bills"
        description="Insurance, lawn, HOA — post to the ledger when due."
      />
      <ul className="space-y-3">
        {recurringBills.map((b) => {
          const property = properties.find((p) => p.id === b.property_id);
          return (
            <li key={b.id}>
              <Card>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{b.name}</p>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      {property?.name} · day {b.day_of_month} ·{" "}
                      {formatCents(b.amount_cents)} · {b.category}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!b.active}
                    onClick={() => {
                      demoPostRecurringBill(b.id);
                      reload();
                      toast({ title: "Posted to ledger", variant: "success" });
                    }}
                  >
                    Post now
                  </Button>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
