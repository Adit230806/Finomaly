import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { authResetPassword } from "@/services/authService";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPassword });

function ForgotPassword() {
  const [email,   setEmail]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const err = await authResetPassword(email);
    setSubmitting(false);
    if (err) {
      toast.error(err);
      return;
    }
    setSent(true);
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

          {!sent ? (
            <>
              <h1 className="text-[28px] font-bold text-center mb-1">Reset your password</h1>
              <p className="text-sm text-[#888] text-center mb-8">
                Enter your email and we'll send you a reset link
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#333] mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-12 rounded-xl border border-[#E0DED8] px-4 text-sm outline-none transition-colors"
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#00C853")}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = "#E0DED8")}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 rounded-xl text-white font-semibold text-sm transition-colors disabled:opacity-60"
                  style={{ backgroundColor: "#00C853" }}
                  onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.backgroundColor = "#00B347"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#00C853"; }}
                >
                  {submitting ? "Sending…" : "Send Reset Link"}
                </button>
              </form>

              <p className="text-sm text-[#888] text-center mt-6">
                Remember your password?{" "}
                <Link to="/login" className="text-[#1a1a1a] font-medium hover:text-[#00C853] transition-colors">
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            /* Success state */
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="h-16 w-16 rounded-full bg-[#E8F9EF] flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-[#00C853]" />
              </div>
              <h2 className="text-2xl font-bold">Check your inbox</h2>
              <p className="text-sm text-[#888] max-w-xs">
                Reset link sent! If <strong>{email}</strong> is registered, you'll receive an email shortly.
              </p>
              <Link
                to="/login"
                className="mt-2 w-full h-12 rounded-xl flex items-center justify-center text-white font-semibold text-sm transition-colors"
                style={{ backgroundColor: "#00C853" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#00B347")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#00C853")}
              >
                Back to login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
