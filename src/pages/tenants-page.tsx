import * as React from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { createTenant, useTenants } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

export function TenantsPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useTenants();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    full_name: "",
    email: "",
    phone: "",
  });
  const [query, setQuery] = React.useState("");

  const filtered = data.filter((t) => {
    const q = query.toLowerCase();
    return (
      !q ||
      t.full_name.toLowerCase().includes(q) ||
      (t.email?.toLowerCase().includes(q) ?? false) ||
      (t.phone?.includes(q) ?? false)
    );
  });

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await createTenant(
        {
          full_name: form.full_name,
          email: form.email || null,
          phone: form.phone || null,
          notes: null,
        },
        user.id,
      );
      toast({ title: "Tenant added", variant: "success" });
      setOpen(false);
      setForm({ full_name: "", email: "", phone: "" });
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
            Tenants
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            People on your leases.
          </p>
        </div>
        <Button onClick={() => setOpen((v) => !v)} size="sm">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <Input
        placeholder="Filter by name, email, phone…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Filter tenants"
      />

      {open ? (
        <Card>
          <CardHeader>
            <CardTitle>New tenant</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => void onCreate(e)}>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  required
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({ ...form, full_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save tenant"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
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
      ) : filtered.length === 0 ? (
        <EmptyState
          title={data.length === 0 ? "No tenants" : "No matches"}
          description="Add tenants before creating leases."
          action={
            data.length === 0 ? (
              <Button size="sm" onClick={() => setOpen(true)}>
                Add tenant
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
          {filtered.map((t) => (
            <li key={t.id} className="px-4 py-3">
              <p className="font-medium">{t.full_name}</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                {[t.email, t.phone].filter(Boolean).join(" · ") || "No contact"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
