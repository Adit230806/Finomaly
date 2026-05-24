import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface Props {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, loading, isLoggingOut } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (loading || isLoggingOut) return;
    if (!isAuthenticated) {
      nav({ to: "/login", replace: true, search: {} });
    }
  }, [loading, isLoggingOut, isAuthenticated, nav]);

  if (loading || isLoggingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0EFEA]">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
