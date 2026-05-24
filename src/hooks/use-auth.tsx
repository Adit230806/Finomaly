import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  authSignIn,
  authSignOut,
  authSignUp,
  type Role,
} from "@/services/authService";
import {
  type DashboardMode,
  getDashboardMode,
  setDashboardModeStorage,
} from "@/lib/dashboard-mode";
import { clearAuthRedirectState } from "@/lib/auth-redirect";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthCtx {
  currentUser: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  isLoggingOut: boolean;
  dashboardMode: DashboardMode;
  setDashboardMode: (mode: DashboardMode) => void;
  login: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string, role: Role) => Promise<string | null>;
  logout: () => Promise<void>;
  user: AuthUser | null;
  role: Role | null;
  signOut: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const Ctx = createContext<AuthCtx>({
  currentUser: null,
  session: null,
  isAuthenticated: false,
  loading: true,
  isLoggingOut: false,
  dashboardMode: "user",
  setDashboardMode: () => {},
  login: async () => "Not initialised",
  register: async () => "Not initialised",
  logout: async () => {},
  user: null,
  role: null,
  signOut: async () => {},
});

function toAuthUser(user: User): AuthUser {
  const rawRole = user.user_metadata?.role as string | undefined;
  const role: Role = rawRole === "admin" || rawRole === "analyst" ? "admin" : "user";
  return {
    id:    user.id,
    name:  (user.user_metadata?.name as string) ?? user.email ?? "User",
    email: user.email ?? "",
    role,
  };
}

function clearClientAuthState(
  setSession: (s: Session | null) => void,
  setCurrentUser: (u: AuthUser | null) => void,
) {
  clearAuthRedirectState();
  setSession(null);
  setCurrentUser(null);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dashboardMode, setDashboardModeState] = useState<DashboardMode>(() => getDashboardMode());
  const isLoggingOutRef = useRef(false);

  const setDashboardMode = (mode: DashboardMode) => {
    setDashboardModeState(mode);
    setDashboardModeStorage(mode);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (isLoggingOutRef.current) {
        setLoading(false);
        return;
      }
      setSession(data.session);
      setCurrentUser(data.session?.user ? toAuthUser(data.session.user) : null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === "SIGNED_OUT" || !newSession) {
        clearClientAuthState(setSession, setCurrentUser);
        setDashboardModeState("user");
        setLoading(false);
        setIsLoggingOut(false);
        isLoggingOutRef.current = false;
        return;
      }

      if (isLoggingOutRef.current) return;

      setSession(newSession);
      setCurrentUser(toAuthUser(newSession.user));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<string | null> => {
    const err = await authSignIn(email, password);
    if (err) return err;

    const { data: { session: newSession } } = await supabase.auth.getSession();
    if (newSession?.user) {
      setSession(newSession);
      setCurrentUser(toAuthUser(newSession.user));
      setLoading(false);
    }
    return null;
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: Role,
  ): Promise<string | null> => authSignUp(name, email, password, role);

  const logout = async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    setIsLoggingOut(true);

    // Clear session first — prevents AdminRoute from sending admin → user-dashboard
    clearClientAuthState(setSession, setCurrentUser);

    try {
      await authSignOut();
    } catch (e) {
      console.error(e);
    } finally {
      setDashboardModeState("user");
      setIsLoggingOut(false);
      isLoggingOutRef.current = false;
    }
  };

  return (
    <Ctx.Provider
      value={{
        currentUser,
        session,
        isAuthenticated: !!currentUser && !isLoggingOut,
        loading,
        isLoggingOut,
        dashboardMode,
        setDashboardMode,
        login,
        register,
        logout,
        user: currentUser,
        role: currentUser?.role ?? null,
        signOut: logout,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
