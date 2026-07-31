import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { useOpsLists } from "@/hooks/use-ops";
import { createTransaction, uploadReceipt } from "@/hooks/use-data";
import { parseDollarsInput } from "@/lib/money";
import { useToast } from "@/components/ui/toast";
import type { TransactionType } from "@/types/database";

/** Phone-first: photo + amount + property + category in one screen. */
export function QuickAddPage() {
  const { user } = useAuth();
  const { properties, reload } = useOpsLists();
  const { toast } = useToast();
  const [propertyId, setPropertyId] = React.useState(properties[0]?.id ?? "");
  const [type, setType] = React.useState<TransactionType>("expense");
  const [category, setCategory] = React.useState("maintenance");
  const [amount, setAmount] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!propertyId && properties[0]) setPropertyId(properties[0].id);
  }, [properties, propertyId]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const cents = parseDollarsInput(amount);
    if (cents === null || !propertyId) {
      toast({ title: "Amount and property required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let receipt_path: string | null = null;
      if (file) receipt_path = await uploadReceipt(user.id, file);
      await createTransaction(
        {
          property_id: propertyId,
          unit_id: null,
          lease_id: null,
          type,
          category,
          amount_cents: cents,
          occurred_on: new Date().toISOString().slice(0, 10),
          description: "Quick add",
          receipt_path,
        },
        user.id,
      );
      setAmount("");
      setFile(null);
      reload();
      toast({ title: "Saved to ledger", variant: "success" });
    } catch (err) {
      toast({
        title: "Failed",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Quick add"
        description="Receipt photo → dollars → done. Built for the jobsite."
      />
      <Card>
        <CardContent className="p-4">
          <form className="grid gap-3" onSubmit={(e) => void onSave(e)}>
            <div className="space-y-1.5">
              <Label>Receipt photo</Label>
              <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-[var(--color-border)] px-3 text-sm text-[var(--color-muted-foreground)]">
                {file ? file.name : "Tap to take or choose photo"}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <div className="space-y-1.5">
              <Label>Amount ($)</Label>
              <Input
                inputMode="decimal"
                className="h-14 text-xl"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Property</Label>
              <select
                className="flex h-11 w-full rounded-md border bg-white px-3 text-sm"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <select
                  className="flex h-11 w-full rounded-md border bg-white px-3 text-sm"
                  value={type}
                  onChange={(e) =>
                    setType(e.target.value as TransactionType)
                  }
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <select
                  className="flex h-11 w-full rounded-md border bg-white px-3 text-sm"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="maintenance">Maintenance</option>
                  <option value="opex">OpEx</option>
                  <option value="capex">CapEx</option>
                  <option value="utilities">Utilities</option>
                  <option value="rent">Rent</option>
                  <option value="fees">Fees</option>
                </select>
              </div>
            </div>
            <Button type="submit" size="lg" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
