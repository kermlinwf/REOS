import * as React from "react";
import { getSupabase } from "@/lib/supabase";
import { isDemoSessionActive } from "@/lib/demo";
import {
  demoCreateLease,
  demoCreateProperty,
  demoCreateTenant,
  demoCreateTransaction,
  demoCreateUnit,
  demoListLeases,
  demoListProperties,
  demoListTenants,
  demoListTransactions,
  demoListUnits,
  demoUploadPath,
} from "@/lib/demo-store";
import type {
  Lease,
  LeaseWithRelations,
  Property,
  Tenant,
  Transaction,
  TransactionWithProperty,
  Unit,
} from "@/types/database";

interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

function useAsyncList<T>(
  fetcher: () => Promise<T>,
  initial: T,
): AsyncState<T> {
  const [data, setData] = React.useState<T>(initial);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [tick, setTick] = React.useState(0);
  const hasLoaded = React.useRef(false);

  React.useEffect(() => {
    let cancelled = false;
    // Only show skeletons on the first fetch — refreshes update quietly.
    if (!hasLoaded.current) setLoading(true);
    setError(null);
    fetcher()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          hasLoaded.current = true;
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fetcher, tick]);

  React.useEffect(() => {
    if (!isDemoSessionActive()) return;
    const bump = () => setTick((t) => t + 1);
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith("reos_demo_store")) bump();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("reos-store-changed", bump);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("reos-store-changed", bump);
    };
  }, []);

  return {
    data,
    loading,
    error,
    reload: () => setTick((t) => t + 1),
  };
}

export function useProperties() {
  const fetcher = React.useCallback(async () => {
    if (isDemoSessionActive()) return demoListProperties();
    const { data, error } = await getSupabase()
      .from("properties")
      .select("*")
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []) as Property[];
  }, []);
  return useAsyncList(fetcher, [] as Property[]);
}

export function useUnits(propertyId?: string) {
  const fetcher = React.useCallback(async () => {
    if (isDemoSessionActive()) return demoListUnits(propertyId);
    let q = getSupabase().from("units").select("*").order("label");
    if (propertyId) q = q.eq("property_id", propertyId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as Unit[];
  }, [propertyId]);
  return useAsyncList(fetcher, [] as Unit[]);
}

export function useTenants() {
  const fetcher = React.useCallback(async () => {
    if (isDemoSessionActive()) return demoListTenants();
    const { data, error } = await getSupabase()
      .from("tenants")
      .select("*")
      .order("full_name");
    if (error) throw new Error(error.message);
    return (data ?? []) as Tenant[];
  }, []);
  return useAsyncList(fetcher, [] as Tenant[]);
}

export function useLeases() {
  const fetcher = React.useCallback(async () => {
    if (isDemoSessionActive()) return demoListLeases();
    const { data, error } = await getSupabase()
      .from("leases")
      .select("*, unit:units(*), tenant:tenants(*)")
      .order("start_date", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as LeaseWithRelations[];
  }, []);
  return useAsyncList(fetcher, [] as LeaseWithRelations[]);
}

export function useTransactions(propertyId?: string) {
  const fetcher = React.useCallback(async () => {
    if (isDemoSessionActive()) return demoListTransactions(propertyId);
    let q = getSupabase()
      .from("transactions")
      .select("*, property:properties(id, name)")
      .order("occurred_on", { ascending: false });
    if (propertyId) q = q.eq("property_id", propertyId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as TransactionWithProperty[];
  }, [propertyId]);
  return useAsyncList(fetcher, [] as TransactionWithProperty[]);
}

export async function createProperty(
  input: Omit<Property, "id" | "created_at" | "updated_at" | "owner_id">,
  ownerId: string,
) {
  if (isDemoSessionActive()) return demoCreateProperty(input, ownerId);
  const { data, error } = await getSupabase()
    .from("properties")
    .insert({ ...input, owner_id: ownerId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Property;
}

export async function createUnit(
  input: Omit<Unit, "id" | "created_at" | "updated_at" | "owner_id">,
  ownerId: string,
) {
  if (isDemoSessionActive()) return demoCreateUnit(input, ownerId);
  const { data, error } = await getSupabase()
    .from("units")
    .insert({ ...input, owner_id: ownerId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Unit;
}

export async function createTenant(
  input: Omit<Tenant, "id" | "created_at" | "updated_at" | "owner_id">,
  ownerId: string,
) {
  if (isDemoSessionActive()) return demoCreateTenant(input, ownerId);
  const { data, error } = await getSupabase()
    .from("tenants")
    .insert({ ...input, owner_id: ownerId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Tenant;
}

export async function createLease(
  input: Omit<Lease, "id" | "created_at" | "updated_at" | "owner_id">,
  ownerId: string,
) {
  if (isDemoSessionActive()) return demoCreateLease(input, ownerId);
  const { data, error } = await getSupabase()
    .from("leases")
    .insert({ ...input, owner_id: ownerId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Lease;
}

export async function createTransaction(
  input: Omit<Transaction, "id" | "created_at" | "updated_at" | "owner_id">,
  ownerId: string,
) {
  if (isDemoSessionActive()) return demoCreateTransaction(input, ownerId);
  const { data, error } = await getSupabase()
    .from("transactions")
    .insert({ ...input, owner_id: ownerId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Transaction;
}

export async function uploadReceipt(
  ownerId: string,
  file: File,
): Promise<string> {
  if (isDemoSessionActive()) return demoUploadPath(ownerId, file);
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${ownerId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await getSupabase()
    .storage.from("receipts")
    .upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

export async function uploadLeaseDocument(
  ownerId: string,
  file: File,
): Promise<string> {
  if (isDemoSessionActive()) return demoUploadPath(ownerId, file);
  const ext = file.name.split(".").pop() ?? "pdf";
  const path = `${ownerId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await getSupabase()
    .storage.from("leases")
    .upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  return path;
}
