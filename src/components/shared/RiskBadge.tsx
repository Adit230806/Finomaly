import { cn } from "@/lib/utils";

interface Props { score: number; size?: "sm" | "md" | "lg"; }

export function RiskBadge({ score, size = "md" }: Props) {
  const level = score <= 30 ? "low" : score <= 70 ? "medium" : "high";
  const colors = {
    low:    "bg-[#E8F9EF] text-[#00A844] border-[#B8EDD0]",
    medium: "bg-[#FFF4E5] text-[#CC7700] border-[#FFD9A0]",
    high:   "bg-[#FFF0EE] text-[#CC2200] border-[#FFBDB8]",
  };
  const sizes = { sm: "px-2 py-0.5 text-[10px]", md: "px-2.5 py-1 text-xs", lg: "px-3 py-1.5 text-sm" };
  return (
    <span className={cn("inline-flex items-center font-semibold rounded-lg border", colors[level], sizes[size])}>
      {score}
    </span>
  );
}
