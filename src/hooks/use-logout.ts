import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";

/** Single logout entry point — clears session then navigates to login only. */
export function useLogout() {
  const { logout } = useAuth();
  const nav = useNavigate();

  return useCallback(async () => {
    await logout();
    nav({ to: "/login", replace: true, search: {} });
  }, [logout, nav]);
}
