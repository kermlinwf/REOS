import * as React from "react";
import {
  demoEnsureRentRoll,
  demoGetStore,
  demoOps,
} from "@/lib/demo-store";
import type { DemoStore } from "@/lib/demo-store";

/** Force re-render after local store mutations */
export function useDemoStore(): DemoStore & { reload: () => void } {
  const [tick, setTick] = React.useState(0);
  const reload = React.useCallback(() => setTick((t) => t + 1), []);

  React.useEffect(() => {
    demoEnsureRentRoll();
  }, []);

  React.useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener("reos-store-changed", bump);
    return () => window.removeEventListener("reos-store-changed", bump);
  }, []);

  const store = React.useMemo(() => {
    void tick;
    return demoGetStore();
  }, [tick]);

  return { ...store, reload };
}

export function useOpsLists() {
  const store = useDemoStore();
  return {
    ...store,
    mortgages: demoOps.mortgages(),
    vendors: demoOps.vendors(),
    tickets: demoOps.tickets(),
    inspections: demoOps.inspections(),
    communications: demoOps.communications(),
    recurringBills: demoOps.recurringBills(),
    documents: demoOps.documents(),
    budgets: demoOps.budgets(),
    deals: demoOps.deals(),
    rentPayments: demoOps.rentPayments(),
    depositEvents: demoOps.depositEvents(),
    turns: demoOps.turns(),
    audit: demoOps.audit(),
  };
}
