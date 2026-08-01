import * as React from "react";
import { Upload } from "lucide-react";
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
  demoAddDocument,
  demoDeleteDocument,
} from "@/lib/demo-store";
import { fileToCompressedDataUrl, isDataUrl } from "@/lib/media";
import { useToast } from "@/components/ui/toast";
import { confirmDelete, RowActions } from "@/components/row-actions";
import type { DocumentKind } from "@/types/ops";

const KINDS: DocumentKind[] = [
  "photo",
  "lease",
  "insurance",
  "warranty",
  "w9",
  "inspection",
  "other",
];

export function DocumentsPage() {
  const { user } = useAuth();
  const { documents, properties, tenants, leases, units, reload } =
    useOpsLists();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [tenantFilter, setTenantFilter] = React.useState("all");
  const [form, setForm] = React.useState({
    title: "",
    kind: "photo" as DocumentKind,
    property_id: "",
    tenant_id: "",
    notes: "",
  });
  const [file, setFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    if (!form.property_id && properties[0]) {
      setForm((f) => ({ ...f, property_id: properties[0].id }));
    }
  }, [properties, form.property_id]);

  const filtered = documents.filter((d) => {
    if (tenantFilter === "all") return true;
    if (tenantFilter === "none") return !d.tenant_id;
    return d.tenant_id === tenantFilter;
  });

  function resetForm() {
    setOpen(false);
    setFile(null);
    setForm({
      title: "",
      kind: "photo",
      property_id: properties[0]?.id ?? "",
      tenant_id: "",
      notes: "",
    });
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (!file && form.kind === "photo") {
      toast({
        title: "Add a photo",
        description: "Pick a screenshot or image from your phone.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      let path = `local/${form.title.trim().replace(/\s+/g, "-").toLowerCase()}`;
      if (file) {
        path = await fileToCompressedDataUrl(file);
      }

      const tenantId = form.tenant_id || null;
      const lease = tenantId
        ? leases.find(
            (l) => l.tenant_id === tenantId && l.status === "active",
          ) ?? leases.find((l) => l.tenant_id === tenantId)
        : null;
      const unit = lease
        ? units.find((u) => u.id === lease.unit_id)
        : null;

      demoAddDocument(
        {
          property_id:
            form.property_id ||
            unit?.property_id ||
            properties[0]?.id ||
            null,
          unit_id: unit?.id ?? null,
          lease_id: lease?.id ?? null,
          tenant_id: tenantId,
          kind: form.kind,
          title: form.title.trim(),
          path,
          notes: form.notes.trim() || null,
        },
        user.id,
      );
      toast({ title: "Saved to vault", variant: "success" });
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

  return (
    <div className="space-y-4">
      <PageHeader
        title="Document vault"
        description="Leases, insurance, and tenant screenshots — linked to the right person."
        action={
          <Button size="sm" onClick={() => (open ? resetForm() : setOpen(true))}>
            {open ? "Cancel" : "Add"}
          </Button>
        }
      />

      {open ? (
        <Card>
          <CardContent className="p-4">
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => void onSave(e)}>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Title</Label>
                <Input
                  required
                  placeholder="ID screenshot, lease photo…"
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Kind</Label>
                <select
                  className="flex h-11 w-full rounded-md border bg-white px-3 text-sm"
                  value={form.kind}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      kind: e.target.value as DocumentKind,
                    })
                  }
                >
                  {KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Tenant</Label>
                <select
                  className="flex h-11 w-full rounded-md border bg-white px-3 text-sm"
                  value={form.tenant_id}
                  onChange={(e) =>
                    setForm({ ...form, tenant_id: e.target.value })
                  }
                >
                  <option value="">None / portfolio</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Property</Label>
                <select
                  className="flex h-11 w-full rounded-md border bg-white px-3 text-sm"
                  value={form.property_id}
                  onChange={(e) =>
                    setForm({ ...form, property_id: e.target.value })
                  }
                >
                  <option value="">Optional</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Photo / file</Label>
                <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 text-sm text-[var(--color-muted-foreground)]">
                  <Upload className="h-4 w-4" />
                  {file ? file.name : "Take photo or choose screenshot"}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    capture="environment"
                    className="sr-only"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Notes</Label>
                <Input
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save to vault"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="doc-tenant-filter">Filter by tenant</Label>
        <select
          id="doc-tenant-filter"
          className="flex h-11 w-full max-w-md rounded-md border bg-white px-3 text-sm"
          value={tenantFilter}
          onChange={(e) => setTenantFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="none">No tenant linked</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.full_name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No documents"
          description="Add screenshots of IDs, leases, or insurance and link them to a tenant."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              Add document
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((d) => {
            const property = properties.find((p) => p.id === d.property_id);
            const tenant = tenants.find((t) => t.id === d.tenant_id);
            return (
              <li key={d.id}>
                <Card>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{d.title}</p>
                          <Badge variant="muted">{d.kind}</Badge>
                        </div>
                        <p className="text-sm text-[var(--color-muted-foreground)]">
                          {tenant
                            ? `Tenant: ${tenant.full_name}`
                            : "No tenant"}
                          {property ? ` · ${property.name}` : ""}
                        </p>
                        {d.notes ? (
                          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                            {d.notes}
                          </p>
                        ) : null}
                      </div>
                      <RowActions
                        onDelete={() => {
                          if (!confirmDelete("document")) return;
                          demoDeleteDocument(d.id);
                          toast({
                            title: "Document deleted",
                            variant: "success",
                          });
                          reload();
                        }}
                      />
                    </div>
                    {isDataUrl(d.path) && d.path.startsWith("data:image") ? (
                      <a href={d.path} target="_blank" rel="noreferrer">
                        <img
                          src={d.path}
                          alt={d.title}
                          className="max-h-64 w-full rounded-md border object-contain bg-[var(--color-muted)]"
                        />
                      </a>
                    ) : isDataUrl(d.path) ? (
                      <a
                        className="text-sm text-[var(--color-primary)] underline"
                        href={d.path}
                        download={`${d.title}.bin`}
                      >
                        Download file
                      </a>
                    ) : (
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {d.path}
                      </p>
                    )}
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
