import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { useOpsLists } from "@/hooks/use-ops";
import { demoAddTicket, demoUpdateTicket } from "@/lib/demo-store";
import { formatCents, parseDollarsInput } from "@/lib/money";
import { useToast } from "@/components/ui/toast";

export function MaintenancePage() {
  const { user } = useAuth();
  const { tickets, properties, units, vendors, reload } = useOpsLists();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [propertyId, setPropertyId] = React.useState("");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Maintenance"
        description="Tickets → vendor → cost → close."
        action={
          <Button size="sm" onClick={() => setOpen((v) => !v)}>
            New
          </Button>
        }
      />
      {open ? (
        <Card>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Property</Label>
              <select
                className="flex h-11 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
              >
                <option value="">Select…</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={() => {
                if (!user || !title || !propertyId) return;
                demoAddTicket(
                  {
                    property_id: propertyId,
                    unit_id: null,
                    vendor_id: null,
                    title,
                    description: null,
                    status: "open",
                    priority: "normal",
                    cost_cents: null,
                    opened_on: new Date().toISOString().slice(0, 10),
                    closed_on: null,
                  },
                  user.id,
                );
                setTitle("");
                setOpen(false);
                reload();
                toast({ title: "Ticket opened", variant: "success" });
              }}
            >
              Save ticket
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <ul className="space-y-3">
        {tickets.map((t) => {
          const property = properties.find((p) => p.id === t.property_id);
          const unit = units.find((u) => u.id === t.unit_id);
          const vendor = vendors.find((v) => v.id === t.vendor_id);
          return (
            <li key={t.id}>
              <Card>
                <CardContent className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{t.title}</p>
                    <Badge
                      variant={
                        t.status === "closed"
                          ? "muted"
                          : t.priority === "high" || t.priority === "urgent"
                            ? "warning"
                            : "default"
                      }
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {property?.name}
                    {unit ? ` · ${unit.label}` : ""}
                    {vendor ? ` · ${vendor.name}` : ""}
                    {t.cost_cents != null
                      ? ` · ${formatCents(t.cost_cents)}`
                      : ""}
                  </p>
                  {t.status !== "closed" ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          demoUpdateTicket(t.id, { status: "in_progress" });
                          reload();
                        }}
                      >
                        In progress
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          const cost = parseDollarsInput(
                            window.prompt("Cost ($)?", "0") ?? "0",
                          );
                          demoUpdateTicket(t.id, {
                            status: "closed",
                            closed_on: new Date().toISOString().slice(0, 10),
                            cost_cents: cost,
                          });
                          reload();
                        }}
                      >
                        Close
                      </Button>
                    </div>
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
