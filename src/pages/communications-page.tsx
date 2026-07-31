import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { useOpsLists } from "@/hooks/use-ops";
import { demoAddCommunication } from "@/lib/demo-store";
import { useToast } from "@/components/ui/toast";
import type { CommChannel } from "@/types/ops";

export function CommunicationsPage() {
  const { user } = useAuth();
  const { communications, tenants, properties, reload } = useOpsLists();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [channel, setChannel] = React.useState<CommChannel>("note");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Communications"
        description="Calls, texts, emails — searchable history."
        action={
          <Button size="sm" onClick={() => setOpen((v) => !v)}>
            Log
          </Button>
        }
      />
      {open ? (
        <Card>
          <CardContent className="grid gap-3 p-4">
            <div className="space-y-1.5">
              <Label>Channel</Label>
              <select
                className="flex h-11 w-full rounded-md border bg-white px-3 text-sm"
                value={channel}
                onChange={(e) => setChannel(e.target.value as CommChannel)}
              >
                {(["call", "text", "email", "in_person", "note"] as const).map(
                  (c) => (
                    <option key={c} value={c}>
                      {c.replace("_", " ")}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <Button
              onClick={() => {
                if (!user || !subject) return;
                demoAddCommunication(
                  {
                    property_id: properties[0]?.id ?? null,
                    unit_id: null,
                    tenant_id: tenants[0]?.id ?? null,
                    channel,
                    subject,
                    body,
                    occurred_at: new Date().toISOString(),
                  },
                  user.id,
                );
                setSubject("");
                setBody("");
                setOpen(false);
                reload();
                toast({ title: "Logged", variant: "success" });
              }}
            >
              Save
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <ul className="space-y-2">
        {communications.map((c) => (
          <li key={c.id}>
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{c.subject}</p>
                  <Badge variant="muted">{c.channel.replace("_", " ")}</Badge>
                </div>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {new Date(c.occurred_at).toLocaleString()}
                </p>
                <p className="mt-1 text-sm">{c.body}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
