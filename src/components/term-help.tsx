import * as React from "react";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Plain-English definitions for portfolio metrics. */
export const FINANCE_TERMS: Record<string, string> = {
  NOI: "Net Operating Income — what’s left after collecting rent and paying normal operating costs (repairs, insurance, taxes, management). It does not subtract mortgage payments or major renovations.",
  "Net Cash Flow":
    "The cash that actually hits your pocket after NOI, big capital improvements (CapEx), and mortgage/debt payments.",
  "Cap Rate":
    "Capitalization rate — yearly NOI divided by what you paid for the property. Higher usually means more income relative to purchase price (and often more risk).",
  "Cap rate":
    "Capitalization rate — yearly NOI divided by what you paid for the property. Higher usually means more income relative to purchase price (and often more risk).",
  Occupancy:
    "Share of units that currently have a tenant. 100% means every unit is rented; lower means vacancy is costing you rent.",
  "Gross income":
    "All money coming in from the property before expenses — mainly rent, plus fees and other income.",
  OpEx: "Operating expenses — day-to-day costs to run the property (maintenance, insurance, utilities, property tax, management). Not the mortgage, and not big upgrades.",
  CapEx: "Capital expenditures — big one-time improvements that add lasting value (new roof, HVAC, renovation), not routine repairs.",
  "Debt service":
    "Mortgage and loan payments — principal and interest you pay the lender. Pulled from ledger mortgage lines, or from the Mortgages screen if you haven’t logged payments yet.",
  "Cash flow":
    "Money left after operating costs, CapEx, and debt payments — what you can actually keep or reinvest.",
  Basis:
    "What you paid for the property (purchase price). Used with NOI to figure cap rate.",
  "Purchase basis":
    "What you paid for the property (purchase price). Used with NOI to figure cap rate.",
};

export function TermHelp({
  term,
  className,
}: {
  term: string;
  className?: string;
}) {
  const text = FINANCE_TERMS[term];
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent | TouchEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [open]);

  if (!text) return null;

  return (
    <span ref={ref} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        className="touch-target inline-flex h-6 w-6 items-center justify-center rounded-full text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
        aria-label={`What is ${term}?`}
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <HelpCircle className="h-3.5 w-3.5" aria-hidden />
      </button>
      {open ? (
        <span
          role="tooltip"
          className="absolute left-1/2 top-full z-50 mt-1 w-56 -translate-x-1/2 rounded-md border border-[var(--color-border)] bg-white p-2.5 text-left text-xs font-normal leading-snug text-[var(--color-foreground)] shadow-lg sm:w-64"
        >
          <span className="font-semibold">{term}</span>
          <span className="mt-1 block text-[var(--color-muted-foreground)]">
            {text}
          </span>
        </span>
      ) : null}
    </span>
  );
}
