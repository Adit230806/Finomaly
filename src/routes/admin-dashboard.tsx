import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { AdminRoute } from "@/components/AdminRoute";
import { StatCard } from "@/components/shared/StatCard";
import { ChartCard } from "@/components/shared/ChartCard";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { ExplainabilityDrawer } from "@/components/shared/ExplainabilityDrawer";
import { LiveMonitoringPanel } from "@/components/dashboard/LiveMonitoringPanel";
import { useTransactions } from "@/hooks/use-transactions";
import { useAlerts } from "@/hooks/use-alerts";
import { useAuth } from "@/hooks/use-auth";
import { DAY_LABELS } from "@/data/mockData";
import type { Transaction } from "@/types/transaction";
import {
  computeFraudMetrics,
  computeHighRiskMerchants,
  computeFraudByHour,
  computeRiskTrend,
} from "@/lib/analytics";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";
import {
  ArrowLeftRight, Shield, Bell, AlertTriangle,
  IndianRupee, Activity, TrendingUp, Radar,
} from "lucide-react";
import { formatINR } from "@/lib/currency";
import { format, subDays, formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/admin-dashboard")({ component: AdminDashboardPage });

const TIME_FILTERS = ["7D", "30D", "90D"] as const;
type TF = (typeof TIME_FILTERS)[number];

const CATEGORY_COLORS: Record<string, string> = {
  Shopping: "#00C853", Food: "#FF9500", Entertainment: "#5AC8FA",
  Transfer: "#AF52DE", ATM: "#FF3B30", Travel: "#007AFF",
};
const PIE_COLORS = ["#00C853", "#FF9500", "#007AFF", "#FF3B30", "#AF52DE", "#5AC8FA"];

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="h-10 w-10 rounded-2xl bg-[#F0EFEA] flex items-center justify-center mb-3">
        <Activity size={18} className="text-[#6B6B6B]" />
      </div>
      <p className="text-xs text-[#6B6B6B]">{message}</p>
    </div>
  );
}

function HeatmapCell({ avgRisk }: { avgRisk: number }) {
  const r = avgRisk >= 70 ? 255 : avgRisk >= 30 ? 255 : 0;
  const g = avgRisk >= 70 ? 59 : avgRisk >= 30 ? 149 : 200;
  const b = avgRisk >= 70 ? 48 : avgRisk >= 30 ? 0 : 83;
  const alpha = avgRisk / 100;
  return (
    <div
      className="rounded-sm cursor-default transition-transform hover:scale-110"
      style={{ backgroundColor: `rgba(${r},${g},${b},${0.15 + alpha * 0.7})`, width: "100%", height: "100%" }}
      title={`Avg Risk: ${avgRisk}`}
    />
  );
}

function AdminDashboardPage() {
  const { currentUser } = useAuth();
  const { transactions, loading } = useTransactions();
  const { alerts, changeStatus } = useAlerts();
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [tf, setTf] = useState<TF>("30D");

  const days = tf === "7D" ? 7 : tf === "30D" ? 30 : 90;

  const anomalies = useMemo(() => transactions.filter((t) => t.isAnomaly).length, [transactions]);
  const fraudMetrics = useMemo(() => computeFraudMetrics(transactions), [transactions]);
  const avgRisk = fraudMetrics.avgRisk;
  const newAlerts = useMemo(() => alerts.filter((a) => a.status === "New").length, [alerts]);
  const highAlerts = useMemo(() => alerts.filter((a) => a.severity === "high").length, [alerts]);
  const totalAmt = useMemo(() => transactions.reduce((s, t) => s + t.amount, 0), [transactions]);
  const peakRisk = useMemo(
    () => (transactions.length ? Math.max(...transactions.map((t) => t.riskScore)) : 0),
    [transactions],
  );
  const highRiskMerchants = useMemo(
    () => computeHighRiskMerchants(transactions),
    [transactions],
  );
  const fraudByHour = useMemo(() => computeFraudByHour(transactions), [transactions]);
  const riskTrend7d = useMemo(() => computeRiskTrend(transactions, 7), [transactions]);

  const volData = useMemo(() => {
    const buckets: Record<string, { date: string; count: number; anomalies: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "MMM d");
      buckets[d] = { date: d, count: 0, anomalies: 0 };
    }
    transactions.forEach((tx) => {
      const d = format(new Date(tx.timestamp), "MMM d");
      if (buckets[d]) {
        buckets[d].count++;
        if (tx.isAnomaly) buckets[d].anomalies++;
      }
    });
    return Object.values(buckets);
  }, [transactions, days]);

  const riskData = useMemo(() => {
    const buckets: Record<string, { date: string; avgRisk: number; total: number; anomalyCount: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "MMM d");
      buckets[d] = { date: d, avgRisk: 0, total: 0, anomalyCount: 0 };
    }
    transactions.forEach((tx) => {
      const d = format(new Date(tx.timestamp), "MMM d");
      if (buckets[d]) {
        buckets[d].total++;
        buckets[d].avgRisk += tx.riskScore;
        if (tx.isAnomaly) buckets[d].anomalyCount++;
      }
    });
    return Object.values(buckets).map((b) => ({
      date: b.date,
      avgRisk: b.total > 0 ? Math.round(b.avgRisk / b.total) : 0,
      anomalyCount: b.anomalyCount,
    }));
  }, [transactions, days]);

  const categoryData = useMemo(() => {
    const map: Record<string, { category: string; count: number; amount: number }> = {};
    transactions.forEach((tx) => {
      if (!map[tx.category]) map[tx.category] = { category: tx.category, count: 0, amount: 0 };
      map[tx.category].count++;
      map[tx.category].amount += tx.amount;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [transactions]);

  const spendByCategory = useMemo(() => {
    const map: Record<string, { category: string; amount: number }> = {};
    transactions.forEach((tx) => {
      if (!map[tx.category]) map[tx.category] = { category: tx.category, amount: 0 };
      map[tx.category].amount += tx.amount;
    });
    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const merchantData = useMemo(() => {
    const map: Record<string, { merchant: string; count: number }> = {};
    transactions.forEach((tx) => {
      if (!map[tx.merchant]) map[tx.merchant] = { merchant: tx.merchant, count: 0 };
      map[tx.merchant].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [transactions]);

  const hourlyData = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
    transactions.forEach((tx) => {
      buckets[new Date(tx.timestamp).getHours()].count++;
    });
    return buckets;
  }, [transactions]);

  const heatmap = useMemo(() => {
    const grid: Record<string, { total: number; count: number }> = {};
    transactions.forEach((tx) => {
      const d = new Date(tx.timestamp);
      const key = `${d.getDay()}-${d.getHours()}`;
      if (!grid[key]) grid[key] = { total: 0, count: 0 };
      grid[key].total += tx.riskScore;
      grid[key].count++;
    });
    const result: { day: number; hour: number; avgRisk: number }[] = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${day}-${hour}`;
        result.push({ day, hour, avgRisk: grid[key] ? Math.round(grid[key].total / grid[key].count) : 0 });
      }
    }
    return result;
  }, [transactions]);

  const riskPie = useMemo(() => {
    const low = transactions.filter((t) => t.riskScore <= 30).length;
    const medium = transactions.filter((t) => t.riskScore > 30 && t.riskScore <= 70).length;
    const high = transactions.filter((t) => t.riskScore > 70).length;
    return [
      { name: "Low", value: low, pct: transactions.length ? ((low / transactions.length) * 100).toFixed(0) : "0" },
      { name: "Medium", value: medium, pct: transactions.length ? ((medium / transactions.length) * 100).toFixed(0) : "0" },
      { name: "High", value: high, pct: transactions.length ? ((high / transactions.length) * 100).toFixed(0) : "0" },
    ];
  }, [transactions]);

  const tfPills = (
    <div className="flex gap-1">
      {TIME_FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => setTf(f)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            tf === f ? "bg-[#0A0A0A] text-white" : "bg-[#F0EFEA] text-[#6B6B6B] hover:bg-[#E8E6E0]"
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );

  return (
    <AdminRoute>
      <AppLayout>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Radar size={14} className="text-[#7C3AED]" />
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F3EEFF] text-[#7C3AED]">
                Fraud Command Center
              </span>
            </div>
            <h1 className="text-3xl font-bold text-[#0A0A0A]">Fraud Analysis Hub</h1>
            <p className="text-[#6B6B6B] text-sm mt-1">
              Monitoring for{" "}
              <span className="font-medium text-[#0A0A0A]">{currentUser?.email}</span>
              {" "}· your account data only
            </p>
          </div>
          {tfPills}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            delay={0}
            iconBg="bg-[#E8F9EF]"
            icon={<ArrowLeftRight size={18} className="text-[#00C853]" />}
            label="Total Transactions"
            value={transactions.length}
            sub={`${anomalies} anomalies`}
          />
          <StatCard
            delay={0.05}
            iconBg="bg-[#E8F0FF]"
            icon={<IndianRupee size={18} className="text-[#007AFF]" />}
            label="Total Amount"
            value={formatINR(totalAmt, 0)}
            sub="All simulations"
          />
          <StatCard
            delay={0.1}
            iconBg="bg-[#FFF4E5]"
            icon={<Shield size={18} className="text-[#FF9500]" />}
            label="Avg Risk Score"
            value={avgRisk}
            sub={
              <div className="mt-1 h-1.5 w-full bg-[#E8E6E0] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#00C853] to-[#FF3B30]" style={{ width: `${avgRisk}%` }} />
              </div>
            }
          />
          <StatCard
            delay={0.15}
            iconBg="bg-[#FFF0EE]"
            icon={<Bell size={18} className="text-[#FF3B30]" />}
            label="Active Alerts"
            value={newAlerts}
            sub={`${highAlerts} high severity`}
          />
          <StatCard
            delay={0.2}
            iconBg="bg-[#F3EEFF]"
            icon={<TrendingUp size={18} className="text-[#7C3AED]" />}
            label="Fraud Rate"
            value={`${(fraudMetrics.fraudRate * 100).toFixed(1)}%`}
            sub={`${fraudMetrics.fraudCount} / ${fraudMetrics.totalTransactions} flagged · peak ${peakRisk}`}
          />
        </div>

        {/* Live monitoring */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#0A0A0A]">Live Monitoring</h2>
            <Link to="/live-feed" className="text-xs text-[#00C853] font-medium hover:underline">
              Full feed →
            </Link>
          </div>
          <LiveMonitoringPanel
            transactions={transactions}
            alerts={alerts}
            txLoading={loading}
            alLoading={loading}
            onSelectTransaction={setSelected}
          />
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <ChartCard title="Transaction Volume" delay={0.1} headerRight={tfPills}>
            {volData.every((d) => d.count === 0) ? (
              <EmptyState message="No transaction data — run simulations from user dashboard" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={volData}>
                  <defs>
                    <linearGradient id="aVolGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00C853" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00C853" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6B6B6B" }} interval={Math.floor(days / 6)} />
                  <YAxis tick={{ fontSize: 10, fill: "#6B6B6B" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E8E6E0", fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" name="Transactions" stroke="#00C853" strokeWidth={2} fill="url(#aVolGrad)" />
                  <Area type="monotone" dataKey="anomalies" name="Anomalies" stroke="#FF3B30" strokeWidth={1.5} fill="none" strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Fraud Risk Trend" dark delay={0.15} headerRight={tfPills}>
            <div className="flex gap-6 mb-4">
              {[["Avg Score", avgRisk], ["Peak", peakRisk], ["Anomalies", anomalies]].map(([l, v]) => (
                <div key={String(l)}>
                  <p className="text-xl font-bold text-white">{v}</p>
                  <p className="text-xs text-white/50">{l}</p>
                </div>
              ))}
            </div>
            {riskData.every((d) => d.avgRisk === 0) ? (
              <div className="flex items-center justify-center h-[200px] text-white/40 text-sm">No risk data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={riskData}>
                  <defs>
                    <linearGradient id="aNormGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00C853" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00C853" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="aAnomGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF3B30" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#FF3B30" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#ffffff60" }} interval={Math.floor(days / 5)} />
                  <YAxis tick={{ fontSize: 9, fill: "#ffffff60" }} />
                  <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 10, fontSize: 11, color: "#fff" }} />
                  <Area type="monotone" dataKey="avgRisk" name="Avg Risk" stroke="#00C853" strokeWidth={2} fill="url(#aNormGrad)" />
                  <Area type="monotone" dataKey="anomalyCount" name="Anomalies" stroke="#FF3B30" strokeWidth={2} fill="url(#aAnomGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <ChartCard title="Risk Breakdown" delay={0.1}>
            {transactions.length === 0 ? (
              <EmptyState message="No transactions to analyze" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={riskPie} dataKey="value" innerRadius={50} outerRadius={75} paddingAngle={3}>
                      <Cell fill="#00C853" />
                      <Cell fill="#FF9500" />
                      <Cell fill="#FF3B30" />
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {riskPie.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: ["#00C853", "#FF9500", "#FF3B30"][i] }} />
                      <span className="text-[#6B6B6B]">{item.name}</span>
                      <span className="font-semibold">{item.pct}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </ChartCard>

          <ChartCard title="Category Analysis" delay={0.15}>
            {categoryData.length === 0 ? (
              <EmptyState message="No category data yet" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#6B6B6B" }} allowDecimals={false} />
                  <YAxis dataKey="category" type="category" tick={{ fontSize: 10, fill: "#6B6B6B" }} width={80} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="count" name="Transactions" radius={[0, 6, 6, 0]}>
                    {categoryData.map((entry) => (
                      <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] ?? "#00C853"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard
            title="Suspicious Transactions"
            delay={0.2}
            headerRight={<span className="text-xs font-semibold text-[#FF3B30]">{anomalies} flagged</span>}
          >
            {anomalies === 0 ? (
              <EmptyState message="No anomalies detected" />
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {transactions
                  .filter((t) => t.isAnomaly)
                  .slice(0, 6)
                  .map((tx) => (
                    <div
                      key={tx.id}
                      onClick={() => setSelected(tx)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#FFF0EE] cursor-pointer transition-colors border-l-4 border-[#FF3B30]"
                    >
                      <div className="h-7 w-7 rounded-lg bg-[#FFF0EE] flex items-center justify-center text-xs font-bold text-[#FF3B30] flex-shrink-0">
                        {tx.merchant[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#0A0A0A] truncate">{tx.merchant}</p>
                        <p className="text-[10px] text-[#6B6B6B]">
                          {formatINR(tx.amount, 0)} · {tx.location}
                        </p>
                      </div>
                      <RiskBadge score={tx.riskScore} size="sm" />
                    </div>
                  ))}
              </div>
            )}
          </ChartCard>
        </div>

        {/* Derived fraud analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <ChartCard title="Risk Trend (Last 7 Days)" delay={0.1}>
            {riskTrend7d.every((d) => d.count === 0) ? (
              <EmptyState message="No transactions in the last 7 days" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={riskTrend7d}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6B6B6B" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#6B6B6B" }} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Area type="monotone" dataKey="avgRisk" name="Avg Risk" stroke="#7C3AED" fill="#7C3AED22" strokeWidth={2} />
                  <Area type="monotone" dataKey="fraudCount" name="Fraud Count" stroke="#FF3B30" fill="none" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Fraud by Hour" delay={0.12}>
            {fraudByHour.every((d) => d.count === 0) ? (
              <EmptyState message="No hourly fraud data" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={fraudByHour}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#6B6B6B" }} tickFormatter={(h) => `${h}h`} />
                  <YAxis tick={{ fontSize: 9, fill: "#6B6B6B" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="fraudCount" name="Fraud" fill="#FF3B30" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="count" name="Total" fill="#E8E6E0" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <ChartCard title="High-Risk Merchants" delay={0.14} className="mb-5">
          {highRiskMerchants.length === 0 ? (
            <EmptyState message="No elevated merchant risk yet" />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180, highRiskMerchants.length * 36)}>
              <BarChart data={highRiskMerchants} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#6B6B6B" }} />
                <YAxis dataKey="merchant" type="category" width={100} tick={{ fontSize: 9, fill: "#6B6B6B" }} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="avgRisk" name="Avg Risk" fill="#FF9500" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Advanced analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
          <ChartCard title="Spending by Category" delay={0.1}>
            {spendByCategory.length === 0 ? (
              <EmptyState message="No spending data" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={spendByCategory} dataKey="amount" nameKey="category" innerRadius={50} outerRadius={75} paddingAngle={3}>
                      {spendByCategory.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [formatINR(v, 0), ""]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
          </ChartCard>

          <ChartCard title="Merchant Frequency" delay={0.15}>
            {merchantData.length === 0 ? (
              <EmptyState message="No merchant data" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={merchantData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#6B6B6B" }} allowDecimals={false} />
                  <YAxis dataKey="merchant" type="category" tick={{ fontSize: 9, fill: "#6B6B6B" }} width={90} />
                  <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#00C853" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Activity by Hour" delay={0.2}>
            {hourlyData.every((d) => d.count === 0) ? (
              <EmptyState message="No hourly activity" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEA" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#6B6B6B" }} tickFormatter={(h) => `${h}h`} />
                    <YAxis tick={{ fontSize: 9, fill: "#6B6B6B" }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} labelFormatter={(h) => `${h}:00`} />
                    <ReferenceLine x={1} stroke="#FF3B30" strokeDasharray="3 3" />
                    <ReferenceLine x={5} stroke="#FF3B30" strokeDasharray="3 3" />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                      {hourlyData.map((d) => (
                        <Cell key={d.hour} fill={d.hour >= 1 && d.hour <= 5 ? "#FF3B30" : "#00C853"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-[10px] text-[#6B6B6B] mt-1">Red = unusual hours (1AM–5AM)</p>
              </>
            )}
          </ChartCard>
        </div>

        {/* Heatmap */}
        <ChartCard
          title="Risk Activity Heatmap"
          delay={0.25}
          className="mb-5"
          headerRight={<p className="text-xs text-[#6B6B6B]">7 days × 24h · your account</p>}
        >
          {heatmap.every((c) => c.avgRisk === 0) ? (
            <EmptyState message="No activity pattern data yet" />
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="flex mb-1 ml-10">
                  {Array.from({ length: 24 }, (_, h) => (
                    <div key={h} className="flex-1 text-center text-[9px] text-[#6B6B6B]">
                      {h % 4 === 0 ? `${h}h` : ""}
                    </div>
                  ))}
                </div>
                {Array.from({ length: 7 }, (_, day) => (
                  <div key={day} className="flex items-center gap-1 mb-1">
                    <span className="text-[10px] text-[#6B6B6B] w-9 text-right pr-1 flex-shrink-0">{DAY_LABELS[day]}</span>
                    {Array.from({ length: 24 }, (_, hour) => {
                      const cell = heatmap.find((c) => c.day === day && c.hour === hour);
                      return (
                        <div key={hour} className="flex-1 h-6">
                          <HeatmapCell avgRisk={cell?.avgRisk ?? 0} />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        {/* Recent + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard
            title="Recent Transactions"
            delay={0.2}
            headerRight={
              <Link to="/transactions" className="text-xs text-[#00C853] font-medium hover:underline">
                View all →
              </Link>
            }
          >
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-7 w-7 rounded-full border-4 border-[#00C853] border-t-transparent animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <EmptyState message="No transactions yet" />
            ) : (
              <div className="space-y-1">
                {transactions.slice(0, 6).map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => setSelected(tx)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-[#F8F7F4] transition-colors border-l-4 ${
                      tx.isAnomaly ? "border-[#FF3B30]" : "border-[#00C853]"
                    }`}
                  >
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        tx.isAnomaly ? "bg-[#FFF0EE] text-[#FF3B30]" : "bg-[#E8F9EF] text-[#00A844]"
                      }`}
                    >
                      {tx.merchant[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0A0A0A] truncate">{tx.merchant}</p>
                      <p className="text-xs text-[#6B6B6B]">
                        {tx.location} · {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold">{formatINR(tx.amount, 0)}</p>
                      <RiskBadge score={tx.riskScore} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>

          <ChartCard
            title="Alert Management"
            delay={0.25}
            headerRight={
              <Link to="/alerts" className="text-xs text-[#00C853] font-medium hover:underline">
                Manage all →
              </Link>
            }
          >
            {alerts.length === 0 ? (
              <EmptyState message="High risk transactions will generate alerts" />
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 5).map((a) => (
                  <motion.div
                    key={a.id}
                    layout
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#F8F7F4] transition-colors"
                  >
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        a.severity === "high" ? "bg-[#FFF0EE]" : a.severity === "medium" ? "bg-[#FFF4E5]" : "bg-[#E8F9EF]"
                      }`}
                    >
                      <AlertTriangle
                        size={14}
                        className={
                          a.severity === "high" ? "text-[#FF3B30]" : a.severity === "medium" ? "text-[#FF9500]" : "text-[#00C853]"
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#0A0A0A] line-clamp-1">{a.reason}</p>
                      <p className="text-[10px] text-[#6B6B6B] mt-0.5">
                        {formatINR(a.amount, 0)} · {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <RiskBadge score={a.riskScore} size="sm" />
                      {a.status === "New" && (
                        <button
                          onClick={() => changeStatus(a.id, "Under Review")}
                          className="text-[10px] text-[#FF9500] font-medium hover:underline whitespace-nowrap"
                        >
                          Review →
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ChartCard>
        </div>

        <ExplainabilityDrawer
          transaction={selected}
          onClose={() => setSelected(null)}
          hasAlert={
            selected ? alerts.some((a) => a.transactionId === selected.id) : false
          }
        />
      </AppLayout>
    </AdminRoute>
  );
}
