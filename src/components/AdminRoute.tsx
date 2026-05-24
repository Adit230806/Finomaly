import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { defaultPathForMode } from "@/lib/dashboard-mode";

interface Props {
  children: React.ReactNode;
}

export function AdminRoute({ children }: Props) {
  const { dashboardMode, loading, isAuthenticated, isLoggingOut } = useAuth();
  const nav = useNavigate();
  const isAdminView = dashboardMode === "admin";

  useEffect(() => {
    if (loading || isLoggingOut || !isAuthenticated) return;
    if (!isAdminView) {
      nav({ to: defaultPathForMode("user"), replace: true });
    }
  }, [loading, isLoggingOut, isAuthenticated, isAdminView, nav]);

  if (isLoggingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0EFEA]">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      {!loading && isAdminView ? children : null}
    </ProtectedRoute>
  );
}
