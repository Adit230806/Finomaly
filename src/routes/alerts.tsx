import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminRoute } from "@/components/AdminRoute";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ExplainabilityDrawer } from "@/components/shared/ExplainabilityDrawer";
import { useAlerts } from "@/hooks/use-alerts";
import { useTransactions } from "@/hooks/use-transactions";
import type { Alert, AlertStatus, AlertSeverity, Transaction } from "@/data/mockData";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Search, ChevronDown, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/currency";

export const Route = createFileRoute("/alerts")({ component: AlertsPage });

const STATUS_TABS: (AlertStatus | "All")[] = ["All", "New", "Under Review", "Confirmed", "Ignored"];
const SEV_FILTERS: (AlertSeverity | "All")[] = ["All", "high", "medium", "low"];

function AlertsPage() {
  const { alerts: liveAlerts, changeStatus } = useAlerts();
  const { transactions } = useTransactions();
  const [rows,       setRows]       = useState<Alert[]>([]);
  const [statusTab,  setStatusTab]  = useState<AlertStatus | "All">("All");
  const [sevFilter,  setSevFilter]  = useState<AlertSeverity | "All">("All");
  const [search,     setSearch]     = useState("");
  const [sortBy,     setSortBy]     = useState<"date" | "risk" | "severity">("date");
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [menuOpen,   setMenuOpen]   = useState<string | null>(null);
  const [drawerTx,   setDrawerTx]   = useState<Transaction | null>(null);

  // Sync rows when live data arrives
  useEffect(() => { if (liveAlerts.length > 0) setRows(liveAlerts); }, [liveAlerts]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: rows.length };
    STATUS_TABS.slice(1).forEach((s) => { c[s] = rows.filter((r) => r.status === s).length; });
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    let r = [...rows];
    if (statusTab !== "All") r = r.filter((a) => a.status === statusTab);
    if (sevFilter !== "All") r = r.filter((a) => a.severity === sevFilter);
    if (search) { const q = search.toLowerCase(); r = r.filter((a) => a.reason.toLowerCase().includes(q) || a.merchant.toLowerCase().includes(q)); }
    if (sortBy === "date")     r.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (sortBy === "risk")     r.sort((a, b) => b.riskScore - a.riskScore);
    if (sortBy === "severity") r.sort((a, b) => { const o = { high: 0, medium: 1, low: 2 }; return o[a.severity] - o[b.severity]; });
    return r;
  }, [rows, statusTab, sevFilter, search, sortBy]);

  const updateStatus = (id: string, status: AlertStatus) => {
    setRows((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    setMenuOpen(null);
    changeStatus(id, status);
  };

  const openTx = (transactionId: string) => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (tx) setDrawerTx(tx);
    setMenuOpen(null);
  };

  return (
    <AdminRoute>
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0A0A]">Alerts</h1>
          <p className="text-[#6B6B6B] text-sm mt-1">Manage and review flagged transactions</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(["high","medium","low"] as AlertSeverity[]).map((s) => {
            const colors = { high: "bg-[#FFF0EE] text-[#CC2200]", medium: "bg-[#FFF4E5] text-[#CC7700]", low: "bg-[#E8F9EF] text-[#00A844]" };
            return (
              <span key={s} className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${colors[s]}`}>
                {rows.filter((r) => r.severity === s).length} {s}
              </span>
            );
          })}
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {STATUS_TABS.map((s) => (
          <motion.button key={s} onClick={() => setStatusTab(s)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${statusTab === s ? "bg-[#0A0A0A] text-white" : "bg-white border border-[#E8E6E0] text-[#6B6B6B] hover:text-[#0A0A0A]"}`}>
            {s} <span className="ml-1 opacity-60">({counts[s] ?? 0})</span>
          </motion.button>
        ))}
      </div>

      {/* Search + sort bar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-0 w-full sm:min-w-[200px] sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search alerts..."
            className="w-full h-9 pl-8 pr-3 rounded-xl border border-[#E8E6E0] bg-white text-sm outline-none focus:border-[#00C853]" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6B6B6B]">Sort:</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="h-9 px-3 rounded-xl border border-[#E8E6E0] bg-white text-sm outline-none">
            <option value="date">Date</option>
            <option value="risk">Risk Score</option>
            <option value="severity">Severity</option>
          </select>
        </div>
        <div className="flex items-center gap-1">
          {SEV_FILTERS.map((s) => (
            <button key={s} onClick={() => setSevFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${sevFilter === s ? "bg-[#0A0A0A] text-white" : "bg-white border border-[#E8E6E0] text-[#6B6B6B] hover:text-[#0A0A0A]"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Alert cards */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-[#6B6B6B] text-sm">No alerts match your filters.</div>
          )}
          {filtered.map((a) => {
            const isExpanded = expanded === a.id;
            const sevColor = a.severity === "high" ? "#FF3B30" : a.severity === "medium" ? "#FF9500" : "#00C853";
            const sevBg    = a.severity === "high" ? "bg-[#FFF0EE]" : a.severity === "medium" ? "bg-[#FFF4E5]" : "bg-[#E8F9EF]";
            return (
              <motion.div key={a.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-2xl border border-[#E8E6E0] overflow-hidden cursor-pointer"
                style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)", borderLeft: `4px solid ${sevColor}` }}
                onClick={() => setExpanded(isExpanded ? null : a.id)}
              >
                <div className="flex items-start gap-4 p-5">
                  {/* Severity icon */}
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${sevBg}`}>
                    <AlertTriangle size={18} style={{ color: sevColor }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#0A0A0A] text-sm leading-snug">{a.reason}</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">{a.merchant} · {formatINR(a.amount)} · {a.location}</p>
                    <p className="text-xs text-[#6B6B6B] mt-0.5">{formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}</p>
                  </div>

                  {/* Right */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <RiskBadge score={a.riskScore} />
                    <StatusBadge status={a.status} size="sm" />
                  </div>

                  {/* Three-dot menu */}
                  <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setMenuOpen(menuOpen === a.id ? null : a.id)}
                      className="h-8 w-8 rounded-xl hover:bg-[#F0EFEA] flex items-center justify-center transition-colors">
                      <MoreVertical size={14} />
                    </button>
                    <AnimatePresence>
                      {menuOpen === a.id && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 top-9 w-44 bg-white rounded-xl border border-[#E8E6E0] shadow-xl z-20 overflow-hidden">
                          {(["Confirmed","Ignored","Under Review"] as AlertStatus[]).map((s) => (
                            <button key={s} onClick={() => updateStatus(a.id, s)}
                              className="w-full text-left px-4 py-2.5 text-xs hover:bg-[#F8F7F4] transition-colors">
                              Mark {s}
                            </button>
                          ))}
                          <div className="border-t border-[#E8E6E0]" />
                          <button onClick={() => openTx(a.transactionId)}
                            className="w-full text-left px-4 py-2.5 text-xs text-[#00C853] hover:bg-[#F8F7F4] transition-colors">
                            View Transaction
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Expanded section */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-[#F0EFEA] px-5 py-4 bg-[#F8F7F4]"
                    >
                      <p className="text-xs font-semibold text-[#6B6B6B] mb-3 uppercase tracking-wide">Transaction Details</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        {[["Merchant", a.merchant], ["Amount", formatINR(a.amount)], ["Location", a.location], ["Risk Score", a.riskScore]].map(([l, v]) => (
                          <div key={String(l)} className="bg-white rounded-xl p-3">
                            <p className="text-[10px] text-[#6B6B6B]">{l}</p>
                            <p className="text-sm font-semibold text-[#0A0A0A]">{v}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => updateStatus(a.id, "Confirmed")}
                          className="px-4 py-2 rounded-xl bg-[#FF3B30] text-white text-xs font-semibold hover:bg-[#CC2200] transition-colors">
                          Confirm Anomaly
                        </button>
                        <button onClick={() => updateStatus(a.id, "Ignored")}
                          className="px-4 py-2 rounded-xl bg-white border border-[#E8E6E0] text-xs font-medium hover:bg-[#F0EFEA] transition-colors">
                          Ignore
                        </button>
                        <button onClick={() => updateStatus(a.id, "Under Review")}
                          className="px-4 py-2 rounded-xl bg-[#FFF4E5] text-[#CC7700] text-xs font-semibold hover:bg-[#FFE8B0] transition-colors">
                          Under Review
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <ExplainabilityDrawer transaction={drawerTx} onClose={() => setDrawerTx(null)} />
    </AppLayout>
    </AdminRoute>
  );
}
