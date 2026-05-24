import { useState, useRef, useEffect } from "react";
import { useRouterState, Link } from "@tanstack/react-router";
import { Search, Bell, ChevronDown, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useLogout } from "@/hooks/use-logout";
import { useAlerts } from "@/hooks/use-alerts";
import { formatDistanceToNow } from "date-fns";
import { useLayout } from "./layout-context";
import { cn } from "@/lib/utils";

const PAGE_NAMES: Record<string, string> = {
  "/user-dashboard": "Transaction Simulator",
  "/admin-dashboard": "Fraud Command Center",
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/live-feed": "Live Feed",
  "/alerts": "Alerts",
  "/analytics": "Fraud Command Center",
  "/settings": "Settings",
  "/simulator": "Transaction Simulator",
};

const SEV_COLOR: Record<string, string> = {
  high: "text-[#FF3B30]",
  medium: "text-[#FF9500]",
  low: "text-[#00C853]",
};

export function TopNavbar() {
  const { pathname } = useRouterState({ select: (s) => s.location });
  const { currentUser } = useAuth();
  const performLogout = useLogout();
  const { alerts: ALERTS } = useAlerts();
  const { setMobileOpen, sidebarCollapsed } = useLayout();

  const [searchFocused, setSearchFocused] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const newAlerts = ALERTS.filter((a) => a.status === "New");
  const pageName = PAGE_NAMES[pathname] ?? "Finomaly";
  const ml = sidebarCollapsed ? "lg:pl-16" : "lg:pl-60";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-40 h-14 sm:h-16 bg-white border-b border-[#E8E6E0]",
        "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 lg:pr-6 transition-[padding] duration-300",
        ml,
      )}
    >
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="h-9 w-9 rounded-xl hover:bg-[#F0EFEA] flex items-center justify-center flex-shrink-0 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <span className="font-bold text-base sm:text-lg text-[#0A0A0A] truncate min-w-0 flex-1 lg:flex-none lg:max-w-[200px]">
        {pageName}
      </span>

      <div className="hidden md:flex flex-1 justify-center max-w-md lg:max-w-lg mx-auto">
        <div
          className={cn(
            "relative flex items-center h-9 w-full max-w-full rounded-full transition-all",
            searchFocused
              ? "bg-white border border-[#00C853] shadow-sm"
              : "bg-[#F0EFEA] border border-transparent",
          )}
        >
          <Search size={14} className="absolute left-3 text-[#6B6B6B]" />
          <input
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search transactions, alerts..."
            className="w-full bg-transparent pl-8 pr-3 md:pr-12 text-sm outline-none text-[#0A0A0A] placeholder:text-[#6B6B6B]"
          />
          {!searchFocused && (
            <span className="absolute right-3 hidden lg:inline text-[10px] text-[#6B6B6B] bg-white border border-[#E8E6E0] rounded px-1.5 py-0.5 font-mono">
              ⌘K
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-auto">
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setUserOpen(false);
            }}
            className="relative h-9 w-9 rounded-xl hover:bg-[#F0EFEA] flex items-center justify-center transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} className="text-[#0A0A0A]" />
            {newAlerts.length > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-[#FF3B30] text-white text-[9px] font-bold flex items-center justify-center">
                {newAlerts.length}
              </span>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 w-[min(20rem,calc(100vw-1.5rem))] bg-white rounded-2xl border border-[#E8E6E0] shadow-xl z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6E0]">
                  <span className="font-semibold text-sm text-[#0A0A0A]">Notifications</span>
                  <button
                    type="button"
                    className="text-xs text-[#00C853] font-medium hover:underline"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {ALERTS.slice(0, 5).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-[#F8F7F4] border-b border-[#F0EFEA] last:border-0"
                    >
                      <span className={`text-lg mt-0.5 ${SEV_COLOR[a.severity]}`}>●</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#0A0A0A] line-clamp-2">{a.reason}</p>
                        <p className="text-[10px] text-[#6B6B6B] mt-0.5">
                          {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-[#E8E6E0]">
                  <Link
                    to="/alerts"
                    onClick={() => setNotifOpen(false)}
                    className="text-xs text-[#00C853] font-medium hover:underline"
                  >
                    View all alerts →
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div ref={userRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setUserOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-1 sm:gap-2 h-9 px-1.5 sm:px-2 rounded-xl hover:bg-[#F0EFEA] transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-[#00C853] flex items-center justify-center text-white text-xs font-bold">
              {currentUser?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <ChevronDown size={12} className="text-[#6B6B6B] hidden sm:block" />
          </button>
          <AnimatePresence>
            {userOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 w-52 bg-white rounded-2xl border border-[#E8E6E0] shadow-xl z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-[#E8E6E0]">
                  <p className="text-sm font-semibold text-[#0A0A0A]">{currentUser?.name}</p>
                  <p className="text-xs text-[#6B6B6B] truncate">{currentUser?.email}</p>
                  <span className="mt-1.5 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F9EF] text-[#00A844] capitalize">
                    {currentUser?.role}
                  </span>
                </div>
                <div className="py-1">
                  <Link
                    to="/settings"
                    onClick={() => setUserOpen(false)}
                    className="flex items-center px-4 py-2.5 text-sm text-[#0A0A0A] hover:bg-[#F8F7F4] transition-colors"
                  >
                    Profile Settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      void performLogout();
                    }}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-[#FF3B30] hover:bg-[#FFF0EE] transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
