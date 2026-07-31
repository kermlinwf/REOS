import { Link, useLocation } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  Calculator,
  ClipboardCheck,
  FileStack,
  FolderOpen,
  Handshake,
  LayoutDashboard,
  MapPinned,
  MessageSquare,
  MoreHorizontal,
  PiggyBank,
  Receipt,
  RefreshCw,
  ScrollText,
  Shield,
  Wrench,
  X,
} from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const primary = [
  { to: "/", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/rent-roll", label: "Rent", icon: PiggyBank, end: false },
  { to: "/transactions", label: "Ledger", icon: Receipt, end: false },
  { to: "/maintenance", label: "Work", icon: Wrench, end: false },
] as const;

export const moreLinks = [
  { to: "/properties", label: "Properties", icon: Building2, group: "Assets" },
  { to: "/units", label: "Units", icon: Building2, group: "Assets" },
  { to: "/turns", label: "Unit turns", icon: RefreshCw, group: "Assets" },
  { to: "/leases", label: "Leases", icon: ScrollText, group: "People" },
  { to: "/tenants", label: "Tenants", icon: MessageSquare, group: "People" },
  { to: "/calendar", label: "Lease calendar", icon: CalendarDays, group: "People" },
  { to: "/deposits", label: "Deposits", icon: Shield, group: "Money" },
  { to: "/mortgages", label: "Mortgages", icon: Building2, group: "Money" },
  { to: "/budgets", label: "Budgets", icon: Calculator, group: "Money" },
  { to: "/recurring", label: "Recurring bills", icon: RefreshCw, group: "Money" },
  { to: "/property-pnl", label: "Property P&L", icon: Calculator, group: "Money" },
  { to: "/tax-export", label: "Tax export", icon: FolderOpen, group: "Money" },
  { to: "/scenarios", label: "Scenarios", icon: Calculator, group: "Decide" },
  { to: "/deals", label: "Deal pipeline", icon: Handshake, group: "Decide" },
  { to: "/map", label: "Portfolio map", icon: MapPinned, group: "Decide" },
  { to: "/vendors", label: "Vendors", icon: Handshake, group: "Ops" },
  { to: "/inspections", label: "Inspections", icon: ClipboardCheck, group: "Ops" },
  { to: "/communications", label: "Comms log", icon: MessageSquare, group: "Ops" },
  { to: "/documents", label: "Document vault", icon: FileStack, group: "Ops" },
  { to: "/quick-add", label: "Quick add", icon: Receipt, group: "Ops" },
  { to: "/audit", label: "Audit trail", icon: ScrollText, group: "Ops" },
] as const;

export function BottomNav() {
  const [open, setOpen] = React.useState(false);
  const location = useLocation();
  const moreActive = moreLinks.some((l) => location.pathname.startsWith(l.to));

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--color-border)] bg-white/95 backdrop-blur-md safe-x safe-bottom md:hidden"
        aria-label="Primary"
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
          {primary.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={cn(
                  "flex min-h-[52px] flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium",
                  (end ? location.pathname === "/" : location.pathname.startsWith(to))
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-muted-foreground)]",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            </li>
          ))}
          <li className="flex-1">
            <button
              type="button"
              className={cn(
                "flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium",
                open || moreActive
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-muted-foreground)]",
              )}
              onClick={() => setOpen(true)}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span>More</span>
            </button>
          </li>
        </ul>
      </nav>

      {open ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[75dvh] overflow-y-auto rounded-t-2xl bg-white p-4 safe-bottom safe-x">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold">All tools</p>
              <button
                type="button"
                className="touch-target inline-flex items-center justify-center"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {(["Assets", "People", "Money", "Decide", "Ops"] as const).map(
              (group) => (
                <div key={group} className="mb-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                    {group}
                  </p>
                  <ul className="grid grid-cols-2 gap-2">
                    {moreLinks
                      .filter((l) => l.group === group)
                      .map(({ to, label, icon: Icon }) => (
                        <li key={to}>
                          <Link
                            to={to}
                            onClick={() => setOpen(false)}
                            className="flex min-h-11 items-center gap-2 rounded-md border border-[var(--color-border)] px-3 text-sm"
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            {label}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              ),
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
