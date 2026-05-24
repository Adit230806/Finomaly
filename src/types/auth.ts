export type AppRole = "user" | "admin" | "analyst";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: AppRole;
}
