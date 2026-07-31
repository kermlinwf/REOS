import * as React from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { createProperty, useProperties } from "@/hooks/use-data";
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
import type { PropertyStatus } from "@/types/database";

export function PropertiesPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useProperties();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    address_line1: "",
    city: "",
    state: "",
    postal_code: "",
    purchase_price: "",
  });

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await createProperty(
        {
          name: form.name,
          address_line1: form.address_line1,
          address_line2: null,
          city: form.city,
          state: form.state,
          postal_code: form.postal_code,
          country: "US",
          property_type: "residential",
          purchase_price_cents: parseDollarsInput(form.purchase_price),
          purchase_date: null,
          status: "active" as PropertyStatus,
          notes: null,
        },
        user.id,
      );
      toast({ title: "Property added", variant: "success" });
      setOpen(false);
      setForm({
        name: "",
        address_line1: "",
        city: "",
        state: "",
        postal_code: "",
        purchase_price: "",
      });
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

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Properties
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Assets you own and operate.
          </p>
        </div>
        <Button onClick={() => setOpen((v) => !v)} size="sm">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {open ? (
        <Card>
          <CardHeader>
            <CardTitle>New property</CardTitle>
            <CardDescription>Purchase price is stored as integer cents.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => void onCreate(e)}>
              <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
              <Field label="Address" value={form.address_line1} onChange={(v) => setForm({ ...form, address_line1: v })} required />
              <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
              <Field label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} required />
              <Field label="ZIP" value={form.postal_code} onChange={(v) => setForm({ ...form, postal_code: v })} required />
              <Field label="Purchase price ($)" value={form.purchase_price} onChange={(v) => setForm({ ...form, purchase_price: v })} inputMode="decimal" />
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save property"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : null}

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          title="No properties"
          description="Add your first asset to start tracking units and cash flow."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              Add property
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {data.map((p) => (
            <li key={p.id}>
              <Card>
                <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{p.name}</p>
                      <Badge variant="muted">{p.status}</Badge>
                    </div>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      {p.address_line1}, {p.city}, {p.state} {p.postal_code}
                    </p>
                    <p className="mt-1 text-sm tabular-nums">
                      Basis:{" "}
                      {p.purchase_price_cents != null
                        ? formatCents(p.purchase_price_cents)
                        : "—"}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/units?property=${p.id}`}>View units</Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        required={required}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
