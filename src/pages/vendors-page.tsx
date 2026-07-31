import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { useOpsLists } from "@/hooks/use-ops";
import { demoAddVendor } from "@/lib/demo-store";
import { useToast } from "@/components/ui/toast";

export function VendorsPage() {
  const { user } = useAuth();
  const { vendors, reload } = useOpsLists();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [trade, setTrade] = React.useState("");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Vendors"
        description="Preferred trades and contacts."
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
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Trade</Label>
              <Input value={trade} onChange={(e) => setTrade(e.target.value)} />
            </div>
            <Button
              onClick={() => {
                if (!user || !name) return;
                demoAddVendor(
                  {
                    name,
                    trade: trade || "General",
                    phone: null,
                    email: null,
                    notes: null,
                  },
                  user.id,
                );
                setName("");
                setTrade("");
                setOpen(false);
                reload();
                toast({ title: "Vendor added", variant: "success" });
              }}
            >
              Save
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <ul className="divide-y overflow-hidden rounded-lg border bg-white">
        {vendors.map((v) => (
          <li key={v.id} className="px-4 py-3">
            <p className="font-medium">{v.name}</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {v.trade}
              {v.phone ? ` · ${v.phone}` : ""}
              {v.notes ? ` · ${v.notes}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
