import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useOpsLists } from "@/hooks/use-ops";
import { formatCents } from "@/lib/money";

/** Lightweight concentration view — links out to maps for each address. */
export function MapPage() {
  const { properties, units } = useOpsLists();

  return (
    <div>
      <PageHeader
        title="Portfolio map"
        description="Where capital sits — open each asset in maps."
      />
      <ul className="space-y-3">
        {properties.map((p) => {
          const unitCount = units.filter((u) => u.property_id === p.id).length;
          const q = encodeURIComponent(
            `${p.address_line1}, ${p.city}, ${p.state} ${p.postal_code}`,
          );
          return (
            <li key={p.id}>
              <Card>
                <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      {p.address_line1}, {p.city}, {p.state} · {unitCount} units
                      · Basis{" "}
                      {p.purchase_price_cents != null
                        ? formatCents(p.purchase_price_cents)
                        : "—"}
                    </p>
                  </div>
                  <a
                    className="text-sm font-medium text-[var(--color-primary)] underline"
                    href={`https://www.google.com/maps/search/?api=1&query=${q}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Maps
                  </a>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
