import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { authSignInWithGitHub } from "@/services/authService";
import { toast } from "sonner";
import type { Role } from "@/services/authService";

export const Route = createFileRoute("/register")({ component: Register });

// ── Social icons (same as login) ─────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.216.69.825.572C20.565 21.795 24 17.298 24 12c0-6.63-5.37-12-12-12Z"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
      <rect x="1"  y="1"  width="9" height="9" fill="#F25022"/>
      <rect x="11" y="1"  width="9" height="9" fill="#7FBA00"/>
      <rect x="1"  y="11" width="9" height="9" fill="#00A4EF"/>
      <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
    </svg>
  );
}

// ── Password strength ─────────────────────────────────────────────────────────

function passwordStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length === 0)  return { label: "",        color: "#E0DED8", width: "0%"   };
  if (pw.length < 6)   return { label: "Weak",     color: "#EF4444", width: "33%"  };
  if (pw.length < 10)  return { label: "Medium",   color: "#F59E0B", width: "66%"  };
  return                      { label: "Strong",   color: "#00C853", width: "100%" };
}

// ── Component ─────────────────────────────────────────────────────────────────

function Register() {
  const { isAuthenticated, register } = useAuth();
  const nav = useNavigate();

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [showPw,   setShowPw]   = useState(false);
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Already logged in → go to dashboard
  useEffect(() => {
    if (isAuthenticated) nav({ to: "/user-dashboard", replace: true });
  }, [isAuthenticated, nav]);

  const strength = passwordStrength(password);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim())                          e.name     = "Name is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address.";
    if (password.length < 6)                   e.password = "Password must be at least 6 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleGitHub = async () => {
    const err = await authSignInWithGitHub();
    if (err) toast.error(err);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const err = await register(name, email, password, role);
    setSubmitting(false);
    if (err) {
      setErrors({ form: err });
      return;
    }
    nav({ to: "/login", search: { registered: "true" } });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12"
      style={{ backgroundColor: "#F0EFEA" }}
    >
      <div className="w-full max-w-md">
        <div
          className="bg-white rounded-[20px] px-6 py-8 sm:px-10 sm:py-10"
          style={{ boxShadow: "0 4px 40px rgba(0,0,0,0.08)" }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-11 w-11 rounded-full bg-[#00C853] flex items-center justify-center mb-3">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Finomaly</span>
          </div>

          {/* Heading */}
          <h1 className="text-[28px] font-bold text-center mb-1">Create your account</h1>
          <p className="text-sm text-[#888] text-center mb-8">Start detecting anomalies in seconds</p>

          {/* GitHub button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGitHub}
              className="flex items-center justify-center gap-3 w-full h-12 rounded-xl border border-[#E0DED8] bg-white font-medium text-sm text-[#1a1a1a] transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8F7F4")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
            >
              <GitHubIcon />
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#E0DED8]" />
            <span className="text-xs text-[#aaa]">or</span>
            <div className="flex-1 h-px bg-[#E0DED8]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[#333] mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full h-12 rounded-xl border px-4 text-sm outline-none transition-colors"
                style={{ borderColor: errors.name ? "#EF4444" : "#E0DED8" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = errors.name ? "#EF4444" : "#00C853")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = errors.name ? "#EF4444" : "#E0DED8")}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#333] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-12 rounded-xl border px-4 text-sm outline-none transition-colors"
                style={{ borderColor: errors.email ? "#EF4444" : "#E0DED8" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = errors.email ? "#EF4444" : "#00C853")}
                onBlur={(e)  => (e.currentTarget.style.borderColor = errors.email ? "#EF4444" : "#E0DED8")}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#333] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full h-12 rounded-xl border px-4 pr-12 text-sm outline-none transition-colors"
                  style={{ borderColor: errors.password ? "#EF4444" : "#E0DED8" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = errors.password ? "#EF4444" : "#00C853")}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = errors.password ? "#EF4444" : "#E0DED8")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#555] transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Strength bar */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 w-full rounded-full bg-[#E0DED8] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: strength.width, backgroundColor: strength.color }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: strength.color }}>
                    {strength.label}
                  </p>
                </div>
              )}
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#333] mb-1.5">Account Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(["user", "admin"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className="h-12 rounded-xl border text-sm font-medium transition-colors"
                    style={
                      role === r
                        ? { backgroundColor: "#1a1a1a", color: "white", borderColor: "#1a1a1a" }
                        : { backgroundColor: "white",   color: "#333",  borderColor: "#E0DED8" }
                    }
                  >
                    {r === "user" ? "Personal User" : "Admin"}
                  </button>
                ))}
              </div>
            </div>

            {/* Form-level error */}
            {errors.form && (
              <p className="text-sm text-red-500 -mt-1">{errors.form}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl text-white font-semibold text-sm transition-colors disabled:opacity-60"
              style={{ backgroundColor: "#00C853" }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = "#00B347"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#00C853"; }}
            >
              {submitting ? "Creating account…" : "Create Account"}
            </button>
          </form>

          {/* Footer */}
          <p className="text-sm text-[#888] text-center mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-[#1a1a1a] font-medium hover:text-[#00C853] transition-colors">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
