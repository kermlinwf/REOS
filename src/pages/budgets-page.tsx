import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { useOpsLists } from "@/hooks/use-ops";
import {
  demoAddBudget,
  demoDeleteBudget,
} from "@/lib/demo-store";
import { formatCents, parseDollarsInput, sumCents } from "@/lib/money";
import { useToast } from "@/components/ui/toast";
import { confirmDelete, RowActions } from "@/components/row-actions";
import { TRANSACTION_CATEGORY_LABELS } from "@/types/database";
import {
  CAPEX_CATEGORIES,
  OPEX_CATEGORIES,
} from "@/lib/finance";

const BUDGET_CATEGORIES = [...OPEX_CATEGORIES, ...CAPEX_CATEGORIES] as const;

export function BudgetsPage() {
  const { user } = useAuth();
  const { budgets, transactions, properties, reload } = useOpsLists();
  const { toast } = useToast();
  const year = new Date().getFullYear();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    property_id: "",
    category: "maintenance",
    kind: "opex" as "opex" | "capex",
    amount: "",
    year: String(year),
  });

  React.useEffect(() => {
    if (!form.property_id && properties[0]) {
      setForm((f) => ({ ...f, property_id: properties[0].id }));
    }
  }, [properties, form.property_id]);

  const rows = [...budgets].sort((a, b) => b.year - a.year || a.category.localeCompare(b.category));

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.property_id) {
      toast({ title: "Add a property first", variant: "destructive" });
      return;
    }
    const amount = parseDollarsInput(form.amount);
    if (amount === null || amount <= 0) {
      toast({ title: "Enter a budget amount", variant: "destructive" });
      return;
    }
    const y = Number.parseInt(form.year, 10);
    if (!Number.isFinite(y)) {
      toast({ title: "Enter a valid year", variant: "destructive" });
      return;
    }
    demoAddBudget(
      {
        property_id: form.property_id,
        year: y,
        category: form.category,
        kind: form.kind,
        amount_cents: amount,
      },
      user.id,
    );
    toast({ title: "Budget added", variant: "success" });
    setForm((f) => ({ ...f, amount: "" }));
    setOpen(false);
    reload();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Budgets"
        description={`OpEx / CapEx plans vs actuals for ${year}.`}
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
                <Label>Property</Label>
                <select
                  required
                  className="flex h-11 w-full rounded-md border bg-white px-3 text-sm"
                  value={form.property_id}
                  onChange={(e) =>
                    setForm({ ...form, property_id: e.target.value })
                  }
                >
                  <option value="">Select…</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Kind</Label>
                <select
                  className="flex h-11 w-full rounded-md border bg-white px-3 text-sm"
                  value={form.kind}
                  onChange={(e) => {
                    const kind = e.target.value as "opex" | "capex";
                    setForm({
                      ...form,
                      kind,
                      category:
                        kind === "capex" ? "capex" : form.category === "capex"
                          ? "maintenance"
                          : form.category,
                    });
                  }}
                >
                  <option value="opex">OpEx</option>
                  <option value="capex">CapEx</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <select
                  className="flex h-11 w-full rounded-md border bg-white px-3 text-sm"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  {BUDGET_CATEGORIES.filter((c) =>
                    form.kind === "capex" ? c === "capex" : c !== "capex",
                  ).map((c) => (
                    <option key={c} value={c}>
                      {TRANSACTION_CATEGORY_LABELS[c] ?? c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Yearly budget ($)</Label>
                <Input
                  required
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Year</Label>
                <Input
                  required
                  inputMode="numeric"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">Save budget</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          title="No budgets yet"
          description="Set a yearly target for maintenance, insurance, CapEx, etc. Actuals come from your ledger."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              Add budget
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((b) => {
            const property = properties.find((p) => p.id === b.property_id);
            const actual = sumCents(
              transactions
                .filter(
                  (t) =>
                    t.property_id === b.property_id &&
                    t.type === "expense" &&
                    t.category === b.category &&
                    t.occurred_on.startsWith(String(b.year)),
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
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold">
                        {property?.name} ·{" "}
                        {TRANSACTION_CATEGORY_LABELS[b.category] ?? b.category}{" "}
                        <span className="text-xs font-normal uppercase text-[var(--color-muted-foreground)]">
                          {b.kind} · {b.year}
                        </span>
                      </p>
                      <RowActions
                        onDelete={() => {
                          if (!confirmDelete("budget")) return;
                          demoDeleteBudget(b.id);
                          toast({ title: "Budget deleted", variant: "success" });
                          reload();
                        }}
                      />
                    </div>
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
      )}
    </div>
  );
}
