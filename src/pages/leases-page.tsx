import * as React from "react";
import { Plus, Upload } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import {
  createLease,
  uploadLeaseDocument,
  useLeases,
  useTenants,
  useUnits,
} from "@/hooks/use-data";
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
import type { LeaseStatus } from "@/types/database";

export function LeasesPage() {
  const { user } = useAuth();
  const leases = useLeases();
  const units = useUnits();
  const tenants = useTenants();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [form, setForm] = React.useState({
    unit_id: "",
    tenant_id: "",
    start_date: "",
    end_date: "",
    rent: "",
    deposit: "",
    status: "active" as LeaseStatus,
  });

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const rent = parseDollarsInput(form.rent);
    if (rent === null) {
      toast({ title: "Enter a valid rent amount", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let document_path: string | null = null;
      if (file) {
        document_path = await uploadLeaseDocument(user.id, file);
      }
      await createLease(
        {
          unit_id: form.unit_id,
          tenant_id: form.tenant_id,
          status: form.status,
          start_date: form.start_date,
          end_date: form.end_date || null,
          rent_cents: rent,
          deposit_cents: parseDollarsInput(form.deposit) ?? 0,
          document_path,
          notes: null,
        },
        user.id,
      );
      toast({ title: "Lease created", variant: "success" });
      setOpen(false);
      setFile(null);
      leases.reload();
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
            Leases
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Agreements with PDF uploads to Supabase Storage.
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
            <CardTitle>New lease</CardTitle>
            <CardDescription>
              Rent and deposit amounts are stored as integer cents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => void onCreate(e)}>
              <SelectField
                id="unit_id"
                label="Unit"
                value={form.unit_id}
                onChange={(v) => setForm({ ...form, unit_id: v })}
                options={units.data.map((u) => ({
                  value: u.id,
                  label: u.label,
                }))}
              />
              <SelectField
                id="tenant_id"
                label="Tenant"
                value={form.tenant_id}
                onChange={(v) => setForm({ ...form, tenant_id: v })}
                options={tenants.data.map((t) => ({
                  value: t.id,
                  label: t.full_name,
                }))}
              />
              <div className="space-y-1.5">
                <Label htmlFor="start_date">Start</Label>
                <Input
                  id="start_date"
                  type="date"
                  required
                  value={form.start_date}
                  onChange={(e) =>
                    setForm({ ...form, start_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end_date">End</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={(e) =>
                    setForm({ ...form, end_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rent">Monthly rent ($)</Label>
                <Input
                  id="rent"
                  required
                  inputMode="decimal"
                  value={form.rent}
                  onChange={(e) => setForm({ ...form, rent: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deposit">Security deposit ($)</Label>
                <Input
                  id="deposit"
                  inputMode="decimal"
                  value={form.deposit}
                  onChange={(e) =>
                    setForm({ ...form, deposit: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="lease_pdf">Lease PDF (optional)</Label>
                <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-dashed border-[var(--color-border)] px-3 text-sm text-[var(--color-muted-foreground)]">
                  <Upload className="h-4 w-4" />
                  {file ? file.name : "Choose PDF"}
                  <input
                    id="lease_pdf"
                    type="file"
                    accept="application/pdf,image/*"
                    className="sr-only"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save lease"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {leases.error ? (
        <p className="text-sm text-red-700">{leases.error}</p>
      ) : null}

      {leases.loading ? (
        <Skeleton className="h-24 w-full" />
      ) : leases.data.length === 0 ? (
        <EmptyState
          title="No leases"
          description="Create a lease once you have a unit and tenant."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              Add lease
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {leases.data.map((lease) => (
            <li key={lease.id}>
              <Card>
                <CardContent className="space-y-1 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">
                      {lease.tenant?.full_name ?? "Tenant"} ·{" "}
                      {lease.unit?.label ?? "Unit"}
                    </p>
                    <Badge
                      variant={
                        lease.status === "active" ? "success" : "muted"
                      }
                    >
                      {lease.status}
                    </Badge>
                    {lease.document_path ? (
                      <Badge variant="default">PDF on file</Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {lease.start_date}
                    {lease.end_date ? ` → ${lease.end_date}` : " → open"}
                  </p>
                  <p className="text-sm tabular-nums">
                    Rent {formatCents(lease.rent_cents)} · Deposit{" "}
                    {formatCents(lease.deposit_cents)}
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

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        required
        className="flex h-11 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
