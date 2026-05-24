import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { LayoutContext } from "./layout-context";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "finomaly_sidebar_collapsed";

interface Props {
  children: React.ReactNode;
}

export function AppLayout({ children }: Props) {
  const { isAuthenticated, loading, isLoggingOut } = useAuth();
  const nav = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    const handler = () => {
      try {
        setCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
      } catch {
        /* noop */
      }
    };
    window.addEventListener("storage", handler);
    const interval = setInterval(handler, 200);
    return () => {
      window.removeEventListener("storage", handler);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (loading || isLoggingOut) return;
    if (!isAuthenticated) {
      nav({ to: "/login", replace: true, search: {} });
    }
  }, [loading, isLoggingOut, isAuthenticated, nav]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen, closeMobile]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  if (loading || isLoggingOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0EFEA]">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <LayoutContext.Provider
      value={{
        mobileOpen,
        setMobileOpen,
        closeMobile,
        sidebarCollapsed: collapsed,
        setSidebarCollapsed: setCollapsed,
      }}
    >
      <div className="min-h-screen bg-[#F0EFEA]">
        <Sidebar />
        <TopNavbar />
        <main
          className={cn(
            "pt-14 sm:pt-16 min-h-screen transition-[margin] duration-300",
            "ml-0",
            collapsed ? "lg:ml-16" : "lg:ml-60",
          )}
        >
          <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </LayoutContext.Provider>
  );
}
