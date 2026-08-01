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
  demoAddRecurringBill,
  demoDeleteRecurringBill,
  demoPostRecurringBill,
  demoUpdateRecurringBill,
} from "@/lib/demo-store";
import { formatCents, parseDollarsInput } from "@/lib/money";
import { useToast } from "@/components/ui/toast";
import { confirmDelete, RowActions } from "@/components/row-actions";
import { TRANSACTION_CATEGORY_LABELS } from "@/types/database";
import type { RecurringBill } from "@/types/ops";

const BILL_CATEGORIES = [
  "insurance",
  "opex",
  "utilities",
  "property_tax",
  "management",
  "mortgage",
  "debt_service",
  "maintenance",
  "other_expense",
] as const;

export function RecurringPage() {
  const { user } = useAuth();
  const { recurringBills, properties, reload } = useOpsLists();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    property_id: "",
    name: "",
    category: "insurance",
    amount: "",
    day_of_month: "1",
  });

  React.useEffect(() => {
    if (!form.property_id && properties[0] && !editingId) {
      setForm((f) => ({ ...f, property_id: properties[0].id }));
    }
  }, [properties, form.property_id, editingId]);

  function startEdit(b: RecurringBill) {
    setEditingId(b.id);
    setOpen(true);
    setForm({
      property_id: b.property_id,
      name: b.name,
      category: b.category,
      amount: String(b.amount_cents / 100),
      day_of_month: String(b.day_of_month),
    });
  }

  function resetForm() {
    setOpen(false);
    setEditingId(null);
    setForm({
      property_id: properties[0]?.id ?? "",
      name: "",
      category: "insurance",
      amount: "",
      day_of_month: "1",
    });
  }

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.property_id) {
      toast({
        title: "Add a property first",
        description: "Recurring bills must belong to a property.",
        variant: "destructive",
      });
      return;
    }
    const amount = parseDollarsInput(form.amount);
    if (amount === null || amount <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    const day = Number.parseInt(form.day_of_month, 10);
    if (!Number.isFinite(day) || day < 1 || day > 28) {
      toast({
        title: "Day must be 1–28",
        description: "Keeps monthly bills reliable across short months.",
        variant: "destructive",
      });
      return;
    }
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        property_id: form.property_id,
        name: form.name.trim(),
        category: form.category,
        amount_cents: amount,
        day_of_month: day,
        active: true,
        notes: null as string | null,
      };
      if (editingId) {
        demoUpdateRecurringBill(editingId, payload);
        toast({ title: "Bill updated", variant: "success" });
      } else {
        demoAddRecurringBill(payload, user.id);
        toast({ title: "Recurring bill added", variant: "success" });
      }
      resetForm();
      reload();
    } finally {
      setSaving(false);
    }
  }

  function onDelete(id: string) {
    if (!confirmDelete("recurring bill")) return;
    demoDeleteRecurringBill(id);
    toast({ title: "Bill deleted", variant: "success" });
    if (editingId === id) resetForm();
    reload();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Recurring bills"
        description="Insurance, lawn, HOA — post to the ledger when due."
        action={
          <Button
            size="sm"
            onClick={() => {
              if (open) resetForm();
              else {
                setEditingId(null);
                setOpen(true);
              }
            }}
          >
            Add
          </Button>
        }
      />

      {open ? (
        <Card>
          <CardContent className="p-4">
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSave}>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="rb-name">Name</Label>
                <Input
                  id="rb-name"
                  required
                  placeholder="Hazard insurance"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="rb-property">Property</Label>
                <select
                  id="rb-property"
                  required
                  className="flex h-11 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
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
                <Label htmlFor="rb-amount">Amount ($)</Label>
                <Input
                  id="rb-amount"
                  required
                  inputMode="decimal"
                  placeholder="185.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rb-day">Day of month (1–28)</Label>
                <Input
                  id="rb-day"
                  required
                  inputMode="numeric"
                  value={form.day_of_month}
                  onChange={(e) =>
                    setForm({ ...form, day_of_month: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="rb-category">Category</Label>
                <select
                  id="rb-category"
                  className="flex h-11 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  {BILL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {TRANSACTION_CATEGORY_LABELS[c] ?? c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : editingId ? "Save changes" : "Save bill"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {recurringBills.length === 0 && !open ? (
        <EmptyState
          title="No recurring bills"
          description="Add insurance, lawn, HOA, or other monthly expenses."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              Add bill
            </Button>
          }
        />
      ) : (
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
                        {property?.name ?? "Property"} · day {b.day_of_month} ·{" "}
                        {formatCents(b.amount_cents)} ·{" "}
                        {TRANSACTION_CATEGORY_LABELS[b.category] ?? b.category}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!b.active}
                      onClick={() => {
                        demoPostRecurringBill(b.id);
                        reload();
                        toast({
                          title: "Posted to ledger",
                          variant: "success",
                        });
                      }}
                    >
                      Post now
                    </Button>
                    <RowActions
                      onEdit={() => startEdit(b)}
                      onDelete={() => onDelete(b.id)}
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
