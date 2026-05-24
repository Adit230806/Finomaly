import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  sub?: ReactNode;
  delay?: number;
}

export function StatCard({ icon, iconBg, label, value, sub, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.01 }}
      className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8E6E0] shadow-sm cursor-default"
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      <p className="text-[#6B6B6B] text-xs font-medium mb-1">{label}</p>
      <p className="text-xl sm:text-2xl font-bold text-[#0A0A0A] tracking-tight break-words">{value}</p>
      {sub && <div className="mt-1 text-xs text-[#6B6B6B]">{sub}</div>}
    </motion.div>
  );
}
