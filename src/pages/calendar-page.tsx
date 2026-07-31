import { addDays, differenceInCalendarDays, parseISO } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useOpsLists } from "@/hooks/use-ops";

export function CalendarPage() {
  const { leases, tenants, units } = useOpsLists();
  const today = new Date();
  const horizon = addDays(today, 90);

  const upcoming = leases
    .filter((l) => l.end_date && l.status === "active")
    .map((l) => ({
      ...l,
      end: parseISO(l.end_date!),
      days: differenceInCalendarDays(parseISO(l.end_date!), today),
      tenant: tenants.find((t) => t.id === l.tenant_id),
      unit: units.find((u) => u.id === l.unit_id),
    }))
    .filter((l) => l.end <= horizon)
    .sort((a, b) => a.days - b.days);

  return (
    <div>
      <PageHeader
        title="Lease calendar"
        description="Renewals and expirations in the next 90 days."
      />
      {upcoming.length === 0 ? (
        <EmptyState
          title="Nothing soon"
          description="No active leases end within 90 days."
        />
      ) : (
        <ul className="space-y-3">
          {upcoming.map((l) => (
            <li key={l.id}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">
                      {l.tenant?.full_name} · {l.unit?.label}
                    </p>
                    <Badge variant={l.days <= 30 ? "warning" : "muted"}>
                      {l.days < 0 ? "Expired" : `${l.days}d`}
                    </Badge>
                  </div>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    Ends {l.end_date}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
