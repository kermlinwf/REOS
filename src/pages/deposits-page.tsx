import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useOpsLists } from "@/hooks/use-ops";
import { formatCents, sumCents } from "@/lib/money";

export function DepositsPage() {
  const { depositEvents, leases, tenants, properties } = useOpsLists();

  const held = sumCents(
    depositEvents
      .filter((e) => e.type === "collected" || e.type === "held")
      .map((e) => e.amount_cents),
  );
  const returned = sumCents(
    depositEvents
      .filter(
        (e) =>
          e.type === "returned" ||
          e.type === "partial_return" ||
          e.type === "applied_to_damages",
      )
      .map((e) => e.amount_cents),
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Security deposits"
        description="Tracked separately so deposits never inflate NOI."
      />
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[var(--color-muted-foreground)]">Held</p>
            <p className="text-xl font-semibold tabular-nums">
              {formatCents(held - returned)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Returned / applied
            </p>
            <p className="text-xl font-semibold tabular-nums">
              {formatCents(returned)}
            </p>
          </CardContent>
        </Card>
      </div>
      <ul className="space-y-2">
        {depositEvents.map((e) => {
          const lease = leases.find((l) => l.id === e.lease_id);
          const tenant = tenants.find((t) => t.id === lease?.tenant_id);
          const property = properties.find((p) => p.id === e.property_id);
          return (
            <li key={e.id}>
              <Card>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{tenant?.full_name ?? "Lease"}</p>
                      <Badge variant="muted">{e.type.replaceAll("_", " ")}</Badge>
                    </div>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      {property?.name} · {e.occurred_on}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums">
                    {formatCents(e.amount_cents)}
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
