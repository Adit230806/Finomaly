// ---------------------------------------------------------------------------
// Mock auth — NO backend, NO Supabase. Swap this file for real auth later.
// ---------------------------------------------------------------------------

export type Role = "user" | "analyst";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
}

// Hardcoded seed users
const SEED_USERS: MockUser[] = [
  { id: "seed-1", name: "Demo User",     email: "user@finomaly.com",  password: "demo123",  role: "user"     },
  { id: "seed-2", name: "Admin Analyst", email: "admin@finomaly.com", password: "admin123", role: "analyst"  },
];

const STORAGE_USERS_KEY  = "finomaly_mock_users";
const STORAGE_SESSION_KEY = "finomaly_mock_session";

// ── Persistence helpers ──────────────────────────────────────────────────────

function loadUsers(): MockUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    const saved: MockUser[] = raw ? JSON.parse(raw) : [];
    // Merge seed users (by email) so they're always available
    const merged = [...SEED_USERS];
    for (const u of saved) {
      if (!merged.find((m) => m.email === u.email)) merged.push(u);
    }
    return merged;
  } catch {
    return [...SEED_USERS];
  }
}

function saveUsers(users: MockUser[]) {
  // Only persist non-seed users to avoid bloat
  const nonSeed = users.filter((u) => !SEED_USERS.find((s) => s.id === u.id));
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(nonSeed));
}

export function getSession(): MockUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_SESSION_KEY);
    return raw ? (JSON.parse(raw) as MockUser) : null;
  } catch {
    return null;
  }
}

function persistSession(user: MockUser | null) {
  if (user) {
    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_SESSION_KEY);
  }
}

// ── Auth operations ──────────────────────────────────────────────────────────

export function mockLogin(
  email: string,
  password: string,
): { user: MockUser } | { error: string } {
  const users = loadUsers();
  const found = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
  );
  if (!found) return { error: "Invalid email or password." };
  persistSession(found);
  return { user: found };
}

export function mockRegister(
  name: string,
  email: string,
  password: string,
  role: Role,
): { user: MockUser } | { error: string } {
  const users = loadUsers();
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { error: "An account with this email already exists." };
  }
  const newUser: MockUser = {
    id: `user-${Date.now()}`,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role,
  };
  users.push(newUser);
  saveUsers(users);
  return { user: newUser };
}

export function mockLogout() {
  persistSession(null);
}
