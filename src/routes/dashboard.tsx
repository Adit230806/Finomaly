import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { defaultPathForMode } from "@/lib/dashboard-mode";

/** Legacy /dashboard → role-based dashboard (client-only; session is in localStorage) */
export const Route = createFileRoute("/dashboard")({ component: DashboardRedirect });

function DashboardRedirect() {
  const { isAuthenticated, loading, isLoggingOut, dashboardMode } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (loading || isLoggingOut) return;
    if (!isAuthenticated) {
      nav({ to: "/login", replace: true, search: {} });
      return;
    }
    nav({ to: defaultPathForMode(dashboardMode), replace: true });
  }, [loading, isLoggingOut, isAuthenticated, dashboardMode, nav]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0EFEA]">
      <LoadingSpinner size={48} />
    </div>
  );
}
