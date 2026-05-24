import { motion, AnimatePresence } from "framer-motion";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  Activity,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  ShieldAlert,
  LayoutDashboard,
  X,
} from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLogout } from "@/hooks/use-logout";
import { useAlerts } from "@/hooks/use-alerts";
import { defaultPathForMode } from "@/lib/dashboard-mode";
import { useLayout } from "./layout-context";
import { cn } from "@/lib/utils";

const USER_NAV = [
  { to: "/user-dashboard", label: "Simulate", Icon: Sparkles },
  { to: "/settings", label: "Settings", Icon: Settings },
];

const ADMIN_NAV = [
  { to: "/admin-dashboard", label: "Command Center", Icon: ShieldAlert },
  { to: "/transactions", label: "Transactions", Icon: ArrowLeftRight },
  { to: "/live-feed", label: "Live Feed", Icon: Activity },
  { to: "/alerts", label: "Alerts", Icon: Bell },
  { to: "/user-dashboard", label: "Simulator", Icon: Sparkles },
  { to: "/settings", label: "Settings", Icon: Settings },
];

const STORAGE_KEY = "finomaly_sidebar_collapsed";

function NavContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { pathname } = useRouterState({ select: (s) => s.location });
  const { currentUser, dashboardMode, setDashboardMode } = useAuth();
  const performLogout = useLogout();
  const { alerts } = useAlerts();
  const nav = useNavigate();

  const isAdminView = dashboardMode === "admin";
  const NAV = isAdminView ? ADMIN_NAV : USER_NAV;
  const newAlertCount = alerts.filter((a) => a.status === "New").length;

  const switchMode = () => {
    const next = isAdminView ? "user" : "admin";
    setDashboardMode(next);
    nav({ to: defaultPathForMode(next), replace: true });
    onNavigate?.();
  };

  return (
    <>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 pt-3 pb-1"
          >
            <span
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                isAdminView ? "bg-[#F3EEFF] text-[#7C3AED]" : "bg-[#E8F9EF] text-[#00A844]"
              }`}
            >
              {isAdminView ? "Admin view" : "User view"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {NAV.map(({ to, label, Icon }) => {
          const active =
            pathname === to ||
            (to !== "/user-dashboard" &&
              to !== "/admin-dashboard" &&
              pathname.startsWith(to));
          return (
            <div key={to} className="relative group">
              <Link
                to={to}
                onClick={onNavigate}
                className={`flex items-center gap-3 h-11 rounded-[10px] px-3 transition-colors relative ${
                  active
                    ? "bg-[#E8F9EF] text-[#00A844]"
                    : "text-[#6B6B6B] hover:bg-[#F0EFEA] hover:text-[#0A0A0A]"
                }`}
                style={
                  active
                    ? { borderLeft: "3px solid #00C853" }
                    : { borderLeft: "3px solid transparent" }
                }
              >
                <div className="flex-shrink-0 relative">
                  <Icon size={18} />
                  {label === "Alerts" && newAlertCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-[#FF3B30] text-white text-[9px] font-bold flex items-center justify-center">
                      {newAlertCount}
                    </span>
                  )}
                </div>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
              {collapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-[#0A0A0A] text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 hidden lg:block">
                  {label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-[#E8E6E0] p-3 flex-shrink-0 space-y-1">
        <button
          type="button"
          onClick={switchMode}
          className="flex items-center gap-3 h-10 w-full rounded-[10px] px-3 text-[#6B6B6B] hover:bg-[#F0EFEA] hover:text-[#0A0A0A] transition-colors"
        >
          <LayoutDashboard size={16} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium whitespace-nowrap"
              >
                {isAdminView ? "User view" : "Admin view"}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <AnimatePresence>
          {!collapsed && currentUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-1"
            >
              <div className="h-8 w-8 rounded-full bg-[#00C853] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {currentUser.name[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#0A0A0A] truncate">{currentUser.name}</p>
                <p className="text-[10px] text-[#6B6B6B] truncate">{currentUser.email}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => {
            void performLogout();
            onNavigate?.();
          }}
          className="flex items-center gap-3 h-10 w-full rounded-[10px] px-3 text-[#FF3B30] hover:bg-[#FFF0EE] transition-colors"
        >
          <LogOut size={16} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium whitespace-nowrap"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </>
  );
}

export function Sidebar() {
  const { mobileOpen, closeMobile, sidebarCollapsed, setSidebarCollapsed } = useLayout();
  const collapsed = sidebarCollapsed;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  const toggleCollapsed = () => setSidebarCollapsed(!collapsed);

  const asideClass = cn(
    "fixed left-0 top-0 h-full bg-white border-r border-[#E8E6E0] z-50 flex flex-col overflow-hidden",
    "transition-transform duration-300 ease-out",
    "w-60 max-w-[85vw]",
    mobileOpen ? "translate-x-0" : "-translate-x-full",
    "lg:translate-x-0",
    collapsed ? "lg:w-16" : "lg:w-60",
  );

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Close menu"
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      <aside className={asideClass} style={{ boxShadow: "2px 0 16px rgba(0,0,0,0.04)" }}>
        <div className="h-14 sm:h-16 flex items-center px-3 sm:px-4 border-b border-[#E8E6E0] flex-shrink-0">
          <div className="h-8 w-8 rounded-xl bg-[#00C853] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="ml-3 font-bold text-[#0A0A0A] text-base whitespace-nowrap overflow-hidden"
              >
                Finomaly
              </motion.span>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={closeMobile}
            className="ml-auto h-8 w-8 rounded-lg hover:bg-[#F0EFEA] flex items-center justify-center lg:hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="ml-auto h-7 w-7 rounded-lg hover:bg-[#F0EFEA] hidden lg:flex items-center justify-center transition-colors flex-shrink-0"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <NavContent collapsed={collapsed} onNavigate={closeMobile} />
      </aside>
    </>
  );
}
