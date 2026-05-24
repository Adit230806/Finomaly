import type { UserBehaviorProfile } from "@/types/behavior";
import { TRUSTED_RISK_THRESHOLD } from "@/types/behavior";
import {
  applyTrustedTransaction,
  emptyBehaviorProfile,
  locationInTrustedHistory,
} from "@/utils/userBehaviorProfile";

export const HIGH_AMOUNT_THRESHOLD = 20_000;
export const DEFAULT_HOME_LOCATION = "Pune, MH";

export type RiskStatus = "Normal" | "Suspicious" | "Anomalous";
export type ConfidenceLabel = "Low Risk" | "Medium Risk" | "High Risk";

export interface TransactionAnalysisInput {
  amount: number;
  type: string;
  location: string;
  homeLocation?: string;
}

export interface TransactionAnalysisResult {
  risk_score: number;
  status: RiskStatus;
  reasons: string[];
  confidence: ConfidenceLabel;
  /** False when flagged — must not update behavioral learning */
  contributesToProfile: boolean;
}

export function normalizeCity(location: string): string {
  return location.split(",")[0].trim().toLowerCase();
}

export function isHomeLocation(location: string, home: string): boolean {
  return normalizeCity(location) === normalizeCity(home);
}

export function confidenceToLevel(label: ConfidenceLabel): number {
  if (label === "High Risk") return 90;
  if (label === "Medium Risk") return 60;
  return 30;
}

function finalizeScore(riskScore: number, reasons: string[]): TransactionAnalysisResult {
  const score = Math.min(100, Math.max(0, riskScore));
  let status: RiskStatus = "Normal";
  if (score >= 60) status = "Anomalous";
  else if (score >= 30) status = "Suspicious";

  const confidence: ConfidenceLabel =
    score >= 60 ? "High Risk" : score >= 30 ? "Medium Risk" : "Low Risk";

  return {
    risk_score: score,
    status,
    reasons: reasons.length ? reasons : ["Matches trusted spending behavior"],
    confidence,
    contributesToProfile: score < TRUSTED_RISK_THRESHOLD,
  };
}

/**
 * Compare a new transaction against the user's trusted behavioral profile.
 */
export function calculateRisk(
  transaction: TransactionAnalysisInput,
  profile: UserBehaviorProfile,
): TransactionAnalysisResult {
  let riskScore = 0;
  const reasons: string[] = [];
  const home =
    profile.primaryHomeLocation ||
    transaction.homeLocation ||
    DEFAULT_HOME_LOCATION;

  if (transaction.amount > HIGH_AMOUNT_THRESHOLD) {
    riskScore += 60;
    reasons.push("Large transaction amount");
  }

  if (profile.normalTransactionCount === 0) {
    if (!isHomeLocation(transaction.location, home)) {
      riskScore += 40;
      reasons.push("Unusual location detected (no trusted history yet)");
    }
    if (transaction.type === "Crypto") {
      riskScore += 25;
      reasons.push("High-risk payment type (Crypto)");
    } else if (transaction.type === "Bank Transfer" && transaction.amount > 25_000) {
      riskScore += 20;
      reasons.push("Large bank transfer");
    }
    return finalizeScore(riskScore, reasons);
  }

  const dynamicCap = Math.max(
    profile.averageAmount * 2,
    profile.medianAmount * 2,
    profile.averageAmount + profile.trustedStdDeviation * 2,
  );

  if (transaction.amount > dynamicCap) {
    riskScore += 40;
    reasons.push(
      `Amount exceeds trusted pattern (median ₹${Math.round(profile.medianAmount)}, avg ₹${Math.round(profile.averageAmount)})`,
    );
  }

  if (
    profile.normalTransactionCount >= 2 &&
    !locationInTrustedHistory(transaction.location, profile)
  ) {
    riskScore += 40;
    reasons.push("Location not seen in trusted transaction history");
  }

  if (
    profile.normalTransactionCount >= 3 &&
    !profile.commonTransactionTypes.includes(transaction.type)
  ) {
    riskScore += 20;
    reasons.push(`Unusual payment type (${transaction.type})`);
  }

  if (transaction.type === "Crypto") {
    riskScore += 25;
    reasons.push("High-risk payment type (Crypto)");
  } else if (transaction.type === "Bank Transfer" && transaction.amount > 25_000) {
    riskScore += 20;
    reasons.push("Large bank transfer");
  }

  return finalizeScore(riskScore, reasons);
}

export interface ProcessTransactionResult extends TransactionAnalysisResult {
  profile: UserBehaviorProfile;
}

/**
 * Score transaction vs trusted profile; update profile only if score &lt; 30.
 */
export function processTransaction(
  transaction: TransactionAnalysisInput,
  profile: UserBehaviorProfile,
): ProcessTransactionResult {
  const analysis = calculateRisk(transaction, profile);

  let nextProfile = profile;
  if (analysis.contributesToProfile) {
    nextProfile = applyTrustedTransaction(profile, {
      amount: transaction.amount,
      type: transaction.type,
      location: transaction.location,
    });
  }

  return {
    ...analysis,
    profile: nextProfile,
  };
}

/** Fallback when no trusted history exists yet */
export function analyzeTransaction(
  transaction: TransactionAnalysisInput,
): TransactionAnalysisResult {
  const profile = emptyBehaviorProfile();
  if (transaction.homeLocation) {
    profile.primaryHomeLocation = transaction.homeLocation;
  }
  return calculateRisk(transaction, profile);
}
