import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOpsLists } from "@/hooks/use-ops";
import { demoToggleTurnChecklist, demoUpdateTurn } from "@/lib/demo-store";
import { formatCents } from "@/lib/money";
import type { TurnStage } from "@/types/ops";

const stages: TurnStage[] = [
  "notice",
  "vacant",
  "make_ready",
  "listed",
  "leased",
];

export function TurnsPage() {
  const { turns, units, properties, reload } = useOpsLists();

  return (
    <div>
      <PageHeader
        title="Unit turns"
        description="Vacancy → make-ready → listed → leased."
      />
      <ul className="space-y-4">
        {turns.map((t) => {
          const unit = units.find((u) => u.id === t.unit_id);
          const property = properties.find((p) => p.id === t.property_id);
          const done = t.checklist.filter((c) => c.done).length;
          return (
            <li key={t.id}>
              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">
                      {property?.name} · {unit?.label}
                    </p>
                    <Badge>{t.stage.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    Vacant {t.vacant_on ?? "—"} · Target{" "}
                    {t.target_rent_cents != null
                      ? formatCents(t.target_rent_cents)
                      : "—"}{" "}
                    · Checklist {done}/{t.checklist.length}
                  </p>
                  <ul className="space-y-1">
                    {t.checklist.map((c, i) => (
                      <li key={c.item}>
                        <label className="flex min-h-10 items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={c.done}
                            onChange={() => {
                              demoToggleTurnChecklist(t.id, i);
                              reload();
                            }}
                          />
                          {c.item}
                        </label>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    {stages.map((stage) => (
                      <Button
                        key={stage}
                        size="sm"
                        variant={t.stage === stage ? "default" : "outline"}
                        onClick={() => {
                          demoUpdateTurn(t.id, {
                            stage,
                            listed_on:
                              stage === "listed"
                                ? new Date().toISOString().slice(0, 10)
                                : t.listed_on,
                          });
                          reload();
                        }}
                      >
                        {stage.replace("_", " ")}
                      </Button>
                    ))}
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
