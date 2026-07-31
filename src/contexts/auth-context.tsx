import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  DEMO_USER_EMAIL,
  DEMO_USER_ID,
  enterDemoSession,
  exitDemoSession,
  isDemoSessionActive,
  isSoloMode,
} from "@/lib/demo";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  isDemo: boolean;
  isSolo: boolean;
  enterDemo: () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

function makeSoloUser(): User {
  return {
    id: DEMO_USER_ID,
    email: DEMO_USER_EMAIL,
    app_metadata: { provider: "solo" },
    user_metadata: { full_name: "Solo Operator" },
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as User;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const solo = isSoloMode();
  const [user, setUser] = React.useState<User | null>(solo ? makeSoloUser() : null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [isDemo, setIsDemo] = React.useState(solo || isDemoSessionActive());
  const [loading, setLoading] = React.useState(!solo);

  React.useEffect(() => {
    if (solo) {
      enterDemoSession();
      setIsDemo(true);
      setUser(makeSoloUser());
      setSession(null);
      setLoading(false);
      return;
    }

    if (isDemoSessionActive()) {
      enterDemoSession();
      setIsDemo(true);
      setUser(makeSoloUser());
      setSession(null);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setUser(next?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [solo]);

  const enterDemo = React.useCallback(() => {
    enterDemoSession();
    setIsDemo(true);
    setUser(makeSoloUser());
    setSession(null);
  }, []);

  const signIn = React.useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured." };
    }
    const { error } = await getSupabase().auth.signInWithPassword({
      email,
      password,
    });
    return { error: error?.message ?? null };
  }, []);

  const signUp = React.useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured." };
    }
    const { error } = await getSupabase().auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signOut = React.useCallback(async () => {
    if (solo) {
      // Solo mode has no login — stay signed in as local operator.
      return;
    }
    if (isDemo) {
      exitDemoSession();
      setIsDemo(false);
      setUser(null);
      setSession(null);
      return;
    }
    if (isSupabaseConfigured) {
      await getSupabase().auth.signOut();
    }
  }, [isDemo, solo]);

  const value = React.useMemo(
    () => ({
      user,
      session,
      loading,
      configured: isSupabaseConfigured,
      isDemo,
      isSolo: solo,
      enterDemo,
      signIn,
      signUp,
      signOut,
    }),
    [user, session, loading, isDemo, solo, enterDemo, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
