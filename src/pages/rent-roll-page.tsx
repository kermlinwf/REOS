import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOpsLists } from "@/hooks/use-ops";
import { demoMarkRentPaid } from "@/lib/demo-store";
import { formatCents } from "@/lib/money";
import { useToast } from "@/components/ui/toast";

export function RentRollPage() {
  const { rentPayments, leases, tenants, units, properties, reload } =
    useOpsLists();
  const { toast } = useToast();

  function meta(leaseId: string) {
    const lease = leases.find((l) => l.id === leaseId);
    const tenant = tenants.find((t) => t.id === lease?.tenant_id);
    const unit = units.find((u) => u.id === lease?.unit_id);
    const property = properties.find((p) => p.id === unit?.property_id);
    return { tenant, unit, property };
  }

  return (
    <div>
      <PageHeader
        title="Rent roll"
        description="Collections for the current period — mark paid to post to the ledger."
      />
      <ul className="space-y-3">
        {rentPayments.map((p) => {
          const { tenant, unit, property } = meta(p.lease_id);
          return (
            <li key={p.id}>
              <Card>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">
                        {tenant?.full_name ?? "Tenant"} · {unit?.label}
                      </p>
                      <Badge
                        variant={
                          p.status === "paid"
                            ? "success"
                            : p.status === "due"
                              ? "warning"
                              : "muted"
                        }
                      >
                        {p.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      {property?.name} · {p.period}
                    </p>
                    <p className="mt-1 text-sm tabular-nums">
                      Due {formatCents(p.due_cents)}
                      {p.paid_cents
                        ? ` · Paid ${formatCents(p.paid_cents)}`
                        : ""}
                    </p>
                  </div>
                  {p.status !== "paid" ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        demoMarkRentPaid(p.id);
                        reload();
                        toast({ title: "Rent marked paid", variant: "success" });
                      }}
                    >
                      Mark paid
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
