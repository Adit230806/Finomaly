/** Session keys used for post-login routing — must be cleared on logout. */
export const LOGIN_DEST_KEY = "login_dest";
export const DASHBOARD_MODE_KEY = "finomaly_dashboard_mode";

export type LoginDest = "/user-dashboard" | "/admin-dashboard";

export function setLoginDest(dest: LoginDest): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(LOGIN_DEST_KEY, dest);
}

/** Read and remove login_dest (one-time use after login). */
export function consumeLoginDest(): LoginDest | null {
  if (typeof sessionStorage === "undefined") return null;
  const value = sessionStorage.getItem(LOGIN_DEST_KEY);
  sessionStorage.removeItem(LOGIN_DEST_KEY);
  if (value === "/user-dashboard" || value === "/admin-dashboard") return value;
  return null;
}

/** Clear all redirect hints so logout cannot reopen a dashboard. */
export function clearAuthRedirectState(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(LOGIN_DEST_KEY);
  sessionStorage.removeItem(DASHBOARD_MODE_KEY);
}
