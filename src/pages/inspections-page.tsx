import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useOpsLists } from "@/hooks/use-ops";

export function InspectionsPage() {
  const { inspections, properties, units } = useOpsLists();

  return (
    <div>
      <PageHeader
        title="Inspections"
        description="Move-in / move-out / periodic checklists."
      />
      <ul className="space-y-3">
        {inspections.map((insp) => {
          const property = properties.find((p) => p.id === insp.property_id);
          const unit = units.find((u) => u.id === insp.unit_id);
          const fails = insp.checklist.filter((c) => !c.ok).length;
          return (
            <li key={insp.id}>
              <Card>
                <CardContent className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">
                      {property?.name}
                      {unit ? ` · ${unit.label}` : ""}
                    </p>
                    <Badge variant="muted">{insp.type.replace("_", " ")}</Badge>
                    {fails > 0 ? (
                      <Badge variant="warning">{fails} issues</Badge>
                    ) : (
                      <Badge variant="success">Clear</Badge>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {insp.inspected_on}
                    {insp.summary ? ` — ${insp.summary}` : ""}
                  </p>
                  <ul className="text-sm">
                    {insp.checklist.map((c) => (
                      <li key={c.item}>
                        {c.ok ? "✓" : "✗"} {c.item}
                        {c.note ? ` (${c.note})` : ""}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
