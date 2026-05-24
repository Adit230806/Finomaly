import { formatINR, HIGH_VALUE_INR } from "@/lib/currency";

export interface TxInput {
  amount: number;
  location: string;
  merchant: string;
  payment_method: string;
  hour?: number;
  userAvg?: number;
  knownLocations?: string[];
}

export interface RiskResult {
  score: number;
  confidence: number;
  reasons: string[];
  isAnomaly: boolean;
}

export function scoreTransaction(tx: TxInput): RiskResult {
  const reasons: string[] = [];
  let score = 10;
  const hour = tx.hour ?? new Date().getHours();
  const avg = tx.userAvg ?? 0;

  if (avg > 0 && tx.amount > 2 * avg) {
    score += 40;
    reasons.push(
      `Transaction above user average (${formatINR(tx.amount)} vs avg ${formatINR(avg)}).`,
    );
  }
  if (
    tx.knownLocations &&
    tx.knownLocations.length > 0 &&
    !tx.knownLocations.includes(tx.location)
  ) {
    score += 25;
    reasons.push(`Unknown location — "${tx.location}" not seen before for this user.`);
  }
  if (hour >= 1 && hour <= 5) {
    score += 15;
    reasons.push(`Unusual hour — transaction at ${hour}:00.`);
  }
  if (tx.amount > HIGH_VALUE_INR) {
    score += 10;
    reasons.push(`High-value transaction over ${formatINR(HIGH_VALUE_INR, 0)}.`);
  }
  if (reasons.length === 0) {
    reasons.push("No risk signals detected — transaction looks normal.");
  }
  score = Math.max(0, Math.min(100, score));
  const confidence = Math.min(99, 60 + reasons.length * 8);
  return { score, confidence, reasons, isAnomaly: score > 50 };
}

export function riskBucket(score: number): "low" | "medium" | "high" {
  if (score <= 30) return "low";
  if (score <= 70) return "medium";
  return "high";
}
