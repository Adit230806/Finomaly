import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  headerRight?: ReactNode;
  children: ReactNode;
  dark?: boolean;
  className?: string;
  delay?: number;
}

export function ChartCard({ title, headerRight, children, dark = false, className, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.005 }}
      className={cn(
        "rounded-2xl p-6 border",
        dark ? "bg-[#0A0A0A] border-white/10 text-white" : "bg-white border-[#E8E6E0] text-[#0A0A0A]",
        className,
      )}
      style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className={cn("font-semibold text-base", dark ? "text-white" : "text-[#0A0A0A]")}>{title}</h3>
        {headerRight && <div>{headerRight}</div>}
      </div>
      {children}
    </motion.div>
  );
}
