import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Bell, Calendar, Share2, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const NAV = [
  { to: "/",            label: "Overview"     },
  { to: "/transactions",label: "Transactions" },
  { to: "/alerts",      label: "Alerts"       },
  { to: "/analytics",   label: "Analytics"    },
  { to: "/simulator",   label: "Simulator"    },
];

export function TopNav() {
  const { pathname } = useRouterState({ select: (s) => s.location });
  const { currentUser, role, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-border">
      <div className="mx-auto max-w-[1400px] px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-[#00C853] flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Finomaly</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button className="relative h-10 w-10 rounded-full bg-secondary flex items-center justify-center hover:bg-accent">
            <Bell className="h-4 w-4" />
          </button>
          <button className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center hover:bg-accent">
            <Share2 className="h-4 w-4" />
          </button>

          {currentUser ? (
            <button
              onClick={handleLogout}
              className="h-10 w-10 rounded-full bg-[#00C853] text-white flex items-center justify-center text-sm font-semibold hover:bg-[#00B347] transition-colors"
              title={`Sign out (${role ?? "user"}) — ${currentUser.email}`}
            >
              {currentUser.name?.[0]?.toUpperCase() ?? <LogOut className="h-4 w-4" />}
            </button>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 rounded-full bg-[#00C853] text-white text-sm font-medium hover:bg-[#00B347] transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function PillTabs({ active }: { active: string }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {NAV.map((n) => {
        const isActive = active === n.label;
        return (
          <Link
            key={n.to}
            to={n.to}
            className={`px-5 py-2.5 rounded-full text-sm font-medium border transition-all ${
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white text-foreground border-border hover:border-foreground/30"
            }`}
          >
            {n.label}
          </Link>
        );
      })}
    </div>
  );
}

export function PageHeader({ title, activeTab }: { title: string; activeTab: string }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
      <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-[0.95] max-w-xl">
        {title.split(" ").map((w, i) => (
          <span key={i} className="block">{w}</span>
        ))}
      </h1>
      <div className="flex flex-col items-end gap-3">
        <div className="flex items-center gap-2">
          <button className="h-10 w-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-accent">
            <Share2 className="h-4 w-4" />
          </button>
          <button className="h-10 w-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-accent">
            <Calendar className="h-4 w-4" />
          </button>
        </div>
        <PillTabs active={activeTab} />
      </div>
    </div>
  );
}

/**
 * Wraps every protected page: guards auth, renders TopNav + page layout.
 */
export function ProtectedShell({
  children,
  title,
  activeTab,
}: {
  children: React.ReactNode;
  title: string;
  activeTab: string;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <TopNav />
        <main className="mx-auto max-w-[1400px] px-6 py-10">
          <PageHeader title={title} activeTab={activeTab} />
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
