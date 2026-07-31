import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { useOpsLists } from "@/hooks/use-ops";
import { demoAddDocument } from "@/lib/demo-store";
import { useToast } from "@/components/ui/toast";
import type { DocumentKind } from "@/types/ops";

export function DocumentsPage() {
  const { user } = useAuth();
  const { documents, properties, reload } = useOpsLists();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [kind, setKind] = React.useState<DocumentKind>("other");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Document vault"
        description="Leases, insurance, warranties, W-9s, photos."
        action={
          <Button size="sm" onClick={() => setOpen((v) => !v)}>
            Add
          </Button>
        }
      />
      {open ? (
        <Card>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Kind</Label>
              <select
                className="flex h-11 w-full rounded-md border bg-white px-3 text-sm"
                value={kind}
                onChange={(e) => setKind(e.target.value as DocumentKind)}
              >
                {(
                  [
                    "lease",
                    "insurance",
                    "warranty",
                    "w9",
                    "photo",
                    "inspection",
                    "other",
                  ] as const
                ).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={() => {
                if (!user || !title) return;
                demoAddDocument(
                  {
                    property_id: properties[0]?.id ?? null,
                    unit_id: null,
                    lease_id: null,
                    kind,
                    title,
                    path: `local/${title.replace(/\s+/g, "-").toLowerCase()}`,
                    notes: null,
                  },
                  user.id,
                );
                setTitle("");
                setOpen(false);
                reload();
                toast({ title: "Document saved", variant: "success" });
              }}
            >
              Save
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <ul className="space-y-2">
        {documents.map((d) => {
          const property = properties.find((p) => p.id === d.property_id);
          return (
            <li key={d.id}>
              <Card>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{d.title}</p>
                      <Badge variant="muted">{d.kind}</Badge>
                    </div>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      {property?.name ?? "Portfolio"} · {d.path}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
