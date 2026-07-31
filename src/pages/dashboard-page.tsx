import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Building2,
  CircleDollarSign,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, parseISO, startOfMonth, differenceInCalendarDays } from "date-fns";
import { MetricCard } from "@/components/dashboard/metric-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useProperties, useTransactions, useUnits } from "@/hooks/use-data";
import { useOpsLists } from "@/hooks/use-ops";
import {
  computeFinancialSummary,
  formatCapRate,
} from "@/lib/finance";
import { formatCents } from "@/lib/money";

export function DashboardPage() {
  const properties = useProperties();
  const units = useUnits();
  const transactions = useTransactions();
  const ops = useOpsLists();

  const loading =
    properties.loading || units.loading || transactions.loading;
  const error = properties.error || units.error || transactions.error;

  const purchaseTotal = properties.data.reduce(
    (acc, p) => acc + (p.purchase_price_cents ?? 0),
    0,
  );

  const summary = computeFinancialSummary(
    transactions.data.map((t) => ({
      category: t.category,
      amount_cents: t.amount_cents,
      type: t.type,
    })),
    purchaseTotal || null,
  );

  const occupied = units.data.filter((u) => u.status === "occupied").length;
  const occupancy =
    units.data.length > 0
      ? `${Math.round((occupied / units.data.length) * 100)}%`
      : "—";

  const byMonth = new Map<string, { income: number; expense: number }>();
  for (const t of transactions.data) {
    const key = format(startOfMonth(parseISO(t.occurred_on)), "MMM yyyy");
    const row = byMonth.get(key) ?? { income: 0, expense: 0 };
    if (t.type === "income") row.income += t.amount_cents / 100;
    else row.expense += t.amount_cents / 100;
    byMonth.set(key, row);
  }
  const chartData = [...byMonth.entries()]
    .slice(0, 6)
    .reverse()
    .map(([month, v]) => ({ month, ...v }));

  const rentDue = ops.rentPayments.filter((p) => p.status !== "paid");
  const openTickets = ops.tickets.filter((t) => t.status !== "closed");
  const today = new Date();
  const leasesEnding = ops.leases.filter((l) => {
    if (!l.end_date || l.status !== "active") return false;
    const days = differenceInCalendarDays(parseISO(l.end_date), today);
    return days >= 0 && days <= 90;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Portfolio
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Ownership OS — cash, turns, and decisions.
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/quick-add">Quick add</Link>
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          title="NOI"
          value={formatCents(summary.noiCents)}
          hint="Income − OpEx"
          icon={TrendingUp}
          trend={summary.noiCents >= 0 ? "up" : "down"}
          loading={loading}
        />
        <MetricCard
          title="Net Cash Flow"
          value={formatCents(summary.netCashFlowCents)}
          hint="NOI − CapEx − Debt"
          icon={Wallet}
          loading={loading}
        />
        <MetricCard
          title="Cap Rate"
          value={formatCapRate(summary.capRate)}
          hint="NOI ÷ purchase basis"
          icon={CircleDollarSign}
          loading={loading}
        />
        <MetricCard
          title="Occupancy"
          value={occupancy}
          hint={`${occupied}/${units.data.length} units`}
          icon={Building2}
          loading={loading}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <AlertCard
          title="Rent due"
          count={rentDue.length}
          href="/rent-roll"
          tone={rentDue.length ? "warn" : "ok"}
        />
        <AlertCard
          title="Open work orders"
          count={openTickets.length}
          href="/maintenance"
          tone={openTickets.length ? "warn" : "ok"}
        />
        <AlertCard
          title="Leases ≤90d"
          count={leasesEnding.length}
          href="/calendar"
          tone={leasesEnding.length ? "warn" : "ok"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Cash activity</CardTitle>
            <CardDescription>Income vs expenses by month</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : chartData.length === 0 ? (
              <EmptyState
                title="No transactions yet"
                description="Log rent and expenses to see cash activity."
                action={
                  <Button asChild size="sm">
                    <Link to="/transactions">Open ledger</Link>
                  </Button>
                }
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={48} />
                  <Tooltip
                    formatter={(value) =>
                      formatCents(Math.round(Number(value) * 100))
                    }
                  />
                  <Bar dataKey="income" fill="#1a7a6d" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="#0b3d5c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Shortcuts</CardTitle>
            <CardDescription>Day-to-day ops</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {[
              ["/rent-roll", "Collect rent"],
              ["/turns", "Unit turns"],
              ["/property-pnl", "Property P&L"],
              ["/deals", "Deal pipeline"],
              ["/tax-export", "Tax CSV"],
              ["/scenarios", "Scenarios"],
            ].map(([to, label]) => (
              <Button key={to} asChild variant="outline" className="justify-start">
                <Link to={to}>{label}</Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AlertCard({
  title,
  count,
  href,
  tone,
}: {
  title: string;
  count: number;
  href: string;
  tone: "ok" | "warn";
}) {
  return (
    <Link to={href}>
      <Card className="transition-colors hover:border-[var(--color-primary)]">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {title}
            </p>
            <p className="text-2xl font-semibold tabular-nums">{count}</p>
          </div>
          <Badge variant={tone === "warn" ? "warning" : "success"}>
            {tone === "warn" ? "Action" : "Clear"}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
