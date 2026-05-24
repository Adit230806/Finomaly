import type { Transaction } from "@/types/transaction";

export interface FraudMetrics {
  fraudRate: number;
  avgRisk: number;
  totalTransactions: number;
  fraudCount: number;
}

export interface MerchantRiskRow {
  merchant: string;
  count: number;
  avgRisk: number;
  fraudCount: number;
}

export interface HourlyFraudRow {
  hour: number;
  count: number;
  fraudCount: number;
  avgRisk: number;
}

export interface DailyRiskTrendRow {
  date: string;
  avgRisk: number;
  fraudCount: number;
  count: number;
}

export function computeFraudMetrics(transactions: Transaction[]): FraudMetrics {
  const total = transactions.length;
  const fraudCount = transactions.filter((t) => t.isAnomaly).length;
  const avgRisk =
    total > 0
      ? Math.round(transactions.reduce((s, t) => s + t.riskScore, 0) / total)
      : 0;
  return {
    totalTransactions: total,
    fraudCount,
    fraudRate: total > 0 ? fraudCount / total : 0,
    avgRisk,
  };
}

export function computeHighRiskMerchants(
  transactions: Transaction[],
  limit = 8,
): MerchantRiskRow[] {
  const map: Record<string, { count: number; totalRisk: number; fraudCount: number }> =
    {};
  for (const tx of transactions) {
    if (!map[tx.merchant]) {
      map[tx.merchant] = { count: 0, totalRisk: 0, fraudCount: 0 };
    }
    map[tx.merchant].count++;
    map[tx.merchant].totalRisk += tx.riskScore;
    if (tx.isAnomaly) map[tx.merchant].fraudCount++;
  }
  return Object.entries(map)
    .map(([merchant, v]) => ({
      merchant,
      count: v.count,
      avgRisk: Math.round(v.totalRisk / v.count),
      fraudCount: v.fraudCount,
    }))
    .filter((m) => m.avgRisk >= 50 || m.fraudCount > 0)
    .sort((a, b) => b.avgRisk - a.avgRisk || b.fraudCount - a.fraudCount)
    .slice(0, limit);
}

export function computeFraudByHour(transactions: Transaction[]): HourlyFraudRow[] {
  const buckets = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: 0,
    fraudCount: 0,
    totalRisk: 0,
  }));
  for (const tx of transactions) {
    const h = new Date(tx.timestamp).getHours();
    buckets[h].count++;
    buckets[h].totalRisk += tx.riskScore;
    if (tx.isAnomaly) buckets[h].fraudCount++;
  }
  return buckets.map((b) => ({
    hour: b.hour,
    count: b.count,
    fraudCount: b.fraudCount,
    avgRisk: b.count > 0 ? Math.round(b.totalRisk / b.count) : 0,
  }));
}

export function computeRiskTrend(
  transactions: Transaction[],
  days = 7,
): DailyRiskTrendRow[] {
  const buckets: Record<string, { date: string; count: number; fraudCount: number; totalRisk: number }> =
    {};
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    buckets[key] = { date: key, count: 0, fraudCount: 0, totalRisk: 0 };
  }
  for (const tx of transactions) {
    const key = new Date(tx.timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (!buckets[key]) continue;
    buckets[key].count++;
    buckets[key].totalRisk += tx.riskScore;
    if (tx.isAnomaly) buckets[key].fraudCount++;
  }
  return Object.values(buckets).map((b) => ({
    date: b.date,
    count: b.count,
    fraudCount: b.fraudCount,
    avgRisk: b.count > 0 ? Math.round(b.totalRisk / b.count) : 0,
  }));
}
