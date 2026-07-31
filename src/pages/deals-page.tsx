import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOpsLists } from "@/hooks/use-ops";
import { demoUpdateDeal } from "@/lib/demo-store";
import { formatCents } from "@/lib/money";
import { formatCapRate } from "@/lib/finance";
import type { DealStage } from "@/types/ops";

const stages: DealStage[] = [
  "lead",
  "underwriting",
  "offer",
  "under_contract",
  "closed",
  "dead",
];

export function DealsPage() {
  const { deals, reload } = useOpsLists();

  return (
    <div>
      <PageHeader
        title="Deal pipeline"
        description="Underwrite acquisitions with the same NOI / cap-rate lens."
      />
      <ul className="space-y-3">
        {deals.map((d) => {
          const price = d.offer_price_cents ?? d.asking_price_cents;
          const cap =
            price && d.estimated_noi_cents
              ? d.estimated_noi_cents / price
              : null;
          return (
            <li key={d.id}>
              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{d.name}</p>
                    <Badge>{d.stage.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {d.address}, {d.city}, {d.state}
                  </p>
                  <p className="text-sm tabular-nums">
                    Ask{" "}
                    {d.asking_price_cents != null
                      ? formatCents(d.asking_price_cents)
                      : "—"}{" "}
                    · Offer{" "}
                    {d.offer_price_cents != null
                      ? formatCents(d.offer_price_cents)
                      : "—"}{" "}
                    · Est. NOI{" "}
                    {d.estimated_noi_cents != null
                      ? formatCents(d.estimated_noi_cents)
                      : "—"}{" "}
                    · Cap {formatCapRate(cap)}
                  </p>
                  {d.notes ? (
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      {d.notes}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {stages.map((stage) => (
                      <Button
                        key={stage}
                        size="sm"
                        variant={d.stage === stage ? "default" : "outline"}
                        onClick={() => {
                          demoUpdateDeal(d.id, { stage });
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
