import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, ArrowLeftRight } from "lucide-react";
import { RiskBadge } from "@/components/shared/RiskBadge";
import type { Transaction, Alert } from "@/data/mockData";
import { formatINR } from "@/lib/currency";

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

interface Props {
  transactions: Transaction[];
  alerts: Alert[];
  txLoading: boolean;
  alLoading: boolean;
  onSelectTransaction: (tx: Transaction) => void;
}

export function LiveMonitoringPanel({
  transactions,
  alerts,
  txLoading,
  alLoading,
  onSelectTransaction,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      <div className="lg:col-span-3 bg-white rounded-3xl border border-[#E8E6E0] overflow-hidden" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E6E0]">
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={16} className="text-[#00C853]" />
            <h3 className="font-semibold text-[#0A0A0A]">Live Transaction Stream</h3>
          </div>
          <LiveDot label="Live" />
        </div>
        <div className="divide-y divide-[#F0EFEA] max-h-[340px] overflow-y-auto">
          {txLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-7 w-7 rounded-full border-4 border-[#00C853] border-t-transparent animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-xs text-[#6B6B6B] text-center py-12">Simulations from your account will appear here</p>
          ) : (
            <AnimatePresence initial={false}>
              {transactions.slice(0, 8).map((tx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => onSelectTransaction(tx)}
                  className={`flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-[#F8F7F4] transition-colors border-l-4 ${
                    tx.isAnomaly ? "border-[#FF3B30]" : "border-[#00C853]"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      tx.isAnomaly ? "bg-[#FFF0EE] text-[#FF3B30]" : "bg-[#E8F9EF] text-[#00A844]"
                    }`}
                  >
                    {tx.merchant[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0A0A0A] truncate">{tx.merchant}</p>
                    <p className="text-xs text-[#6B6B6B]">
                      {tx.location} · {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold">{formatINR(tx.amount, 0)}</p>
                    <RiskBadge score={tx.riskScore} size="sm" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E8E6E0] overflow-hidden" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8E6E0]">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-[#FF3B30]" />
            <h3 className="font-semibold text-[#0A0A0A]">Realtime Alerts</h3>
          </div>
          <LiveDot label="Alert" />
        </div>
        <div className="divide-y divide-[#F0EFEA] max-h-[340px] overflow-y-auto">
          {alLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-7 w-7 rounded-full border-4 border-[#00C853] border-t-transparent animate-spin" />
            </div>
          ) : alerts.length === 0 ? (
            <p className="text-xs text-[#6B6B6B] text-center py-12 px-4">High-risk transactions generate alerts automatically</p>
          ) : (
            alerts.slice(0, 6).map((a) => (
              <div
                key={a.id}
                className={`px-4 py-3 border-l-4 ${
                  a.severity === "high" ? "border-[#FF3B30]" : a.severity === "medium" ? "border-[#FF9500]" : "border-[#00C853]"
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#0A0A0A] line-clamp-2">{a.reason}</p>
                    <p className="text-[10px] text-[#6B6B6B] mt-0.5">
                      {formatINR(a.amount, 0)} · {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  <RiskBadge score={a.riskScore} size="sm" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
