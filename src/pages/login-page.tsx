import * as React from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

export function LoginPage() {
  const { signIn, signUp, user, configured, enterDemo, isDemo } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? "/";

  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  if (user || isDemo) return <Navigate to={from} replace />;

  function startDemo() {
    enterDemo();
    navigate("/", { replace: true });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) {
      toast({
        title: "Supabase not configured",
        description: "Use demo mode, or add real keys to .env.local.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    const result =
      mode === "signin"
        ? await signIn(email, password)
        : await signUp(email, password);
    setSubmitting(false);
    if (result.error) {
      toast({ title: "Auth error", description: result.error, variant: "destructive" });
      return;
    }
    if (mode === "signup") {
      toast({
        title: "Check your email",
        description: "Confirm your address if required, then sign in.",
        variant: "success",
      });
      setMode("signin");
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-8 safe-top safe-bottom safe-x">
      <Card className="w-full max-w-md">
        <CardHeader>
          <p
            className="text-2xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            REOS
          </p>
          <CardTitle className="text-lg">
            {mode === "signin" ? "Sign in" : "Create account"}
          </CardTitle>
          <CardDescription>
            Asset management for owners who track every dollar in cents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting || !configured}>
              {submitting
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in"
                  : "Sign up"}
            </Button>
          </form>
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[var(--color-border)]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-[var(--color-muted-foreground)]">
                or
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="accent"
            className="w-full"
            onClick={startDemo}
          >
            Continue in demo mode
          </Button>
          <p className="mt-2 text-center text-xs text-[var(--color-muted-foreground)]">
            Local mode stores your portfolio in this browser only.
          </p>
          <p className="mt-4 text-center text-sm text-[var(--color-muted-foreground)]">
            {mode === "signin" ? (
              <>
                No account?{" "}
                <button
                  type="button"
                  className="font-medium text-[var(--color-primary)] underline"
                  onClick={() => setMode("signup")}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Have an account?{" "}
                <button
                  type="button"
                  className="font-medium text-[var(--color-primary)] underline"
                  onClick={() => setMode("signin")}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
          <p className="mt-3 text-center text-xs text-[var(--color-muted-foreground)]">
            <Link to="/setup" className="underline">
              Setup guide
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
