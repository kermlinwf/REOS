import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useOpsLists } from "@/hooks/use-ops";

export function AuditPage() {
  const { audit } = useOpsLists();

  return (
    <div>
      <PageHeader
        title="Audit trail"
        description="Recent creates and updates across the portfolio."
      />
      <ul className="space-y-2">
        {audit.map((a) => (
          <li key={a.id}>
            <Card>
              <CardContent className="p-3 text-sm">
                <p className="font-medium">
                  {a.entity} · {a.action}
                </p>
                <p className="text-[var(--color-muted-foreground)]">{a.detail}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {new Date(a.created_at).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
