import { useState, useRef, useEffect } from "react";
import { useRouterState, useNavigate, Link } from "@tanstack/react-router";
import { Search, Bell, Sun, Moon, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useLogout } from "@/hooks/use-logout";
import { useAlerts } from "@/hooks/use-alerts";
import { formatDistanceToNow } from "date-fns";

const PAGE_NAMES: Record<string, string> = {
  "/user-dashboard":  "Transaction Simulator",
  "/admin-dashboard": "Fraud Command Center",
  "/dashboard":       "Dashboard",
  "/transactions":    "Transactions",
  "/live-feed":       "Live Feed",
  "/alerts":          "Alerts",
  "/analytics":       "Fraud Command Center",
  "/settings":        "Settings",
  "/simulator":       "Transaction Simulator",
};

const SEV_COLOR: Record<string, string> = {
  high:   "text-[#FF3B30]",
  medium: "text-[#FF9500]",
  low:    "text-[#00C853]",
};

interface Props { sidebarCollapsed?: boolean; }

export function TopNavbar({ sidebarCollapsed = false }: Props) {
  const { pathname } = useRouterState({ select: (s) => s.location });
  const { currentUser } = useAuth();
  const performLogout = useLogout();
  const { alerts: ALERTS } = useAlerts();
  const nav = useNavigate();

  const [searchFocused, setSearchFocused] = useState(false);
  const [searchVal, setSearchVal]         = useState("");
  const [notifOpen, setNotifOpen]         = useState(false);
  const [userOpen,  setUserOpen]          = useState(false);
  const [darkMode,  setDarkMode]          = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef  = useRef<HTMLDivElement>(null);

  const newAlerts = ALERTS.filter((a) => a.status === "New");
  const pageName  = PAGE_NAMES[pathname] ?? "Finomaly";
  const ml        = sidebarCollapsed ? 64 : 240;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setUserOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <motion.header
      animate={{ paddingLeft: ml }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}
      className="fixed top-0 right-0 left-0 h-16 bg-white border-b border-[#E8E6E0] z-40 flex items-center pr-6 gap-4"
    >
      {/* Page name */}
      <span className="font-bold text-[18px] text-[#0A0A0A] whitespace-nowrap">{pageName}</span>

      {/* Search */}
      <div className="flex-1 flex justify-center">
        <motion.div
          animate={{ width: searchFocused ? 380 : 320 }}
          transition={{ duration: 0.2 }}
          className={`relative flex items-center h-9 rounded-full transition-all ${
            searchFocused ? "bg-white border border-[#00C853] shadow-sm" : "bg-[#F0EFEA] border border-transparent"
          }`}
        >
          <Search size={14} className="absolute left-3 text-[#6B6B6B]" />
          <input
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search transactions, alerts..."
            className="w-full bg-transparent pl-8 pr-12 text-sm outline-none text-[#0A0A0A] placeholder:text-[#6B6B6B]"
          />
          {!searchFocused && (
            <span className="absolute right-3 text-[10px] text-[#6B6B6B] bg-white border border-[#E8E6E0] rounded px-1.5 py-0.5 font-mono">⌘K</span>
          )}
        </motion.div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => setDarkMode((v) => !v)}
          className="h-8 w-16 rounded-full bg-[#F0EFEA] border border-[#E8E6E0] flex items-center px-1 relative transition-colors"
        >
          <motion.div animate={{ x: darkMode ? 28 : 0 }} transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="h-6 w-6 rounded-full bg-white shadow flex items-center justify-center"
          >
            {darkMode ? <Moon size={12} className="text-[#0A0A0A]" /> : <Sun size={12} className="text-[#FF9500]" />}
          </motion.div>
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen((v) => !v); setUserOpen(false); }}
            className="relative h-9 w-9 rounded-xl hover:bg-[#F0EFEA] flex items-center justify-center transition-colors"
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
              <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 w-80 bg-white rounded-2xl border border-[#E8E6E0] shadow-xl z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E6E0]">
                  <span className="font-semibold text-sm text-[#0A0A0A]">Notifications</span>
                  <button className="text-xs text-[#00C853] font-medium hover:underline">Mark all read</button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {ALERTS.slice(0, 5).map((a) => (
                    <div key={a.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[#F8F7F4] border-b border-[#F0EFEA] last:border-0">
                      <span className={`text-lg mt-0.5 ${SEV_COLOR[a.severity]}`}>●</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#0A0A0A] line-clamp-2">{a.reason}</p>
                        <p className="text-[10px] text-[#6B6B6B] mt-0.5">{formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-[#E8E6E0]">
                  <Link to="/alerts" onClick={() => setNotifOpen(false)} className="text-xs text-[#00C853] font-medium hover:underline">
                    View all alerts →
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User avatar */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => { setUserOpen((v) => !v); setNotifOpen(false); }}
            className="flex items-center gap-2 h-9 px-2 rounded-xl hover:bg-[#F0EFEA] transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-[#00C853] flex items-center justify-center text-white text-xs font-bold">
              {currentUser?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <ChevronDown size={12} className="text-[#6B6B6B]" />
          </button>
          <AnimatePresence>
            {userOpen && (
              <motion.div initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
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
                  <Link to="/settings" onClick={() => setUserOpen(false)}
                    className="flex items-center px-4 py-2.5 text-sm text-[#0A0A0A] hover:bg-[#F8F7F4] transition-colors">
                    Profile Settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => { void performLogout(); }}
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
    </motion.header>
  );
}
