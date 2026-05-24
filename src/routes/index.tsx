import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { consumeLoginDest } from "@/lib/auth-redirect";
import { defaultPathForMode } from "@/lib/dashboard-mode";

export const Route = createFileRoute("/")({ component: HomeRedirect });

function HomeRedirect() {
  const { isAuthenticated, loading, isLoggingOut, dashboardMode } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (loading || isLoggingOut) return;

    if (!isAuthenticated) {
      nav({ to: "/login", replace: true, search: {} });
      return;
    }

    const storedDest = consumeLoginDest();
    if (storedDest) {
      nav({ to: storedDest, replace: true });
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
