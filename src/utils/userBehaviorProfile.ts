import {
  BEHAVIOR_WINDOW_SIZE,
  TRUSTED_RISK_THRESHOLD,
  type TrustedTransactionSnapshot,
  type UserBehaviorProfile,
} from "@/types/behavior";
import { DEFAULT_HOME_LOCATION, normalizeCity } from "@/utils/anomalyDetection";

export function emptyBehaviorProfile(): UserBehaviorProfile {
  return {
    averageAmount: 0,
    medianAmount: 0,
    trustedStdDeviation: 0,
    normalTransactionCount: 0,
    lastLocations: [],
    commonTransactionTypes: [],
    primaryHomeLocation: DEFAULT_HOME_LOCATION,
  };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function stdDeviation(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function topKeys(map: Map<string, number>, limit: number): string[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);
}

/**
 * Build profile from trusted transactions only (risk score &lt; 30).
 * Uses a sliding window of the most recent trusted rows.
 */
export function buildBehaviorProfile(
  trustedRows: TrustedTransactionSnapshot[],
): UserBehaviorProfile {
  const window = trustedRows.slice(0, BEHAVIOR_WINDOW_SIZE);
  if (window.length === 0) return emptyBehaviorProfile();

  const amounts = window.map((r) => r.amount);
  const averageAmount = amounts.reduce((s, a) => s + a, 0) / amounts.length;
  const medianAmount = median(amounts);
  const trustedStdDeviation = stdDeviation(amounts, averageAmount);

  const locationCounts = new Map<string, number>();
  const typeCounts = new Map<string, number>();
  for (const row of window) {
    locationCounts.set(row.location, (locationCounts.get(row.location) ?? 0) + 1);
    typeCounts.set(row.type, (typeCounts.get(row.type) ?? 0) + 1);
  }

  const lastLocations = topKeys(locationCounts, 8);
  const commonTransactionTypes = topKeys(typeCounts, 5);
  const primaryHomeLocation = lastLocations[0] ?? DEFAULT_HOME_LOCATION;

  return {
    averageAmount,
    medianAmount,
    trustedStdDeviation,
    normalTransactionCount: window.length,
    lastLocations,
    commonTransactionTypes,
    primaryHomeLocation,
  };
}

/**
 * Incremental update when a new transaction is trusted (score &lt; 30).
 * Used for in-memory previews; persisted truth is rebuilt from DB on next create.
 */
export function applyTrustedTransaction(
  profile: UserBehaviorProfile,
  tx: TrustedTransactionSnapshot,
): UserBehaviorProfile {
  const n = profile.normalTransactionCount;
  const newAvg = (profile.averageAmount * n + tx.amount) / (n + 1);

  const amounts = Array.from({ length: n }, () => profile.medianAmount).concat(tx.amount);
  const newMedian = n === 0 ? tx.amount : median(amounts.slice(-BEHAVIOR_WINDOW_SIZE));

  const locationCounts = new Map<string, number>();
  for (const loc of profile.lastLocations) {
    locationCounts.set(loc, (locationCounts.get(loc) ?? 0) + 1);
  }
  locationCounts.set(tx.location, (locationCounts.get(tx.location) ?? 0) + 1);

  const typeCounts = new Map<string, number>();
  for (const t of profile.commonTransactionTypes) {
    typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
  }
  typeCounts.set(tx.type, (typeCounts.get(tx.type) ?? 0) + 1);

  const lastLocations = topKeys(locationCounts, 8);
  const commonTransactionTypes = topKeys(typeCounts, 5);

  return {
    averageAmount: newAvg,
    medianAmount: newMedian,
    trustedStdDeviation: stdDeviation(
      n > 0 ? [profile.averageAmount, tx.amount] : [tx.amount],
      newAvg,
    ),
    normalTransactionCount: Math.min(n + 1, BEHAVIOR_WINDOW_SIZE),
    lastLocations,
    commonTransactionTypes,
    primaryHomeLocation: lastLocations[0] ?? profile.primaryHomeLocation,
  };
}

export function isTrustedRiskScore(riskScore: number): boolean {
  return riskScore < TRUSTED_RISK_THRESHOLD;
}

export function locationInTrustedHistory(
  location: string,
  profile: UserBehaviorProfile,
): boolean {
  const city = normalizeCity(location);
  return profile.lastLocations.some((l) => normalizeCity(l) === city);
}
