import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const STORAGE_KEY = "finomaly_sidebar_collapsed";

interface Props { children: React.ReactNode; }

export function AppLayout({ children }: Props) {
  const { isAuthenticated, loading, isLoggingOut } = useAuth();
  const nav = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === "true"; } catch { return false; }
  });

  useEffect(() => {
    const handler = () => {
      try { setCollapsed(localStorage.getItem(STORAGE_KEY) === "true"); } catch { /* noop */ }
    };
    window.addEventListener("storage", handler);
    const interval = setInterval(handler, 200);
    return () => { window.removeEventListener("storage", handler); clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (loading || isLoggingOut) return;
    if (!isAuthenticated) {
      nav({ to: "/login", replace: true, search: {} });
    }
  }, [loading, isLoggingOut, isAuthenticated, nav]);

  if (loading || isLoggingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0EFEA]">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const ml = collapsed ? 64 : 240;

  return (
    <div className="min-h-screen bg-[#F0EFEA]">
      <Sidebar />
      <TopNavbar sidebarCollapsed={collapsed} />
      <motion.main
        animate={{ marginLeft: ml }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="pt-16 min-h-screen"
      >
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </motion.main>
    </div>
  );
}
