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
  defaultTurnChecklist,
  demoAddTurn,
  demoDeleteTurn,
  demoToggleTurnChecklist,
  demoUpdateTurn,
} from "@/lib/demo-store";
import { formatCents, parseDollarsInput } from "@/lib/money";
import { useToast } from "@/components/ui/toast";
import { confirmDelete, RowActions } from "@/components/row-actions";
import type { TurnStage } from "@/types/ops";

const stages: TurnStage[] = [
  "notice",
  "vacant",
  "make_ready",
  "listed",
  "leased",
];

export function TurnsPage() {
  const { user } = useAuth();
  const { turns, units, properties, reload } = useOpsLists();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    unit_id: "",
    stage: "vacant" as TurnStage,
    vacant_on: new Date().toISOString().slice(0, 10),
    target_rent: "",
  });

  React.useEffect(() => {
    if (!form.unit_id && units[0]) {
      setForm((f) => ({ ...f, unit_id: units[0].id }));
    }
  }, [units, form.unit_id]);

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const unit = units.find((u) => u.id === form.unit_id);
    if (!unit) {
      toast({ title: "Add a unit first", variant: "destructive" });
      return;
    }
    const rent = form.target_rent
      ? parseDollarsInput(form.target_rent)
      : null;
    if (form.target_rent && rent === null) {
      toast({ title: "Enter a valid target rent", variant: "destructive" });
      return;
    }
    demoAddTurn(
      {
        unit_id: unit.id,
        property_id: unit.property_id,
        stage: form.stage,
        vacant_on: form.vacant_on || null,
        listed_on: form.stage === "listed" ? form.vacant_on || null : null,
        target_rent_cents: rent,
        checklist: defaultTurnChecklist(),
        notes: null,
      },
      user.id,
    );
    toast({ title: "Turn started", variant: "success" });
    setOpen(false);
    setForm((f) => ({ ...f, target_rent: "" }));
    reload();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Unit turns"
        description="Vacancy → make-ready → listed → leased."
        action={
          <Button size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? "Cancel" : "Add"}
          </Button>
        }
      />

      {open ? (
        <Card>
          <CardContent className="p-4">
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSave}>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Unit</Label>
                <select
                  required
                  className="flex h-11 w-full rounded-md border bg-white px-3 text-sm"
                  value={form.unit_id}
                  onChange={(e) =>
                    setForm({ ...form, unit_id: e.target.value })
                  }
                >
                  <option value="">Select…</option>
                  {units.map((u) => {
                    const property = properties.find(
                      (p) => p.id === u.property_id,
                    );
                    return (
                      <option key={u.id} value={u.id}>
                        {property?.name} · {u.label}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Starting stage</Label>
                <select
                  className="flex h-11 w-full rounded-md border bg-white px-3 text-sm"
                  value={form.stage}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      stage: e.target.value as TurnStage,
                    })
                  }
                >
                  {stages.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Vacant date</Label>
                <Input
                  type="date"
                  value={form.vacant_on}
                  onChange={(e) =>
                    setForm({ ...form, vacant_on: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Target rent ($ / mo)</Label>
                <Input
                  inputMode="decimal"
                  placeholder="Optional"
                  value={form.target_rent}
                  onChange={(e) =>
                    setForm({ ...form, target_rent: e.target.value })
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">Start turn</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {turns.length === 0 ? (
        <EmptyState
          title="No unit turns"
          description="When a tenant gives notice or moves out, start a turn to track make-ready and listing."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              Add turn
            </Button>
          }
        />
      ) : (
        <ul className="space-y-4">
          {turns.map((t) => {
            const unit = units.find((u) => u.id === t.unit_id);
            const property = properties.find((p) => p.id === t.property_id);
            const done = t.checklist.filter((c) => c.done).length;
            return (
              <li key={t.id}>
                <Card>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">
                          {property?.name} · {unit?.label}
                        </p>
                        <Badge>{t.stage.replace("_", " ")}</Badge>
                      </div>
                      <RowActions
                        onDelete={() => {
                          if (!confirmDelete("unit turn")) return;
                          demoDeleteTurn(t.id);
                          toast({ title: "Turn deleted", variant: "success" });
                          reload();
                        }}
                      />
                    </div>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      Vacant {t.vacant_on ?? "—"} · Target{" "}
                      {t.target_rent_cents != null
                        ? formatCents(t.target_rent_cents)
                        : "—"}{" "}
                      · Checklist {done}/{t.checklist.length}
                    </p>
                    <ul className="space-y-1">
                      {t.checklist.map((c, i) => (
                        <li key={c.item}>
                          <label className="flex min-h-10 items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={c.done}
                              onChange={() => {
                                demoToggleTurnChecklist(t.id, i);
                                reload();
                              }}
                            />
                            {c.item}
                          </label>
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-2">
                      {stages.map((stage) => (
                        <Button
                          key={stage}
                          size="sm"
                          variant={t.stage === stage ? "default" : "outline"}
                          onClick={() => {
                            demoUpdateTurn(t.id, {
                              stage,
                              listed_on:
                                stage === "listed"
                                  ? new Date().toISOString().slice(0, 10)
                                  : t.listed_on,
                            });
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
