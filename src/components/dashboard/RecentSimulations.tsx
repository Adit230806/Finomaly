import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { History } from "lucide-react";
import { RiskBadge } from "@/components/shared/RiskBadge";
import type { Transaction } from "@/data/mockData";
import { formatINR } from "@/lib/currency";

interface Props {
  transactions: Transaction[];
  loading: boolean;
}

export function RecentSimulations({ transactions, loading }: Props) {
  const recent = transactions.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
      className="mt-6 bg-white/60 backdrop-blur-lg rounded-2xl border border-[#E8E6E0] px-5 py-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <History size={14} className="text-[#6B6B6B]" />
        <span className="text-xs font-medium text-[#6B6B6B]">Recent simulations</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="h-5 w-5 rounded-full border-2 border-[#00C853] border-t-transparent animate-spin" />
        </div>
      ) : recent.length === 0 ? (
        <p className="text-xs text-[#6B6B6B] py-2">No simulations yet</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {recent.map((tx) => (
            <div
              key={tx.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border ${
                tx.isAnomaly ? "border-[#FF3B30]/30 bg-[#FFF8F8]" : "border-[#00C853]/20 bg-[#F8FFF9]"
              }`}
            >
              <span className="font-medium text-[#0A0A0A]">{tx.merchant}</span>
              <span className="text-[#6B6B6B]">{formatINR(tx.amount, 0)}</span>
              <RiskBadge score={tx.riskScore} size="sm" />
              <span className="text-[#6B6B6B] hidden sm:inline">
                {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
