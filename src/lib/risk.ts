import {
  calculateRisk,
  processTransaction,
  confidenceToLevel,
  type TransactionAnalysisInput,
  type TransactionAnalysisResult,
} from "@/utils/anomalyDetection";
import { emptyBehaviorProfile } from "@/utils/userBehaviorProfile";
import type { UserBehaviorProfile } from "@/types/behavior";

export type {
  RiskStatus,
  ConfidenceLabel,
  TransactionAnalysisInput,
  TransactionAnalysisResult,
} from "@/utils/anomalyDetection";

export {
  calculateRisk,
  processTransaction,
  analyzeTransaction,
  confidenceToLevel,
  DEFAULT_HOME_LOCATION,
  HIGH_AMOUNT_THRESHOLD,
} from "@/utils/anomalyDetection";

export type { UserBehaviorProfile } from "@/types/behavior";
export { buildBehaviorProfile } from "@/utils/userBehaviorProfile";
export { fetchUserBehaviorProfile } from "@/services/behaviorProfileService";

/** @deprecated Use TransactionAnalysisInput */
export interface TxInput {
  amount: number;
  location: string;
  merchant: string;
  payment_method: string;
  profile?: UserBehaviorProfile;
  homeLocation?: string;
}

export interface RiskResult {
  score: number;
  confidence: number;
  confidenceLabel: string;
  reasons: string[];
  status: TransactionAnalysisResult["status"];
  isAnomaly: boolean;
  contributesToProfile: boolean;
}

export function scoreTransaction(tx: TxInput): RiskResult {
  const profile = tx.profile ?? emptyBehaviorProfile();
  if (tx.homeLocation && profile.normalTransactionCount === 0) {
    profile.primaryHomeLocation = tx.homeLocation;
  }

  const analysis = calculateRisk(
    {
      amount: tx.amount,
      type: tx.payment_method,
      location: tx.location,
      homeLocation: tx.homeLocation,
    },
    profile,
  );

  return {
    score: analysis.risk_score,
    confidence: confidenceToLevel(analysis.confidence),
    confidenceLabel: analysis.confidence,
    reasons: analysis.reasons,
    status: analysis.status,
    isAnomaly: analysis.status === "Anomalous",
    contributesToProfile: analysis.contributesToProfile,
  };
}

export function riskBucket(score: number): "low" | "medium" | "high" {
  if (score < 30) return "low";
  if (score < 60) return "medium";
  return "high";
}
