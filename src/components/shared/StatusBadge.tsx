import { cn } from "@/lib/utils";
import type { AlertStatus, TxStatus } from "@/data/mockData";

type Status = AlertStatus | TxStatus | string;

const MAP: Record<string, string> = {
  Normal:         "bg-[#E8F9EF] text-[#00A844] border-[#B8EDD0]",
  Suspicious:     "bg-[#FFF4E5] text-[#CC7700] border-[#FFD9A0]",
  Anomalous:      "bg-[#FFF0EE] text-[#CC2200] border-[#FFBDB8]",
  Anomaly:        "bg-[#FFF0EE] text-[#CC2200] border-[#FFBDB8]",
  New:            "bg-[#EEF4FF] text-[#2255CC] border-[#C0D0FF]",
  "Under Review": "bg-[#FFF4E5] text-[#CC7700] border-[#FFD9A0]",
  Confirmed:      "bg-[#FFF0EE] text-[#CC2200] border-[#FFBDB8]",
  Ignored:        "bg-[#F5F5F5] text-[#888888] border-[#E0E0E0]",
};

interface Props { status: Status; size?: "sm" | "md"; }

export function StatusBadge({ status, size = "md" }: Props) {
  const cls = MAP[status] ?? "bg-gray-100 text-gray-600 border-gray-200";
  const sz  = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  return (
    <span className={cn("inline-flex items-center font-semibold rounded-lg border", cls, sz)}>
      {status}
    </span>
  );
}
