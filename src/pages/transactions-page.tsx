import * as React from "react";
import { Plus, Upload } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
  uploadReceipt,
  useProperties,
  useTransactions,
} from "@/hooks/use-data";
import {
  OPEX_CATEGORIES,
  REVENUE_CATEGORIES,
  CAPEX_CATEGORIES,
  DEBT_CATEGORIES,
  DEPOSIT_CATEGORIES,
} from "@/lib/finance";
import { formatCents, parseDollarsInput } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { confirmDelete, RowActions } from "@/components/row-actions";
import {
  TRANSACTION_CATEGORY_LABELS,
  type Transaction,
  type TransactionType,
} from "@/types/database";

const ALL_CATEGORIES = [
  ...REVENUE_CATEGORIES,
  ...DEPOSIT_CATEGORIES,
  ...OPEX_CATEGORIES,
  ...CAPEX_CATEGORIES,
  ...DEBT_CATEGORIES,
  "other_expense",
] as const;

type SortKey = "occurred_on" | "amount_cents" | "category";

export function TransactionsPage() {
  const { user } = useAuth();
  const properties = useProperties();
  const { data, loading, error, reload } = useTransactions();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [typeFilter, setTypeFilter] = React.useState<"all" | TransactionType>(
    "all",
  );
  const [sortKey, setSortKey] = React.useState<SortKey>("occurred_on");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [form, setForm] = React.useState({
    property_id: "",
    type: "income" as TransactionType,
    category: "rent",
    amount: "",
    occurred_on: new Date().toISOString().slice(0, 10),
    description: "",
  });

  function startEdit(t: Transaction) {
    setEditingId(t.id);
    setOpen(true);
    setFile(null);
    setForm({
      property_id: t.property_id,
      type: t.type,
      category: t.category,
      amount: String(t.amount_cents / 100),
      occurred_on: t.occurred_on,
      description: t.description ?? "",
    });
  }

  function resetForm() {
    setOpen(false);
    setEditingId(null);
    setFile(null);
    setForm({
      property_id: "",
      type: "income",
      category: "rent",
      amount: "",
      occurred_on: new Date().toISOString().slice(0, 10),
      description: "",
    });
  }

  const rows = React.useMemo(() => {
    let list = [...data];
    if (typeFilter !== "all") {
      list = list.filter((t) => t.type === typeFilter);
    }
    list.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === bv) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = av < bv ? -1 : 1;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [data, typeFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "occurred_on" ? "desc" : "asc");
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const amount = parseDollarsInput(form.amount);
    if (amount === null) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let receipt_path: string | null = null;
      if (file) {
        receipt_path = await uploadReceipt(user.id, file);
      }
      if (editingId) {
        await updateTransaction(editingId, {
          property_id: form.property_id,
          type: form.type,
          category: form.category,
          amount_cents: amount,
          occurred_on: form.occurred_on,
          description: form.description || null,
          ...(receipt_path ? { receipt_path } : {}),
        });
        toast({ title: "Transaction updated", variant: "success" });
      } else {
        await createTransaction(
          {
            property_id: form.property_id,
            unit_id: null,
            lease_id: null,
            type: form.type,
            category: form.category,
            amount_cents: amount,
            occurred_on: form.occurred_on,
            description: form.description || null,
            receipt_path,
          },
          user.id,
        );
        toast({ title: "Transaction recorded", variant: "success" });
      }
      resetForm();
      reload();
    } catch (err) {
      toast({
        title: "Could not save",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirmDelete("ledger entry")) return;
    try {
      await deleteTransaction(id);
      toast({ title: "Transaction deleted", variant: "success" });
      if (editingId === id) resetForm();
      reload();
    } catch (err) {
      toast({
        title: "Could not delete",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Ledger
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            All income and expenses in cents.
          </p>
        </div>
        <Button onClick={() => { resetForm(); setOpen((v) => !v); }} size="sm">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "income", "expense"] as const).map((t) => (
          <Button
            key={t}
            size="sm"
            variant={typeFilter === t ? "default" : "outline"}
            onClick={() => setTypeFilter(t)}
          >
            {t === "all" ? "All" : t === "income" ? "Income" : "Expense"}
          </Button>
        ))}
      </div>

      {open ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit transaction" : "New transaction"}</CardTitle>
            <CardDescription>
              Attach a receipt photo or PDF — uploaded to Supabase Storage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => void onCreate(e)}>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="property_id">Property</Label>
                <select
                  id="property_id"
                  required
                  className="flex h-11 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
                  value={form.property_id}
                  onChange={(e) =>
                    setForm({ ...form, property_id: e.target.value })
                  }
                >
                  <option value="">Select…</option>
                  {properties.data.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  className="flex h-11 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value as TransactionType,
                    })
                  }
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="flex h-11 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  {ALL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {TRANSACTION_CATEGORY_LABELS[c] ?? c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  required
                  inputMode="decimal"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="occurred_on">Date</Label>
                <Input
                  id="occurred_on"
                  type="date"
                  required
                  value={form.occurred_on}
                  onChange={(e) =>
                    setForm({ ...form, occurred_on: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="receipt">Receipt (optional)</Label>
                <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-dashed border-[var(--color-border)] px-3 text-sm text-[var(--color-muted-foreground)]">
                  <Upload className="h-4 w-4" />
                  {file ? file.name : "Photo or PDF"}
                  <input
                    id="receipt"
                    type="file"
                    accept="image/*,application/pdf"
                    className="sr-only"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving
                    ? "Saving…"
                    : editingId
                      ? "Save changes"
                      : "Save transaction"}
                </Button>
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Ledger is empty"
          description="Record rent, fees, OpEx, CapEx, and debt service."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              Add transaction
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b bg-[var(--color-muted)]/50 text-[var(--color-muted-foreground)]">
              <tr>
                <Th onClick={() => toggleSort("occurred_on")}>Date</Th>
                <th className="px-3 py-2 font-medium">Property</th>
                <Th onClick={() => toggleSort("category")}>Category</Th>
                <Th onClick={() => toggleSort("amount_cents")} className="text-right">
                  Amount
                </Th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="px-3 py-3 whitespace-nowrap">{t.occurred_on}</td>
                  <td className="px-3 py-3">
                    {t.property?.name ?? "—"}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant={t.type === "income" ? "success" : "muted"}>
                        {t.type}
                      </Badge>
                      <span>
                        {TRANSACTION_CATEGORY_LABELS[t.category] ?? t.category}
                      </span>
                      {t.receipt_path ? (
                        <Badge variant="default">receipt</Badge>
                      ) : null}
                    </div>
                    {t.description ? (
                      <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                        {t.description}
                      </p>
                    ) : null}
                  </td>
                  <td
                    className={`px-3 py-3 text-right tabular-nums font-medium ${
                      t.type === "income"
                        ? "text-[var(--color-success)]"
                        : "text-[var(--color-foreground)]"
                    }`}
                  >
                    {t.type === "income" ? "+" : "−"}
                    {formatCents(t.amount_cents)}
                  </td>
                  <td className="px-3 py-3">
                    <RowActions
                      onEdit={() => startEdit(t)}
                      onDelete={() => void onDelete(t.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <th className={`px-3 py-2 font-medium ${className}`}>
      <button
        type="button"
        className="touch-target inline-flex items-center font-medium"
        onClick={onClick}
      >
        {children}
      </button>
    </th>
  );
}
