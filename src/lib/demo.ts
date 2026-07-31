const DEMO_FLAG_KEY = "reos_demo_mode";

/**
 * Solo / single-operator mode (default): no login gate.
 * Set VITE_REQUIRE_AUTH=true later if you want Supabase email auth.
 */
export function isSoloMode(): boolean {
  return import.meta.env.VITE_REQUIRE_AUTH !== "true";
}

export function isDemoModeEnv(): boolean {
  return import.meta.env.VITE_DEMO_MODE === "true";
}

export function isDemoSessionActive(): boolean {
  if (isSoloMode()) return true;
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(DEMO_FLAG_KEY) === "1" || isDemoModeEnv();
}

export function enterDemoSession(): void {
  sessionStorage.setItem(DEMO_FLAG_KEY, "1");
}

export function exitDemoSession(): void {
  sessionStorage.removeItem(DEMO_FLAG_KEY);
}

export const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";
export const DEMO_USER_EMAIL = "solo@reos.local";
