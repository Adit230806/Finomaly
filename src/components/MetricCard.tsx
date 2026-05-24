import { ArrowUpRight } from "lucide-react";

export function MetricCard({ label, value, subtitle }: { label: string; value: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center justify-between gap-3">
        <span className="text-4xl font-bold tracking-tight">{value}</span>
        <button className="h-10 w-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-accent shrink-0">
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
      <span className="text-xs text-muted-foreground">{subtitle}</span>
    </div>
  );
}
