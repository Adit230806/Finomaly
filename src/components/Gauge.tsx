import { RadialBar, RadialBarChart, PolarAngleAxis } from "recharts";

export function Gauge({ value, max = 100, color, label }: { value: number; max?: number; color: string; label: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const data = [{ name: "v", value: pct, fill: color }];
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[140px] h-[90px] overflow-hidden">
        <RadialBarChart width={140} height={140} cx={70} cy={70} innerRadius={50} outerRadius={68} barSize={18}
          data={data} startAngle={180} endAngle={0}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={20} background={{ fill: "oklch(0.94 0.005 90)" }} />
        </RadialBarChart>
        <div className="absolute inset-x-0 top-7 flex flex-col items-center">
          <span className="text-2xl font-bold tabular-nums">{value.toLocaleString()}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground mt-2">{label}</span>
    </div>
  );
}
