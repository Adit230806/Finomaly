import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Bell, Shield, Zap, CircleDot } from "lucide-react";
import { format } from "date-fns";
import type { FraudTimelineEvent } from "@/types/transaction";

const KIND_STYLES: Record<
  FraudTimelineEvent["kind"],
  { icon: ReactNode; dot: string; line: string }
> = {
  created: {
    icon: <CircleDot size={14} className="text-[#007AFF]" />,
    dot: "bg-[#007AFF]",
    line: "bg-[#007AFF]/30",
  },
  scored: {
    icon: <Shield size={14} className="text-[#FF9500]" />,
    dot: "bg-[#FF9500]",
    line: "bg-[#FF9500]/30",
  },
  alert: {
    icon: <Zap size={14} className="text-[#FF3B30]" />,
    dot: "bg-[#FF3B30]",
    line: "bg-[#FF3B30]/30",
  },
  notified: {
    icon: <Bell size={14} className="text-[#7C3AED]" />,
    dot: "bg-[#7C3AED]",
    line: "bg-[#7C3AED]/30",
  },
};

interface Props {
  events: FraudTimelineEvent[];
}

export function FraudTimeline({ events }: Props) {
  if (events.length === 0) return null;

  return (
    <div className="relative pl-1">
      {events.map((event, i) => {
        const style = KIND_STYLES[event.kind];
        const isLast = i === events.length - 1;
        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex gap-3 pb-4 last:pb-0"
          >
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center ${style.dot}/15 border border-[#E8E6E0]`}
              >
                {style.icon}
              </div>
              {!isLast && <div className={`w-0.5 flex-1 min-h-[20px] mt-1 ${style.line}`} />}
            </div>
            <div className="pt-0.5 min-w-0">
              <p className="text-sm font-semibold text-[#0A0A0A]">{event.label}</p>
              {event.detail && (
                <p className="text-xs text-[#6B6B6B] mt-0.5 leading-relaxed">{event.detail}</p>
              )}
              <p className="text-[10px] text-[#9B9B9B] mt-1 font-mono">
                {format(new Date(event.timestamp), "h:mm:ss a")}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
