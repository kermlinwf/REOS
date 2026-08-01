import * as React from "react";
import { Plus } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import {
  createUnit,
  deleteUnit,
  updateUnit,
  useProperties,
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
import { confirmDelete, RowActions } from "@/components/row-actions";
import type { Unit, UnitStatus } from "@/types/database";

export function UnitsPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const propertyFilter = params.get("property") ?? undefined;
  const properties = useProperties();
  const { data, loading, error, reload } = useUnits(propertyFilter);
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    property_id: propertyFilter ?? "",
    label: "",
    beds: "",
    baths: "",
    market_rent: "",
    status: "vacant" as UnitStatus,
  });

  React.useEffect(() => {
    if (propertyFilter && !editingId) {
      setForm((f) => ({ ...f, property_id: propertyFilter }));
    }
  }, [propertyFilter, editingId]);

  const propertyName = (id: string) =>
    properties.data.find((p) => p.id === id)?.name ?? "Property";

  function startEdit(u: Unit) {
    setEditingId(u.id);
    setOpen(true);
    setForm({
      property_id: u.property_id,
      label: u.label,
      beds: u.beds != null ? String(u.beds) : "",
      baths: u.baths != null ? String(u.baths) : "",
      market_rent:
        u.market_rent_cents != null ? String(u.market_rent_cents / 100) : "",
      status: u.status,
    });
  }

  function resetForm() {
    setOpen(false);
    setEditingId(null);
    setForm({
      property_id: propertyFilter ?? "",
      label: "",
      beds: "",
      baths: "",
      market_rent: "",
      status: "vacant",
    });
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        property_id: form.property_id,
        label: form.label,
        beds: form.beds ? Number(form.beds) : null,
        baths: form.baths ? Number(form.baths) : null,
        sqft: null as number | null,
        market_rent_cents: parseDollarsInput(form.market_rent),
        status: form.status,
        notes: null as string | null,
      };
      if (editingId) {
        await updateUnit(editingId, payload);
        toast({ title: "Unit updated", variant: "success" });
      } else {
        await createUnit(payload, user.id);
        toast({ title: "Unit added", variant: "success" });
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
    if (!confirmDelete("unit (and related leases)")) return;
    try {
      await deleteUnit(id);
      toast({ title: "Unit deleted", variant: "success" });
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
            Units
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Rentable spaces within properties.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setForm({
              property_id: propertyFilter ?? "",
              label: "",
              beds: "",
              baths: "",
              market_rent: "",
              status: "vacant",
            });
            setOpen((v) => !v);
          }}
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      {open ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit unit" : "New unit"}</CardTitle>
            <CardDescription>Market rent stored as cents.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => void onSave(e)}
            >
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
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  required
                  placeholder="Unit 2B"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="flex h-11 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as UnitStatus })
                  }
                >
                  {(["vacant", "occupied", "maintenance", "offline"] as const).map(
                    (s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="market_rent">Market rent ($)</Label>
                <Input
                  id="market_rent"
                  inputMode="decimal"
                  value={form.market_rent}
                  onChange={(e) =>
                    setForm({ ...form, market_rent: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="beds">Beds</Label>
                <Input
                  id="beds"
                  inputMode="decimal"
                  value={form.beds}
                  onChange={(e) => setForm({ ...form, beds: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="baths">Baths</Label>
                <Input
                  id="baths"
                  inputMode="decimal"
                  value={form.baths}
                  onChange={(e) => setForm({ ...form, baths: e.target.value })}
                />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : editingId ? "Save changes" : "Save unit"}
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
        <Skeleton className="h-24 w-full" />
      ) : data.length === 0 ? (
        <EmptyState
          title="No units"
          description="Add units so you can attach leases and track occupancy."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              Add unit
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b bg-[var(--color-muted)]/50 text-[var(--color-muted-foreground)]">
              <tr>
                <th className="px-3 py-2 font-medium">Unit</th>
                <th className="px-3 py-2 font-medium">Property</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Market rent</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-3 py-3 font-medium">{u.label}</td>
                  <td className="px-3 py-3">{propertyName(u.property_id)}</td>
                  <td className="px-3 py-3">
                    <Badge
                      variant={
                        u.status === "occupied"
                          ? "success"
                          : u.status === "vacant"
                            ? "warning"
                            : "muted"
                      }
                    >
                      {u.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {u.market_rent_cents != null
                      ? formatCents(u.market_rent_cents)
                      : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <RowActions
                      onEdit={() => startEdit(u)}
                      onDelete={() => void onDelete(u.id)}
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
