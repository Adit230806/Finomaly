import { supabase } from "@/integrations/supabase/client";
import {
  fetchTrustedTransactionRefs,
  fetchUserBehaviorProfile,
} from "@/services/behaviorProfileService";
import { insertAlert } from "@/services/alertService";
import { scoreTransactionHybrid } from "@/services/mlRiskService";
import { mapTransactionRow } from "@/lib/transaction-mapper";
import type { CreateTransactionInput, Transaction } from "@/types/transaction";

function defaultDeviceFingerprint(): string {
  if (typeof navigator === "undefined") return "server";
  return `web-${navigator.userAgent.length}-${screen.width}x${screen.height}`;
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }
  return (data ?? []).map((r) => mapTransactionRow(r as Record<string, unknown>));
}

/**
 * Hybrid fraud pipeline:
 * 1. Load trusted history only (never anomalies)
 * 2. Rule engine + Isolation Forest via FastAPI
 * 3. finalScore = 0.4*rule + 0.6*ml
 * 4. Persist — flagged txs excluded from future learning
 */
export async function createTransaction(
  input: CreateTransactionInput,
): Promise<Transaction> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const [profile, trustedRows] = await Promise.all([
    fetchUserBehaviorProfile(user.id),
    fetchTrustedTransactionRefs(user.id),
  ]);

  const deviceFp = input.deviceFingerprint ?? defaultDeviceFingerprint();

  const result = await scoreTransactionHybrid({
    userId: user.id,
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    location: input.location,
    merchant: input.merchant,
    category: input.category,
    ipAddress: input.ipAddress ?? "client",
    deviceFingerprint: deviceFp,
    failedLoginAttempts: 0,
    homeLocation: input.homeLocation,
    trustedProfile: profile,
    trustedRows,
  });

  const isAnomaly = result.isAnomaly;
  const status = result.status;

  const payload = {
    user_id: user.id,
    email: user.email ?? "",
    amount: input.amount,
    merchant: input.merchant,
    category: input.category,
    location: input.location,
    payment_method: input.paymentMethod,
    risk_score: result.final_score,
    rule_score: result.rule_score,
    ml_score: result.ml_score,
    final_score: result.final_score,
    detection_method: result.detectionMethod,
    risk_status: status,
    confidence_level: result.confidenceLevel,
    confidence: result.confidenceLevel,
    confidence_label: result.confidence,
    is_anomaly: isAnomaly,
    explanation: result.reasons,
    anomaly_reasons: result.reasons,
    ip_address: input.ipAddress ?? "client",
    device_fingerprint: deviceFp,
  };

  const { data, error } = await supabase
    .from("transactions")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);

  const inserted = mapTransactionRow(data as Record<string, unknown>);

  if (isAnomaly || status === "Suspicious") {
    await insertAlert({
      transaction_id: inserted.id,
      user_id: inserted.userId,
      email: user.email ?? "",
      risk_score: result.final_score,
      reason:
        result.reasons[0] ??
        `${status}: ${inserted.merchant} (score ${result.final_score})`,
    });
  }

  return inserted;
}

export async function insertTransaction(
  tx: Omit<Transaction, "id" | "timestamp" | "userId">,
): Promise<Transaction> {
  return createTransaction({
    amount: tx.amount,
    merchant: tx.merchant,
    category: tx.category,
    location: tx.location,
    paymentMethod: tx.paymentMethod,
  });
}

/** Manual review: confirm fraud or mark as trusted normal */
export async function reviewTransaction(
  id: string,
  isAnomaly: boolean,
): Promise<Transaction> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing, error: fetchError } = await supabase
    .from("transactions")
    .select("explanation, anomaly_reasons")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const priorReasons =
    (existing?.anomaly_reasons as string[] | undefined)?.length
      ? (existing.anomaly_reasons as string[])
      : ((existing?.explanation as string[]) ?? []);

  const reviewNote = isAnomaly
    ? "Manually confirmed as anomaly by reviewer"
    : "Manually marked as safe by reviewer";

  const reasons = priorReasons.includes(reviewNote)
    ? priorReasons
    : [...priorReasons, reviewNote];

  const riskScore = isAnomaly ? 85 : 8;
  const riskStatus = isAnomaly ? "Anomalous" : "Normal";
  const confidenceLabel = isAnomaly ? "High Risk" : "Low Risk";

  const { data, error } = await supabase
    .from("transactions")
    .update({
      is_anomaly: isAnomaly,
      risk_status: riskStatus,
      risk_score: riskScore,
      rule_score: riskScore,
      ml_score: riskScore,
      final_score: riskScore,
      confidence_level: isAnomaly ? 92 : 96,
      confidence: isAnomaly ? 92 : 96,
      confidence_label: confidenceLabel,
      explanation: reasons,
      anomaly_reasons: reasons,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapTransactionRow(data as Record<string, unknown>);
}

/** @deprecated Use reviewTransaction */
export async function updateTransactionAnomaly(
  id: string,
  isAnomaly: boolean,
): Promise<void> {
  await reviewTransaction(id, isAnomaly);
}

export { fetchUserBehaviorProfile, fetchTrustedTransactionRefs } from "@/services/behaviorProfileService";
export { scoreTransactionHybrid, isMLApiConfigured } from "@/services/mlRiskService";
