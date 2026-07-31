import type { TransactionCategory } from "@/lib/finance";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PropertyStatus = "active" | "under_contract" | "sold" | "inactive";
export type UnitStatus = "vacant" | "occupied" | "maintenance" | "offline";
export type LeaseStatus = "draft" | "active" | "expired" | "terminated";
export type TransactionType = "income" | "expense";

export interface Property {
  id: string;
  owner_id: string;
  name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  property_type: string;
  purchase_price_cents: number | null;
  purchase_date: string | null;
  status: PropertyStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  property_id: string;
  owner_id: string;
  label: string;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  market_rent_cents: number | null;
  status: UnitStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  owner_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lease {
  id: string;
  owner_id: string;
  unit_id: string;
  tenant_id: string;
  status: LeaseStatus;
  start_date: string;
  end_date: string | null;
  rent_cents: number;
  deposit_cents: number;
  document_path: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  owner_id: string;
  property_id: string;
  unit_id: string | null;
  lease_id: string | null;
  type: TransactionType;
  category: TransactionCategory | string;
  amount_cents: number;
  occurred_on: string;
  description: string | null;
  receipt_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyWithUnits extends Property {
  units?: Unit[];
}

export interface LeaseWithRelations extends Lease {
  unit?: Unit | null;
  tenant?: Tenant | null;
}

export interface TransactionWithProperty extends Transaction {
  property?: Pick<Property, "id" | "name"> | null;
}

export type Database = {
  public: {
    Tables: {
      properties: {
        Row: Property;
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          address_line1: string;
          address_line2?: string | null;
          city: string;
          state: string;
          postal_code: string;
          country?: string;
          property_type?: string;
          purchase_price_cents?: number | null;
          purchase_date?: string | null;
          status?: PropertyStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Property>;
        Relationships: [];
      };
      units: {
        Row: Unit;
        Insert: {
          id?: string;
          property_id: string;
          owner_id: string;
          label: string;
          beds?: number | null;
          baths?: number | null;
          sqft?: number | null;
          market_rent_cents?: number | null;
          status?: UnitStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Unit>;
        Relationships: [];
      };
      tenants: {
        Row: Tenant;
        Insert: {
          id?: string;
          owner_id: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Tenant>;
        Relationships: [];
      };
      leases: {
        Row: Lease;
        Insert: {
          id?: string;
          owner_id: string;
          unit_id: string;
          tenant_id: string;
          status?: LeaseStatus;
          start_date: string;
          end_date?: string | null;
          rent_cents: number;
          deposit_cents?: number;
          document_path?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Lease>;
        Relationships: [];
      };
      transactions: {
        Row: Transaction;
        Insert: {
          id?: string;
          owner_id: string;
          property_id: string;
          unit_id?: string | null;
          lease_id?: string | null;
          type: TransactionType;
          category: string;
          amount_cents: number;
          occurred_on?: string;
          description?: string | null;
          receipt_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Transaction>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};


export const TRANSACTION_CATEGORY_LABELS: Record<string, string> = {
  rent: "Rent",
  fees: "Fees",
  other_income: "Other Income",
  security_deposit: "Security Deposit",
  opex: "Operating Expense",
  maintenance: "Maintenance",
  utilities: "Utilities",
  insurance: "Insurance",
  property_tax: "Property Tax",
  management: "Management",
  capex: "CapEx",
  mortgage: "Mortgage",
  debt_service: "Debt Service",
  other_expense: "Other Expense",
};
