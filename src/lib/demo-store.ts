import type {
  Lease,
  LeaseWithRelations,
  Property,
  Tenant,
  Transaction,
  TransactionWithProperty,
  Unit,
} from "@/types/database";
import type {
  AuditEntry,
  BudgetLine,
  CommunicationEntry,
  Deal,
  DepositEvent,
  Inspection,
  MaintenanceTicket,
  Mortgage,
  RecurringBill,
  RentPayment,
  UnitTurn,
  VaultDocument,
  Vendor,
} from "@/types/ops";
import { DEMO_USER_ID } from "./demo";

const STORE_KEY = "reos_local_store_v1";

export interface DemoStore {
  properties: Property[];
  units: Unit[];
  tenants: Tenant[];
  leases: Lease[];
  transactions: Transaction[];
  mortgages: Mortgage[];
  vendors: Vendor[];
  tickets: MaintenanceTicket[];
  inspections: Inspection[];
  communications: CommunicationEntry[];
  recurringBills: RecurringBill[];
  documents: VaultDocument[];
  budgets: BudgetLine[];
  deals: Deal[];
  rentPayments: RentPayment[];
  depositEvents: DepositEvent[];
  turns: UnitTurn[];
  audit: AuditEntry[];
}

function nowIso() {
  return new Date().toISOString();
}

function id() {
  return crypto.randomUUID();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function emptyStore(): DemoStore {
  return {
    properties: [],
    units: [],
    tenants: [],
    leases: [],
    transactions: [],
    mortgages: [],
    vendors: [],
    tickets: [],
    inspections: [],
    communications: [],
    recurringBills: [],
    documents: [],
    budgets: [],
    deals: [],
    rentPayments: [],
    depositEvents: [],
    turns: [],
    audit: [],
  };
}

function seed(): DemoStore {
  return emptyStore();
}

function load(): DemoStore {
  for (const key of ["reos_demo_store_v1", "reos_demo_store_v2"]) {
    localStorage.removeItem(key);
  }
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DemoStore>;
      const empty = emptyStore();
      return {
        ...empty,
        ...parsed,
        properties: parsed.properties ?? empty.properties,
        units: parsed.units ?? empty.units,
        tenants: parsed.tenants ?? empty.tenants,
        leases: parsed.leases ?? empty.leases,
        transactions: parsed.transactions ?? empty.transactions,
        mortgages: parsed.mortgages ?? empty.mortgages,
        vendors: parsed.vendors ?? empty.vendors,
        tickets: parsed.tickets ?? empty.tickets,
        inspections: parsed.inspections ?? empty.inspections,
        communications: parsed.communications ?? empty.communications,
        recurringBills: parsed.recurringBills ?? empty.recurringBills,
        documents: parsed.documents ?? empty.documents,
        budgets: parsed.budgets ?? empty.budgets,
        deals: parsed.deals ?? empty.deals,
        rentPayments: parsed.rentPayments ?? empty.rentPayments,
        depositEvents: parsed.depositEvents ?? empty.depositEvents,
        turns: parsed.turns ?? empty.turns,
        audit: parsed.audit ?? empty.audit,
      };
    }
  } catch {
    /* ignore */
  }
  const initial = seed();
  save(initial);
  return initial;
}

function save(store: DemoStore) {
  const next = JSON.stringify(store);
  const prev = localStorage.getItem(STORE_KEY);
  if (prev === next) return;
  localStorage.setItem(STORE_KEY, next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("reos-store-changed"));
  }
}

function mutate(fn: (store: DemoStore) => void) {
  const store = load();
  const before = JSON.stringify(store);
  fn(store);
  const after = JSON.stringify(store);
  if (before === after) return store;
  save(store);
  return store;
}

function audit(
  store: DemoStore,
  entity: string,
  entityId: string,
  action: string,
  detail: string,
) {
  store.audit.unshift({
    id: id(),
    owner_id: DEMO_USER_ID,
    entity,
    entity_id: entityId,
    action,
    detail,
    created_at: nowIso(),
  });
  store.audit = store.audit.slice(0, 200);
}

export function demoReset() {
  localStorage.removeItem(STORE_KEY);
  const s = seed();
  save(s);
  return s;
}

export function demoGetStore(): DemoStore {
  return load();
}

export function demoListProperties(): Property[] {
  return [...load().properties].sort((a, b) => a.name.localeCompare(b.name));
}

export function demoListUnits(propertyId?: string): Unit[] {
  let units = load().units;
  if (propertyId) units = units.filter((u) => u.property_id === propertyId);
  return [...units].sort((a, b) => a.label.localeCompare(b.label));
}

export function demoListTenants(): Tenant[] {
  return [...load().tenants].sort((a, b) =>
    a.full_name.localeCompare(b.full_name),
  );
}

export function demoListLeases(): LeaseWithRelations[] {
  const store = load();
  return [...store.leases]
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
    .map((lease) => ({
      ...lease,
      unit: store.units.find((u) => u.id === lease.unit_id) ?? null,
      tenant: store.tenants.find((t) => t.id === lease.tenant_id) ?? null,
    }));
}

export function demoListTransactions(
  propertyId?: string,
): TransactionWithProperty[] {
  const store = load();
  let rows = store.transactions;
  if (propertyId) rows = rows.filter((t) => t.property_id === propertyId);
  return [...rows]
    .sort((a, b) => b.occurred_on.localeCompare(a.occurred_on))
    .map((t) => {
      const p = store.properties.find((x) => x.id === t.property_id);
      return {
        ...t,
        property: p ? { id: p.id, name: p.name } : null,
      };
    });
}

export function demoCreateProperty(
  input: Omit<Property, "id" | "created_at" | "updated_at" | "owner_id">,
  ownerId: string,
): Property {
  const ts = nowIso();
  const row: Property = { ...input, id: id(), owner_id: ownerId, created_at: ts, updated_at: ts };
  mutate((s) => {
    s.properties.push(row);
    audit(s, "property", row.id, "create", row.name);
  });
  return row;
}

export function demoCreateUnit(
  input: Omit<Unit, "id" | "created_at" | "updated_at" | "owner_id">,
  ownerId: string,
): Unit {
  const ts = nowIso();
  const row: Unit = { ...input, id: id(), owner_id: ownerId, created_at: ts, updated_at: ts };
  mutate((s) => {
    s.units.push(row);
    audit(s, "unit", row.id, "create", row.label);
  });
  return row;
}

export function demoCreateTenant(
  input: Omit<Tenant, "id" | "created_at" | "updated_at" | "owner_id">,
  ownerId: string,
): Tenant {
  const ts = nowIso();
  const row: Tenant = { ...input, id: id(), owner_id: ownerId, created_at: ts, updated_at: ts };
  mutate((s) => {
    s.tenants.push(row);
    audit(s, "tenant", row.id, "create", row.full_name);
  });
  return row;
}

export function demoCreateLease(
  input: Omit<Lease, "id" | "created_at" | "updated_at" | "owner_id">,
  ownerId: string,
): Lease {
  const ts = nowIso();
  const row: Lease = { ...input, id: id(), owner_id: ownerId, created_at: ts, updated_at: ts };
  mutate((s) => {
    s.leases.push(row);
    if (row.deposit_cents > 0) {
      const unit = s.units.find((u) => u.id === row.unit_id);
      s.depositEvents.push({
        id: id(),
        owner_id: ownerId,
        lease_id: row.id,
        property_id: unit?.property_id ?? "",
        type: "collected",
        amount_cents: row.deposit_cents,
        occurred_on: row.start_date,
        notes: null,
        created_at: ts,
      });
    }
    audit(s, "lease", row.id, "create", `rent ${row.rent_cents}`);
  });
  return row;
}

export function demoCreateTransaction(
  input: Omit<Transaction, "id" | "created_at" | "updated_at" | "owner_id">,
  ownerId: string,
): Transaction {
  const ts = nowIso();
  const row: Transaction = { ...input, id: id(), owner_id: ownerId, created_at: ts, updated_at: ts };
  mutate((s) => {
    s.transactions.push(row);
    audit(s, "transaction", row.id, "create", `${row.type} ${row.amount_cents}`);
  });
  return row;
}

export function demoUploadPath(ownerId: string, file: File): string {
  return `demo/${ownerId}/${file.name}`;
}

/* ---- Ops collections ---- */

export const demoOps = {
  mortgages: () => [...load().mortgages],
  vendors: () => [...load().vendors].sort((a, b) => a.name.localeCompare(b.name)),
  tickets: () => [...load().tickets].sort((a, b) => b.opened_on.localeCompare(a.opened_on)),
  inspections: () => [...load().inspections].sort((a, b) => b.inspected_on.localeCompare(a.inspected_on)),
  communications: () => [...load().communications].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)),
  recurringBills: () => [...load().recurringBills],
  documents: () => [...load().documents].sort((a, b) => b.created_at.localeCompare(a.created_at)),
  budgets: () => [...load().budgets],
  deals: () => [...load().deals],
  rentPayments: () => [...load().rentPayments].sort((a, b) => b.period.localeCompare(a.period)),
  depositEvents: () => [...load().depositEvents].sort((a, b) => b.occurred_on.localeCompare(a.occurred_on)),
  turns: () => [...load().turns],
  audit: () => [...load().audit],
};

export function demoMarkRentPaid(paymentId: string, paidCents?: number) {
  mutate((s) => {
    const row = s.rentPayments.find((p) => p.id === paymentId);
    if (!row) return;
    const amount = paidCents ?? row.due_cents;
    row.paid_cents = amount;
    row.status = amount >= row.due_cents ? "paid" : "partial";
    row.paid_on = today();
    row.updated_at = nowIso();
    s.transactions.push({
      id: id(),
      owner_id: row.owner_id,
      property_id: row.property_id,
      unit_id: row.unit_id,
      lease_id: row.lease_id,
      type: "income",
      category: "rent",
      amount_cents: amount,
      occurred_on: today(),
      description: `Rent ${row.period}`,
      receipt_path: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    audit(s, "rent_payment", row.id, "pay", `${amount} for ${row.period}`);
  });
}

export function demoEnsureRentRoll(period = currentPeriod()) {
  mutate((s) => {
    for (const lease of s.leases.filter((l) => l.status === "active")) {
      const exists = s.rentPayments.some(
        (p) => p.lease_id === lease.id && p.period === period,
      );
      if (exists) continue;
      const unit = s.units.find((u) => u.id === lease.unit_id);
      if (!unit) continue;
      s.rentPayments.push({
        id: id(),
        owner_id: lease.owner_id,
        lease_id: lease.id,
        property_id: unit.property_id,
        unit_id: unit.id,
        period,
        due_cents: lease.rent_cents,
        paid_cents: 0,
        status: "due",
        paid_on: null,
        notes: null,
        created_at: nowIso(),
        updated_at: nowIso(),
      });
    }
  });
}

export function demoAddTicket(
  input: Omit<MaintenanceTicket, "id" | "created_at" | "updated_at" | "owner_id">,
  ownerId: string,
) {
  const ts = nowIso();
  const row: MaintenanceTicket = { ...input, id: id(), owner_id: ownerId, created_at: ts, updated_at: ts };
  mutate((s) => {
    s.tickets.unshift(row);
    audit(s, "ticket", row.id, "create", row.title);
  });
  return row;
}

export function demoUpdateTicket(
  ticketId: string,
  patch: Partial<MaintenanceTicket>,
) {
  mutate((s) => {
    const row = s.tickets.find((t) => t.id === ticketId);
    if (!row) return;
    Object.assign(row, patch, { updated_at: nowIso() });
    audit(s, "ticket", row.id, "update", row.status);
  });
}

export function demoAddVendor(
  input: Omit<Vendor, "id" | "created_at" | "updated_at" | "owner_id">,
  ownerId: string,
) {
  const ts = nowIso();
  const row: Vendor = { ...input, id: id(), owner_id: ownerId, created_at: ts, updated_at: ts };
  mutate((s) => {
    s.vendors.push(row);
    audit(s, "vendor", row.id, "create", row.name);
  });
  return row;
}

export function demoAddCommunication(
  input: Omit<CommunicationEntry, "id" | "created_at" | "owner_id">,
  ownerId: string,
) {
  const row: CommunicationEntry = {
    ...input,
    id: id(),
    owner_id: ownerId,
    created_at: nowIso(),
  };
  mutate((s) => {
    s.communications.unshift(row);
    audit(s, "communication", row.id, "create", row.subject);
  });
  return row;
}

export function demoAddDocument(
  input: Omit<VaultDocument, "id" | "created_at" | "owner_id">,
  ownerId: string,
) {
  const row: VaultDocument = {
    ...input,
    id: id(),
    owner_id: ownerId,
    created_at: nowIso(),
  };
  mutate((s) => {
    s.documents.unshift(row);
    audit(s, "document", row.id, "create", row.title);
  });
  return row;
}

export function demoAddInspection(
  input: Omit<Inspection, "id" | "created_at" | "updated_at" | "owner_id">,
  ownerId: string,
) {
  const ts = nowIso();
  const row: Inspection = { ...input, id: id(), owner_id: ownerId, created_at: ts, updated_at: ts };
  mutate((s) => {
    s.inspections.unshift(row);
    audit(s, "inspection", row.id, "create", row.type);
  });
  return row;
}

export function demoAddRecurringBill(
  input: Omit<RecurringBill, "id" | "created_at" | "updated_at" | "owner_id">,
  ownerId: string,
) {
  const ts = nowIso();
  const row: RecurringBill = { ...input, id: id(), owner_id: ownerId, created_at: ts, updated_at: ts };
  mutate((s) => {
    s.recurringBills.push(row);
    audit(s, "recurring_bill", row.id, "create", row.name);
  });
  return row;
}

export function demoPostRecurringBill(billId: string) {
  mutate((s) => {
    const bill = s.recurringBills.find((b) => b.id === billId);
    if (!bill) return;
    s.transactions.push({
      id: id(),
      owner_id: bill.owner_id,
      property_id: bill.property_id,
      unit_id: null,
      lease_id: null,
      type: "expense",
      category: bill.category,
      amount_cents: bill.amount_cents,
      occurred_on: today(),
      description: `Recurring: ${bill.name}`,
      receipt_path: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    audit(s, "recurring_bill", bill.id, "post", bill.name);
  });
}

export function demoAddDeal(
  input: Omit<Deal, "id" | "created_at" | "updated_at" | "owner_id">,
  ownerId: string,
) {
  const ts = nowIso();
  const row: Deal = { ...input, id: id(), owner_id: ownerId, created_at: ts, updated_at: ts };
  mutate((s) => {
    s.deals.push(row);
    audit(s, "deal", row.id, "create", row.name);
  });
  return row;
}

export function demoUpdateDeal(dealId: string, patch: Partial<Deal>) {
  mutate((s) => {
    const row = s.deals.find((d) => d.id === dealId);
    if (!row) return;
    Object.assign(row, patch, { updated_at: nowIso() });
    audit(s, "deal", row.id, "update", row.stage);
  });
}

export function demoUpdateTurn(turnId: string, patch: Partial<UnitTurn>) {
  mutate((s) => {
    const row = s.turns.find((t) => t.id === turnId);
    if (!row) return;
    Object.assign(row, patch, { updated_at: nowIso() });
    if (patch.stage === "leased" || patch.stage === "listed") {
      const unit = s.units.find((u) => u.id === row.unit_id);
      if (unit && patch.stage === "listed") unit.status = "vacant";
      if (unit && patch.stage === "leased") unit.status = "occupied";
    }
    audit(s, "turn", row.id, "update", row.stage);
  });
}

export function demoToggleTurnChecklist(turnId: string, index: number) {
  mutate((s) => {
    const row = s.turns.find((t) => t.id === turnId);
    if (!row || !row.checklist[index]) return;
    row.checklist[index].done = !row.checklist[index].done;
    row.updated_at = nowIso();
  });
}

export function demoAddDepositEvent(
  input: Omit<DepositEvent, "id" | "created_at" | "owner_id">,
  ownerId: string,
) {
  const row: DepositEvent = { ...input, id: id(), owner_id: ownerId, created_at: nowIso() };
  mutate((s) => {
    s.depositEvents.unshift(row);
    audit(s, "deposit", row.id, "create", row.type);
  });
  return row;
}

export function demoAddBudget(
  input: Omit<BudgetLine, "id" | "created_at" | "updated_at" | "owner_id">,
  ownerId: string,
) {
  const ts = nowIso();
  const row: BudgetLine = { ...input, id: id(), owner_id: ownerId, created_at: ts, updated_at: ts };
  mutate((s) => {
    s.budgets.push(row);
    audit(s, "budget", row.id, "create", `${row.category} ${row.year}`);
  });
  return row;
}

export function demoAddMortgage(
  input: Omit<Mortgage, "id" | "created_at" | "updated_at" | "owner_id">,
  ownerId: string,
) {
  const ts = nowIso();
  const row: Mortgage = { ...input, id: id(), owner_id: ownerId, created_at: ts, updated_at: ts };
  mutate((s) => {
    s.mortgages.push(row);
    audit(s, "mortgage", row.id, "create", row.lender);
  });
  return row;
}
