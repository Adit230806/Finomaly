/** Hybrid fraud detection response from FastAPI ML service */

export type MLConfidence = "Low" | "Medium" | "High";
export type MLRiskStatus = "Normal" | "Suspicious" | "Anomalous";

export interface MLPredictRequest {
  user_id: string;
  amount: number;
  payment_method: string;
  location: string;
  merchant?: string;
  category?: string;
  timestamp?: string;
  ip_address?: string;
  device_fingerprint?: string;
  failed_login_attempts?: number;
  home_location?: string;
  trusted_transactions: TrustedTransactionRef[];
}

export interface TrustedTransactionRef {
  amount: number;
  location: string;
  payment_method: string;
  device_fingerprint?: string;
  ip_address?: string;
  created_at?: string;
  risk_score?: number;
}

export interface MLPredictResponse {
  isAnomaly: boolean;
  mlScore: number;
  ruleScore: number;
  finalScore: number;
  confidence: MLConfidence;
  reasons: string[];
  status: MLRiskStatus;
  contributesToProfile: boolean;
}

export interface HybridRiskResult {
  risk_score: number;
  rule_score: number;
  ml_score: number;
  final_score: number;
  status: MLRiskStatus;
  confidence: string;
  confidenceLevel: number;
  reasons: string[];
  isAnomaly: boolean;
  contributesToProfile: boolean;
  detectionMethod: "hybrid" | "rules_fallback";
}
