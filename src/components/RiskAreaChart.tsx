import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export interface RiskPoint {
  month: string;
  normal: number;
  anomaly: number;
}

export function RiskAreaChart({ data }: { data: RiskPoint[] }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="g-normal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.74 0.22 145)" stopOpacity={0.85} />
              <stop offset="100%" stopColor="oklch(0.74 0.22 145)" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="g-anomaly" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.7 0.2 20)" stopOpacity={0.7} />
              <stop offset="100%" stopColor="oklch(0.7 0.2 20)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "oklch(0.7 0 0)", fontSize: 11 }} />
          <YAxis hide />
          <Tooltip contentStyle={{ background: "#111", border: "none", borderRadius: 12, color: "white", fontSize: 12 }} />
          <Area type="monotone" dataKey="normal" stroke="oklch(0.74 0.22 145)" strokeWidth={2} fill="url(#g-normal)" />
          <Area type="monotone" dataKey="anomaly" stroke="oklch(0.7 0.2 20)" strokeWidth={2} fill="url(#g-anomaly)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
