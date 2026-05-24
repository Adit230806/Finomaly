import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, MapPin, Clock, IndianRupee, CheckCircle2 } from "lucide-react";
import type { Transaction } from "@/types/transaction";
import { formatINR } from "@/lib/currency";
import { RiskBadge } from "./RiskBadge";
import { StatusBadge } from "./StatusBadge";
import { FraudTimeline } from "./FraudTimeline";
import { buildFraudTimeline } from "@/lib/fraud-timeline";
import { format } from "date-fns";

interface Props {
  transaction: Transaction | null;
  onClose: () => void;
  hasAlert?: boolean;
}

function RiskGauge({ score }: { score: number }) {
  const color = score <= 30 ? "#00C853" : score <= 70 ? "#FF9500" : "#FF3B30";
  const pct = score / 100;
  const r = 54;
  const cx = 64;
  const cy = 64;
  const circ = Math.PI * r;
  const dash = circ * pct;
  return (
    <div className="flex flex-col items-center">
      <svg width="128" height="80" viewBox="0 0 128 80">
        <path
          d={`M 10 70 A ${r} ${r} 0 0 1 118 70`}
          fill="none"
          stroke="#E8E6E0"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d={`M 10 70 A ${r} ${r} 0 0 1 118 70`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize="22" fontWeight="bold" fill={color}>
          {score}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="#6B6B6B">
          Risk Score
        </text>
      </svg>
    </div>
  );
}

const ICONS: Record<string, React.ReactNode> = {
  amount: <IndianRupee size={14} />,
  location: <MapPin size={14} />,
  time: <Clock size={14} />,
  default: <AlertTriangle size={14} />,
};

function getIcon(reason: string) {
  if (/amount|spend|average|₹|inr/i.test(reason)) return ICONS.amount;
  if (/location|region|country|unknown/i.test(reason)) return ICONS.location;
  if (/hour|AM|PM|timing|night|unusual hour/i.test(reason)) return ICONS.time;
  return ICONS.default;
}

function getSeverityChip(reason: string, score: number) {
  if (score >= 71 || /unknown vendor|all signal|maximum/i.test(reason))
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FFF0EE] text-[#CC2200] border border-[#FFBDB8]">
        High Impact
      </span>
    );
  if (score >= 31)
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FFF4E5] text-[#CC7700] border border-[#FFD9A0]">
        Medium Impact
      </span>
    );
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F9EF] text-[#00A844] border border-[#B8EDD0]">
      Low Impact
    </span>
  );
}

export function ExplainabilityDrawer({ transaction: tx, onClose, hasAlert }: Props) {
  const timeline = tx ? buildFraudTimeline(tx, { hasAlert }) : [];

  return (
    <AnimatePresence>
      {tx && (
        <div className="fixed inset-0 z-[100]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: 480 }}
            animate={{ x: 0 }}
            exit={{ x: 480 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="absolute inset-0 sm:inset-auto sm:right-0 sm:top-0 sm:h-full w-full sm:max-w-[480px] bg-white shadow-2xl overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-[#E8E6E0] px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-bold text-lg text-[#0A0A0A]">{tx.merchant}</h2>
                <p className="text-xs text-[#6B6B6B] font-mono">{tx.id}</p>
              </div>
              <button
                onClick={onClose}
                className="h-9 w-9 rounded-xl hover:bg-[#F5F5F5] flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              <div className="flex items-center gap-3">
                <StatusBadge status={tx.status} />
                <span className="text-xs text-[#6B6B6B]">{format(new Date(tx.timestamp), "PPp")}</span>
              </div>

              <div
                className={`rounded-2xl p-5 text-center ${tx.riskScore >= 71 ? "bg-[#FFF0EE]" : tx.riskScore >= 31 ? "bg-[#FFF4E5]" : "bg-[#E8F9EF]"}`}
              >
                <RiskGauge score={tx.riskScore} />
                <div className="mt-2">
                  <p className="text-xs text-[#6B6B6B] mb-1">Confidence Level</p>
                  <div className="h-2 bg-white/60 rounded-full overflow-hidden mx-8">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${tx.confidenceLevel}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="h-full rounded-full bg-[#0A0A0A]"
                    />
                  </div>
                  <p className="text-xs font-semibold mt-1">{tx.confidenceLevel}%</p>
                </div>
                <div className="mt-3 flex justify-center">
                  <RiskBadge score={tx.riskScore} />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#0A0A0A] mb-3">Transaction Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Amount", formatINR(tx.amount)],
                    ["Payment Method", tx.paymentMethod],
                    ["Category", tx.category],
                    ["Location", tx.location],
                    ["Risk Score", String(tx.riskScore)],
                    ["Merchant", tx.merchant],
                  ].map(([label, val]) => (
                    <div key={label} className="bg-[#F8F7F4] rounded-xl p-3">
                      <p className="text-[10px] text-[#6B6B6B] font-medium mb-0.5">{label}</p>
                      <p className="text-sm font-semibold text-[#0A0A0A] truncate">{val}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-[#0A0A0A]">Why was this flagged?</h3>
                  <AlertTriangle size={14} className="text-[#FF9500]" />
                </div>
                <p className="text-xs text-[#6B6B6B] mb-3">
                  Explainable risk signals persisted from the fraud engine
                </p>
                <ul className="space-y-2">
                  {tx.explanation.map((reason, i) => {
                    const borderColor =
                      tx.riskScore >= 71 ? "#FF3B30" : tx.riskScore >= 31 ? "#FF9500" : "#00C853";
                    return (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="flex items-start gap-3 bg-[#F8F7F4] rounded-xl p-3 border-l-4 list-none"
                        style={{ borderLeftColor: borderColor }}
                      >
                        <div className="mt-0.5 text-[#6B6B6B] flex-shrink-0">{getIcon(reason)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#0A0A0A]">{reason}</p>
                        </div>
                        <div className="flex-shrink-0">{getSeverityChip(reason, tx.riskScore)}</div>
                      </motion.li>
                    );
                  })}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#0A0A0A] mb-3">Fraud Timeline</h3>
                <FraudTimeline events={timeline} />
              </div>

              <div className="flex gap-3 pb-4">
                <button className="flex-1 h-11 rounded-xl bg-[#FF3B30] text-white font-semibold text-sm hover:bg-[#CC2200] transition-colors flex items-center justify-center gap-2">
                  <AlertTriangle size={15} /> Confirm Anomaly
                </button>
                <button className="flex-1 h-11 rounded-xl bg-[#00C853] text-white font-semibold text-sm hover:bg-[#00A844] transition-colors flex items-center justify-center gap-2">
                  <CheckCircle2 size={15} /> Mark as Safe
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
