import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { confirmDelete, RowActions } from "@/components/row-actions";
import { useAuth } from "@/contexts/auth-context";
import { useOpsLists } from "@/hooks/use-ops";
import {
  demoAddMortgage,
  demoDeleteMortgage,
  demoUpdateMortgage,
} from "@/lib/demo-store";
import { formatCents, parseDollarsInput } from "@/lib/money";
import type { Mortgage } from "@/types/ops";

export function MortgagesPage() {
  const { user } = useAuth();
  const { mortgages, properties, reload } = useOpsLists();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    property_id: "",
    lender: "",
    balance: "",
    rate: "",
    payment: "",
    next_payment_on: new Date().toISOString().slice(0, 10),
    escrow: "0",
  });

  React.useEffect(() => {
    if (!form.property_id && properties[0] && !editingId) {
      setForm((f) => ({ ...f, property_id: properties[0].id }));
    }
  }, [properties, form.property_id, editingId]);

  function startEdit(m: Mortgage) {
    setEditingId(m.id);
    setOpen(true);
    setForm({
      property_id: m.property_id,
      lender: m.lender,
      balance: String(m.balance_cents / 100),
      rate: String(m.rate_bps / 100),
      payment: String(m.payment_cents / 100),
      next_payment_on: m.next_payment_on,
      escrow: String(m.escrow_balance_cents / 100),
    });
  }

  function resetForm() {
    setOpen(false);
    setEditingId(null);
    setForm({
      property_id: properties[0]?.id ?? "",
      lender: "",
      balance: "",
      rate: "",
      payment: "",
      next_payment_on: new Date().toISOString().slice(0, 10),
      escrow: "0",
    });
  }

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.property_id) {
      toast({
        title: "Add a property first",
        variant: "destructive",
      });
      return;
    }
    if (!form.lender.trim()) {
      toast({ title: "Lender is required", variant: "destructive" });
      return;
    }
    const payment = parseDollarsInput(form.payment);
    const balance = parseDollarsInput(form.balance);
    const escrow = parseDollarsInput(form.escrow) ?? 0;
    const rate = Number.parseFloat(form.rate);
    if (payment === null || payment <= 0) {
      toast({
        title: "Enter monthly payment",
        description: "This amount reduces Net Cash Flow on your P&L.",
        variant: "destructive",
      });
      return;
    }
    if (balance === null || balance < 0) {
      toast({ title: "Enter a valid balance", variant: "destructive" });
      return;
    }
    if (!Number.isFinite(rate) || rate < 0) {
      toast({ title: "Enter interest rate %", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        property_id: form.property_id,
        lender: form.lender.trim(),
        balance_cents: balance,
        rate_bps: Math.round(rate * 100),
        payment_cents: payment,
        next_payment_on: form.next_payment_on,
        escrow_balance_cents: escrow,
        notes: null as string | null,
      };
      if (editingId) {
        demoUpdateMortgage(editingId, payload);
        toast({ title: "Mortgage updated", variant: "success" });
      } else {
        demoAddMortgage(payload, user.id);
        toast({
          title: "Mortgage added",
          description: "Monthly payment now counts toward debt service / cash flow.",
          variant: "success",
        });
      }
      resetForm();
      reload();
    } finally {
      setSaving(false);
    }
  }

  function onDelete(id: string) {
    if (!confirmDelete("mortgage")) return;
    demoDeleteMortgage(id);
    toast({ title: "Mortgage deleted", variant: "success" });
    if (editingId === id) resetForm();
    reload();
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Mortgages & escrow"
        description="Monthly payment reduces Net Cash Flow (not NOI). Skip logging the same payment again in the ledger."
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
            {open ? "Cancel" : "Add"}
          </Button>
        }
      />

      {open ? (
        <Card>
          <CardContent className="p-4">
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={onSave}>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="m-property">Property</Label>
                <select
                  id="m-property"
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
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="m-lender">Lender</Label>
                <Input
                  id="m-lender"
                  required
                  placeholder="Chase, Rocket, etc."
                  value={form.lender}
                  onChange={(e) =>
                    setForm({ ...form, lender: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-payment">Monthly payment ($)</Label>
                <Input
                  id="m-payment"
                  required
                  inputMode="decimal"
                  value={form.payment}
                  onChange={(e) =>
                    setForm({ ...form, payment: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-balance">Balance ($)</Label>
                <Input
                  id="m-balance"
                  required
                  inputMode="decimal"
                  value={form.balance}
                  onChange={(e) =>
                    setForm({ ...form, balance: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-rate">Rate (%)</Label>
                <Input
                  id="m-rate"
                  required
                  inputMode="decimal"
                  placeholder="6.25"
                  value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-escrow">Escrow balance ($)</Label>
                <Input
                  id="m-escrow"
                  inputMode="decimal"
                  value={form.escrow}
                  onChange={(e) =>
                    setForm({ ...form, escrow: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="m-next">Next payment date</Label>
                <Input
                  id="m-next"
                  type="date"
                  required
                  value={form.next_payment_on}
                  onChange={(e) =>
                    setForm({ ...form, next_payment_on: e.target.value })
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving
                    ? "Saving…"
                    : editingId
                      ? "Save changes"
                      : "Save mortgage"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {mortgages.length === 0 && !open ? (
        <EmptyState
          title="No mortgages"
          description="Add a loan so monthly payments reduce cash flow on the dashboard and P&L."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              Add mortgage
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {mortgages.map((m) => {
            const property = properties.find((p) => p.id === m.property_id);
            return (
              <li key={m.id}>
                <Card>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold">
                        {property?.name} · {m.lender}
                      </p>
                      <RowActions
                        onEdit={() => startEdit(m)}
                        onDelete={() => onDelete(m.id)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                      <Stat
                        label="Balance"
                        value={formatCents(m.balance_cents)}
                      />
                      <Stat
                        label="Rate"
                        value={`${(m.rate_bps / 100).toFixed(2)}%`}
                      />
                      <Stat
                        label="Payment"
                        value={formatCents(m.payment_cents)}
                      />
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
      )}
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
