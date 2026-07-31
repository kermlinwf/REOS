import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";

const steps = [
  "Create a Supabase project and enable Email auth.",
  "Run supabase/migrations/001_schema.sql in the SQL Editor.",
  "Create private Storage buckets: receipts and leases; apply the storage policies in the migration comments.",
  "Copy .env.example to .env.local and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  "For GitHub Pages project sites, set VITE_BASE_PATH=/YOUR_REPO_NAME/ when building.",
];

export function SetupPage() {
  const { enterDemo, isDemo, user } = useAuth();
  const navigate = useNavigate();

  if (user || isDemo) {
    return <Navigate to="/" replace />;
  }

  function startDemo() {
    enterDemo();
    navigate("/", { replace: true });
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-4 px-4 py-8 safe-top safe-bottom">
      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: "var(--font-display)" }}>
            Connect Supabase
          </CardTitle>
          <CardDescription>
            REOS is a static SPA. All auth, data, and file storage go through
            the Supabase client; security is enforced with RLS.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`rounded-md px-3 py-2 text-sm ${
              isSupabaseConfigured
                ? "bg-emerald-50 text-emerald-900"
                : "bg-amber-50 text-amber-900"
            }`}
          >
            {isSupabaseConfigured
              ? "Environment variables detected — you can sign in."
              : "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing or still placeholders."}
          </div>
          <Button type="button" variant="accent" className="w-full" onClick={startDemo}>
            Continue in demo mode
          </Button>
          <p className="text-center text-xs text-[var(--color-muted-foreground)]">
            Local mode starts empty — add your own properties, leases, and ledger.
          </p>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--color-muted-foreground)]">
            {steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            {isSupabaseConfigured ? (
              <Button asChild>
                <Link to="/login">Go to login</Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link to="/login">Login screen</Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
              >
                Open Supabase
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
