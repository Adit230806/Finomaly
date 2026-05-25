import type {
  HybridRiskResult,
  MLPredictRequest,
  MLPredictResponse,
  TrustedTransactionRef,
} from "@/types/risk";
import { processTransaction } from "@/utils/anomalyDetection";
import type { UserBehaviorProfile } from "@/types/behavior";
import { buildBehaviorProfile } from "@/utils/userBehaviorProfile";

const ML_API_URL = import.meta.env.VITE_ML_API_URL ?? "http://localhost:8000";
const ML_API_KEY = import.meta.env.VITE_ML_API_KEY ?? "dev-key-change-me";

export function isMLApiConfigured(): boolean {
  return Boolean(import.meta.env.VITE_ML_API_URL);
}

function mlConfidenceToLabel(c: MLPredictResponse["confidence"]): string {
  if (c === "High") return "High Risk";
  if (c === "Medium") return "Medium Risk";
  return "Low Risk";
}

function mlConfidenceToLevel(c: MLPredictResponse["confidence"]): number {
  if (c === "High") return 90;
  if (c === "Medium") return 60;
  return 30;
}

/**
 * Call FastAPI hybrid engine (rules 40% + Isolation Forest 60%).
 * Falls back to local rule-only scoring if API is unreachable.
 */
export async function scoreTransactionHybrid(params: {
  userId: string;
  amount: number;
  paymentMethod: string;
  location: string;
  merchant?: string;
  category?: string;
  ipAddress?: string;
  deviceFingerprint?: string;
  failedLoginAttempts?: number;
  homeLocation?: string;
  trustedProfile: UserBehaviorProfile;
  trustedRows: TrustedTransactionRef[];
}): Promise<HybridRiskResult> {
  const body: MLPredictRequest = {
    user_id: params.userId,
    amount: params.amount,
    payment_method: params.paymentMethod,
    location: params.location,
    merchant: params.merchant,
    category: params.category,
    timestamp: new Date().toISOString(),
    ip_address: params.ipAddress ?? "client",
    device_fingerprint: params.deviceFingerprint ?? "unknown",
    failed_login_attempts: params.failedLoginAttempts ?? 0,
    home_location: params.homeLocation ?? params.trustedProfile.primaryHomeLocation,
    trusted_transactions: params.trustedRows,
  };

  try {
    const res = await fetch(`${ML_API_URL}/api/v1/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": ML_API_KEY,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 401) {
        console.error(
          "ML API rejected the request (401). Ensure VITE_ML_API_KEY matches ML_API_KEY in ml-api/.env, then restart the ML server.",
        );
      }
      throw new Error(errText || `ML API error ${res.status}`);
    }

    const data = (await res.json()) as MLPredictResponse;

    return {
      risk_score: data.finalScore,
      rule_score: data.ruleScore,
      ml_score: data.mlScore,
      final_score: data.finalScore,
      status: data.status,
      confidence: mlConfidenceToLabel(data.confidence),
      confidenceLevel: mlConfidenceToLevel(data.confidence),
      reasons: data.reasons,
      isAnomaly: data.isAnomaly,
      contributesToProfile: data.contributesToProfile,
      detectionMethod: "hybrid",
    };
  } catch (e) {
    console.warn("ML API unavailable, using local rule fallback:", e);
    return scoreWithLocalRules(params);
  }
}

/** Local fallback — rule engine only (no ML pollution of baseline) */
function scoreWithLocalRules(params: {
  amount: number;
  paymentMethod: string;
  location: string;
  homeLocation?: string;
  trustedProfile: UserBehaviorProfile;
}): HybridRiskResult {
  const result = processTransaction(
    {
      amount: params.amount,
      type: params.paymentMethod,
      location: params.location,
      homeLocation: params.homeLocation ?? params.trustedProfile.primaryHomeLocation,
    },
    params.trustedProfile,
  );

  return {
    risk_score: result.risk_score,
    rule_score: result.risk_score,
    ml_score: result.risk_score,
    final_score: result.risk_score,
    status: result.status,
    confidence: result.confidence,
    confidenceLevel:
      result.confidence === "High Risk" ? 90 : result.confidence === "Medium Risk" ? 60 : 30,
    reasons: result.reasons,
    isAnomaly: result.status === "Anomalous",
    contributesToProfile: result.contributesToProfile,
    detectionMethod: "rules_fallback",
  };
}
