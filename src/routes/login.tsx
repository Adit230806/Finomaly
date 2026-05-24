import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Eye, EyeOff, ShieldCheck, User, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { authSignInWithGitHub } from "@/services/authService";
import { setLoginDest } from "@/lib/auth-redirect";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    registered: s.registered === "true" ? ("true" as const) : undefined,
  }),
  component: Login,
});

// ── Icons ────────────────────────────────────────────────────────────────────

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.216.69.825.572C20.565 21.795 24 17.298 24 12c0-6.63-5.37-12-12-12Z"/>
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

function Login() {
  const { isAuthenticated, isLoggingOut, login, setDashboardMode } = useAuth();
  const nav    = useNavigate();
  const search = useSearch({ from: "/login" });

  type Dest = "/user-dashboard" | "/admin-dashboard";
  const [dest,       setDest]       = useState<Dest>("/user-dashboard");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [error,      setError]      = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || isLoggingOut) return;
    const mode = dest === "/admin-dashboard" ? "admin" : "user";
    setDashboardMode(mode);
    nav({ to: dest, replace: true });
  }, [isAuthenticated, isLoggingOut, nav, dest, setDashboardMode]);

  useEffect(() => {
    if (search.registered === "true") toast.success("Account created! Sign in to continue.");
  }, [search.registered]);

  const handleGitHub = async () => {
    const err = await authSignInWithGitHub();
    if (err) toast.error(err);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const err = await login(email, password);
    setSubmitting(false);
    if (err) { setError(err); return; }
    const mode = dest === "/admin-dashboard" ? "admin" : "user";
    setDashboardMode(mode);
    setLoginDest(dest);
    nav({ to: dest, replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: "#F0EFEA" }}>
      <div className="w-full max-w-[480px]">
        <div className="bg-white rounded-[20px] px-10 py-10" style={{ boxShadow: "0 4px 40px rgba(0,0,0,0.08)" }}>

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-11 w-11 rounded-full bg-[#00C853] flex items-center justify-center mb-3">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Finomaly</span>
          </div>

          {/* Heading */}
          <h1 className="text-[28px] font-bold text-center mb-1">Welcome back</h1>
          <p className="text-sm text-[#888] text-center mb-6">Sign in to your account</p>

          {/* Dashboard destination selector */}
          <div className="flex rounded-xl border border-[#E0DED8] overflow-hidden mb-6">
            <button
              type="button"
              onClick={() => setDest("/user-dashboard")}
              className="flex-1 flex items-center justify-center gap-2 h-11 text-sm font-medium transition-colors"
              style={{
                backgroundColor: dest === "/user-dashboard" ? "#00C853" : "white",
                color:           dest === "/user-dashboard" ? "white"    : "#555",
              }}
            >
              <User size={15} /> User
            </button>
            <button
              type="button"
              onClick={() => setDest("/admin-dashboard")}
              className="flex-1 flex items-center justify-center gap-2 h-11 text-sm font-medium transition-colors border-l border-[#E0DED8]"
              style={{
                backgroundColor: dest === "/admin-dashboard" ? "#1a1a1a" : "white",
                color:           dest === "/admin-dashboard" ? "white"   : "#555",
              }}
            >
              <Shield size={15} /> Admin
            </button>
          </div>

          {/* GitHub */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGitHub}
              className="flex items-center justify-center gap-3 w-full h-12 rounded-xl border border-[#E0DED8] bg-white font-medium text-sm text-[#1a1a1a] transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8F7F4")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
            >
              <GitHubIcon /> Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#E0DED8]" />
            <span className="text-xs text-[#aaa]">or</span>
            <div className="flex-1 h-px bg-[#E0DED8]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-[#333] mb-1.5">Email</label>
              <input
                type="email" required autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-12 rounded-xl border border-[#E0DED8] px-4 text-sm outline-none transition-colors"
                onFocus={(e) => (e.currentTarget.style.borderColor = "#00C853")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = "#E0DED8")}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-[#333]">Password</label>
                <Link to="/forgot-password" className="text-xs text-[#888] hover:text-[#00C853] transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} required autoComplete="current-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 rounded-xl border border-[#E0DED8] px-4 pr-12 text-sm outline-none transition-colors"
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#00C853")}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = "#E0DED8")}
                />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#555] transition-colors" tabIndex={-1}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 -mt-1">{error}</p>}

            <button
              type="submit" disabled={submitting}
              className="w-full h-12 rounded-xl text-white font-semibold text-sm transition-colors disabled:opacity-60"
              style={{ backgroundColor: dest === "/admin-dashboard" ? "#1a1a1a" : "#00C853" }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = dest === "/admin-dashboard" ? "#333" : "#00B347"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = dest === "/admin-dashboard" ? "#1a1a1a" : "#00C853"; }}
            >
              {submitting ? "Signing in…" : dest === "/admin-dashboard" ? "Sign In as Admin" : "Sign In as User"}
            </button>
          </form>

          <p className="text-sm text-[#888] text-center mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-[#1a1a1a] font-medium hover:text-[#00C853] transition-colors">
              Sign up →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
