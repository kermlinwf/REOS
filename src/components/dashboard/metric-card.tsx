import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function MetricCard({
  title,
  value,
  hint,
  icon: Icon,
  trend,
  loading,
}: {
  title: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
          {title}
        </CardTitle>
        {Icon ? (
          <Icon className="h-4 w-4 text-[var(--color-muted-foreground)]" />
        ) : null}
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "text-2xl font-semibold tracking-tight",
            trend === "up" && "text-[var(--color-success)]",
            trend === "down" && "text-[var(--color-destructive)]",
          )}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {value}
        </p>
        {hint ? (
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {hint}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
