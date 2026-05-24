import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminRoute } from "@/components/AdminRoute";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { ExplainabilityDrawer } from "@/components/shared/ExplainabilityDrawer";
import { useTransactions } from "@/hooks/use-transactions";
import { useAlerts } from "@/hooks/use-alerts";
import type { Transaction } from "@/data/mockData";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, ArrowLeftRight } from "lucide-react";
import { formatINR } from "@/lib/currency";

export const Route = createFileRoute("/live-feed")({ component: LiveFeedPage });

function LiveDot({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-[#00C853]">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C853] opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00C853]" />
      </span>
      {label}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-12 w-12 rounded-2xl bg-[#F0EFEA] flex items-center justify-center mb-3">
        <ArrowLeftRight size={20} className="text-[#6B6B6B]" />
      </div>
      <p className="text-sm font-medium text-[#0A0A0A]">No data yet</p>
      <p className="text-xs text-[#6B6B6B] mt-1">{message}</p>
    </div>
  );
}

function LiveFeedPage() {
  const [selected, setSelected] = useState<Transaction | null>(null);
  const { transactions, loading: txLoading } = useTransactions();
  const { alerts,       loading: alLoading } = useAlerts();

  const anomalies  = transactions.filter((t) => t.isAnomaly).length;
  const avgRisk    = transactions.length
    ? Math.round(transactions.reduce((s, t) => s + t.riskScore, 0) / transactions.length)
    : 0;
  const newAlerts  = alerts.filter((a) => a.status === "New").length;

  const STAT_ITEMS = [
    { label: "Total Transactions", value: transactions.length },
    { label: "Anomalies Detected", value: anomalies           },
    { label: "Avg Risk Score",     value: avgRisk             },
    { label: "Active Alerts",      value: newAlerts           },
  ];

  return (
    <AdminRoute>
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0A0A]">Live Transaction Feed</h1>
          <p className="text-[#6B6B6B] text-sm mt-1">Real-time transaction monitoring</p>
        </div>
        <LiveDot label="Live" />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {STAT_ITEMS.map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-[#E8E6E0]" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <p className="text-xs text-[#6B6B6B] mb-1">{label}</p>
            <p className="text-2xl font-bold text-[#0A0A0A] tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Two-column feed */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Transaction stream */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-[#E8E6E0] overflow-hidden" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E6E0]">
              <h3 className="font-semibold text-[#0A0A0A]">Transaction Stream</h3>
              <LiveDot label="Realtime" />
            </div>
            <div className="divide-y divide-[#F0EFEA] max-h-[600px] overflow-y-auto">
              {txLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-8 w-8 rounded-full border-4 border-[#00C853] border-t-transparent animate-spin" />
                </div>
              ) : transactions.length === 0 ? (
                <EmptyState message="Add transactions to see them here" />
              ) : (
                <AnimatePresence initial={false}>
                  {transactions.map((tx) => (
                    <motion.div key={tx.id}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      onClick={() => setSelected(tx)}
                      className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-[#F8F7F4] transition-colors border-l-4 ${tx.isAnomaly ? "border-[#FF3B30]" : "border-[#00C853]"}`}
                    >
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${tx.isAnomaly ? "bg-[#FFF0EE] text-[#FF3B30]" : "bg-[#E8F9EF] text-[#00A844]"}`}>
                        {tx.merchant[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0A0A0A]">{tx.merchant}</p>
                        <p className="text-xs text-[#6B6B6B]">{tx.location} · {tx.paymentMethod} · {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-[#0A0A0A]">{formatINR(tx.amount)}</p>
                        <RiskBadge score={tx.riskScore} size="sm" />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

        {/* Alert stream */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-[#E8E6E0] overflow-hidden" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E6E0]">
              <h3 className="font-semibold text-[#0A0A0A]">Realtime Alerts</h3>
              <LiveDot label="Alert" />
            </div>
            <div className="divide-y divide-[#F0EFEA] max-h-[600px] overflow-y-auto">
              {alLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-8 w-8 rounded-full border-4 border-[#00C853] border-t-transparent animate-spin" />
                </div>
              ) : alerts.length === 0 ? (
                <EmptyState message="High risk transactions will generate alerts here" />
              ) : (
                <AnimatePresence initial={false}>
                  {alerts.map((a) => (
                    <motion.div key={a.id}
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`px-5 py-3.5 border-l-4 ${a.severity === "high" ? "border-[#FF3B30]" : a.severity === "medium" ? "border-[#FF9500]" : "border-[#00C853]"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${a.severity === "high" ? "bg-[#FFF0EE]" : a.severity === "medium" ? "bg-[#FFF4E5]" : "bg-[#E8F9EF]"}`}>
                          <AlertTriangle size={14} className={a.severity === "high" ? "text-[#FF3B30]" : a.severity === "medium" ? "text-[#FF9500]" : "text-[#00C853]"} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#0A0A0A] line-clamp-2">{a.reason}</p>
                          <p className="text-[10px] text-[#6B6B6B] mt-0.5">{a.merchant} · {formatINR(a.amount, 0)}</p>
                          <p className="text-[10px] text-[#6B6B6B]">{formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}</p>
                        </div>
                        <RiskBadge score={a.riskScore} size="sm" />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>

      <ExplainabilityDrawer transaction={selected} onClose={() => setSelected(null)} />
    </AppLayout>
    </AdminRoute>
  );
}
