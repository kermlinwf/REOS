import { ErrorBoundary } from "@/components/error-boundary";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

export function ProtectedRoute() {
  const { user, loading, configured, isDemo, isSolo } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-3 p-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isSolo || user || isDemo) {
    return (
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    );
  }

  if (!configured) {
    return <Navigate to="/setup" replace />;
  }

  return <Navigate to="/login" replace state={{ from: location }} />;
}
