import { DASHBOARD_MODE_KEY } from "@/lib/auth-redirect";

/** Session UI mode — chosen at login (User vs Admin toggle), not DB role. */
export type DashboardMode = "user" | "admin";

export function getDashboardMode(): DashboardMode {
  if (typeof sessionStorage === "undefined") return "user";
  return sessionStorage.getItem(DASHBOARD_MODE_KEY) === "admin" ? "admin" : "user";
}

export function setDashboardModeStorage(mode: DashboardMode): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(DASHBOARD_MODE_KEY, mode);
}

export function clearDashboardModeStorage(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(DASHBOARD_MODE_KEY);
}

export function defaultPathForMode(mode: DashboardMode): "/user-dashboard" | "/admin-dashboard" {
  return mode === "admin" ? "/admin-dashboard" : "/user-dashboard";
}
