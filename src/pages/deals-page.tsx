import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { useOpsLists } from "@/hooks/use-ops";
import {
  demoAddDeal,
  demoDeleteDeal,
  demoUpdateDeal,
} from "@/lib/demo-store";
import { formatCents, parseDollarsInput } from "@/lib/money";
import { formatCapRate } from "@/lib/finance";
import { useToast } from "@/components/ui/toast";
import { confirmDelete, RowActions } from "@/components/row-actions";
import type { DealStage } from "@/types/ops";

const stages: DealStage[] = [
  "lead",
  "underwriting",
  "offer",
  "under_contract",
  "closed",
  "dead",
];

export function DealsPage() {
  const { user } = useAuth();
  const { deals, reload } = useOpsLists();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    address: "",
    city: "",
    state: "",
    asking: "",
    offer: "",
    noi: "",
    notes: "",
  });

  function reset() {
    setOpen(false);
    setForm({
      name: "",
      address: "",
      city: "",
      state: "",
      asking: "",
      offer: "",
      noi: "",
      notes: "",
    });
  }

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    const asking = form.asking ? parseDollarsInput(form.asking) : null;
    const offer = form.offer ? parseDollarsInput(form.offer) : null;
    const noi = form.noi ? parseDollarsInput(form.noi) : null;
    if (form.asking && asking === null) {
      toast({ title: "Bad asking price", variant: "destructive" });
      return;
    }
    if (form.offer && offer === null) {
      toast({ title: "Bad offer price", variant: "destructive" });
      return;
    }
    if (form.noi && noi === null) {
      toast({ title: "Bad estimated NOI", variant: "destructive" });
      return;
    }
    demoAddDeal(
      {
        name: form.name.trim(),
        address: form.address.trim() || "—",
        city: form.city.trim() || "—",
        state: form.state.trim() || "—",
        asking_price_cents: asking,
        offer_price_cents: offer,
        estimated_noi_cents: noi,
        estimated_rent_cents: null,
        stage: "lead",
        notes: form.notes.trim() || null,
      },
      user.id,
    );
    toast({ title: "Deal added", variant: "success" });
    reset();
    reload();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Deal pipeline"
        description="Underwrite acquisitions with the same NOI / cap-rate lens."
        action={
          <Button size="sm" onClick={() => (open ? reset() : setOpen(true))}>
            {open ? "Cancel" : "Add"}
          </Button>
        }
      />

      {open ? (
        <Card>
          <CardContent className="p-4">
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSave}>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Deal name</Label>
                <Input
                  required
                  placeholder="123 Main duplex"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Asking ($)</Label>
                <Input
                  inputMode="decimal"
                  value={form.asking}
                  onChange={(e) =>
                    setForm({ ...form, asking: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Your offer ($)</Label>
                <Input
                  inputMode="decimal"
                  value={form.offer}
                  onChange={(e) => setForm({ ...form, offer: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Estimated yearly NOI ($)</Label>
                <Input
                  inputMode="decimal"
                  value={form.noi}
                  onChange={(e) => setForm({ ...form, noi: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Notes</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">Save deal</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {deals.length === 0 ? (
        <EmptyState
          title="No deals yet"
          description="Track properties you’re considering buying — ask price, offer, estimated NOI, and stage."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              Add deal
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {deals.map((d) => {
            const price = d.offer_price_cents ?? d.asking_price_cents;
            const cap =
              price && d.estimated_noi_cents
                ? d.estimated_noi_cents / price
                : null;
            return (
              <li key={d.id}>
                <Card>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{d.name}</p>
                        <Badge>{d.stage.replace("_", " ")}</Badge>
                      </div>
                      <RowActions
                        onDelete={() => {
                          if (!confirmDelete("deal")) return;
                          demoDeleteDeal(d.id);
                          toast({ title: "Deal deleted", variant: "success" });
                          reload();
                        }}
                      />
                    </div>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      {d.address}, {d.city}, {d.state}
                    </p>
                    <p className="text-sm tabular-nums">
                      Ask{" "}
                      {d.asking_price_cents != null
                        ? formatCents(d.asking_price_cents)
                        : "—"}{" "}
                      · Offer{" "}
                      {d.offer_price_cents != null
                        ? formatCents(d.offer_price_cents)
                        : "—"}{" "}
                      · Est. NOI{" "}
                      {d.estimated_noi_cents != null
                        ? formatCents(d.estimated_noi_cents)
                        : "—"}{" "}
                      · Cap {formatCapRate(cap)}
                    </p>
                    {d.notes ? (
                      <p className="text-sm text-[var(--color-muted-foreground)]">
                        {d.notes}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      {stages.map((stage) => (
                        <Button
                          key={stage}
                          size="sm"
                          variant={d.stage === stage ? "default" : "outline"}
                          onClick={() => {
                            demoUpdateDeal(d.id, { stage });
                            reload();
                          }}
                        >
                          {stage.replace("_", " ")}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
