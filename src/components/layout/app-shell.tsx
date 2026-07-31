import type { ComponentType } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { BottomNav, moreLinks } from "./bottom-nav";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  PiggyBank,
  Receipt,
  Wrench,
} from "lucide-react";

const topLinks = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true as boolean | undefined },
  { to: "/rent-roll", label: "Rent roll", icon: PiggyBank, end: undefined as boolean | undefined },
  { to: "/transactions", label: "Ledger", icon: Receipt, end: undefined as boolean | undefined },
  { to: "/maintenance", label: "Maintenance", icon: Wrench, end: undefined as boolean | undefined },
  { to: "/quick-add", label: "Quick add", icon: Receipt, end: undefined as boolean | undefined },
];

export function AppShell() {
  const { isSolo } = useAuth();

  return (
    <div className="min-h-dvh safe-x">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-white/90 backdrop-blur-md safe-top">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--color-primary)] text-xs font-bold text-white">
              RE
            </div>
            <div>
              <p
                className="text-sm font-semibold tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                REOS
              </p>
              <p className="hidden text-[10px] text-[var(--color-muted-foreground)] sm:block">
                Real Estate Operations
              </p>
            </div>
            {isSolo ? (
              <span className="rounded-md bg-[var(--color-muted)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                Local
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-4 md:py-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <nav
            className="sticky top-20 flex max-h-[calc(100dvh-6rem)] flex-col gap-4 overflow-y-auto pr-1"
            aria-label="Sidebar"
          >
            <div className="flex flex-col gap-1">
              {topLinks.map(({ to, label, icon: Icon, end }) => (
                <SideLink key={to} to={to} label={label} icon={Icon} end={end} />
              ))}
            </div>
            {(["Assets", "People", "Money", "Decide", "Ops"] as const).map(
              (group) => (
                <div key={group}>
                  <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                    {group}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {moreLinks
                      .filter((l) => l.group === group)
                      .map(({ to, label, icon: Icon }) => (
                        <SideLink key={to} to={to} label={label} icon={Icon} />
                      ))}
                  </div>
                </div>
              ),
            )}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-nav md:pb-6">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

function SideLink({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
          isActive
            ? "bg-[var(--color-primary)] text-white"
            : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]",
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </NavLink>
  );
}
