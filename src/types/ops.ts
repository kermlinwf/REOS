/** Extended ops types for solo REOS (local-first). */

export type TicketStatus = "open" | "in_progress" | "waiting" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";
export type TurnStage =
  | "occupied"
  | "notice"
  | "vacant"
  | "make_ready"
  | "listed"
  | "leased";
export type InspectionType = "move_in" | "move_out" | "periodic" | "other";
export type CommChannel = "call" | "text" | "email" | "in_person" | "note";
export type DocumentKind =
  | "lease"
  | "insurance"
  | "warranty"
  | "w9"
  | "photo"
  | "inspection"
  | "other";
export type DealStage =
  | "lead"
  | "underwriting"
  | "offer"
  | "under_contract"
  | "closed"
  | "dead";
export type RentPaymentStatus = "due" | "partial" | "paid" | "late" | "waived";
export type DepositEventType =
  | "collected"
  | "held"
  | "partial_return"
  | "returned"
  | "applied_to_damages";

export interface Mortgage {
  id: string;
  owner_id: string;
  property_id: string;
  lender: string;
  balance_cents: number;
  rate_bps: number; // 625 = 6.25%
  payment_cents: number;
  next_payment_on: string;
  escrow_balance_cents: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: string;
  owner_id: string;
  name: string;
  trade: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceTicket {
  id: string;
  owner_id: string;
  property_id: string;
  unit_id: string | null;
  vendor_id: string | null;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  cost_cents: number | null;
  opened_on: string;
  closed_on: string | null;
  created_at: string;
  updated_at: string;
}

export interface Inspection {
  id: string;
  owner_id: string;
  property_id: string;
  unit_id: string | null;
  lease_id: string | null;
  type: InspectionType;
  inspected_on: string;
  summary: string | null;
  checklist: { item: string; ok: boolean; note?: string }[];
  photo_paths: string[];
  created_at: string;
  updated_at: string;
}

export interface CommunicationEntry {
  id: string;
  owner_id: string;
  property_id: string | null;
  unit_id: string | null;
  tenant_id: string | null;
  channel: CommChannel;
  subject: string;
  body: string;
  occurred_at: string;
  created_at: string;
}

export interface RecurringBill {
  id: string;
  owner_id: string;
  property_id: string;
  name: string;
  category: string;
  amount_cents: number;
  day_of_month: number;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VaultDocument {
  id: string;
  owner_id: string;
  property_id: string | null;
  unit_id: string | null;
  lease_id: string | null;
  kind: DocumentKind;
  title: string;
  path: string;
  notes: string | null;
  created_at: string;
}

export interface BudgetLine {
  id: string;
  owner_id: string;
  property_id: string;
  year: number;
  category: string;
  kind: "opex" | "capex";
  amount_cents: number;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  asking_price_cents: number | null;
  offer_price_cents: number | null;
  estimated_noi_cents: number | null;
  estimated_rent_cents: number | null;
  stage: DealStage;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RentPayment {
  id: string;
  owner_id: string;
  lease_id: string;
  property_id: string;
  unit_id: string;
  period: string; // YYYY-MM
  due_cents: number;
  paid_cents: number;
  status: RentPaymentStatus;
  paid_on: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DepositEvent {
  id: string;
  owner_id: string;
  lease_id: string;
  property_id: string;
  type: DepositEventType;
  amount_cents: number;
  occurred_on: string;
  notes: string | null;
  created_at: string;
}

export interface AuditEntry {
  id: string;
  owner_id: string;
  entity: string;
  entity_id: string;
  action: string;
  detail: string;
  created_at: string;
}

export interface UnitTurn {
  id: string;
  owner_id: string;
  unit_id: string;
  property_id: string;
  stage: TurnStage;
  vacant_on: string | null;
  listed_on: string | null;
  target_rent_cents: number | null;
  checklist: { item: string; done: boolean }[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}
