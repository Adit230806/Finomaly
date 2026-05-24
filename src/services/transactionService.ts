import { supabase } from "@/integrations/supabase/client";
import { scoreTransaction } from "@/lib/risk";
import { insertAlert } from "@/services/alertService";
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
 * Creates a transaction: scores risk in the service layer, persists all signals,
 * and auto-generates alerts for high-risk events.
 */
export async function createTransaction(
  input: CreateTransactionInput,
): Promise<Transaction> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const result = scoreTransaction({
    amount: input.amount,
    location: input.location,
    merchant: input.merchant,
    payment_method: input.paymentMethod,
    userAvg: input.userAvg,
    knownLocations: input.knownLocations,
  });

  const payload = {
    user_id: user.id,
    email: user.email ?? "",
    amount: input.amount,
    merchant: input.merchant,
    category: input.category,
    location: input.location,
    payment_method: input.paymentMethod,
    risk_score: result.score,
    confidence_level: result.confidence,
    confidence: result.confidence,
    is_anomaly: result.isAnomaly,
    explanation: result.reasons,
    anomaly_reasons: result.reasons,
    ip_address: input.ipAddress ?? "client",
    device_fingerprint: input.deviceFingerprint ?? defaultDeviceFingerprint(),
  };

  const { data, error } = await supabase
    .from("transactions")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);

  const inserted = mapTransactionRow(data as Record<string, unknown>);

  if (result.isAnomaly || result.score > 80) {
    await insertAlert({
      transaction_id: inserted.id,
      user_id: inserted.userId,
      email: user.email ?? "",
      risk_score: result.score,
      reason:
        result.reasons[0] ??
        `High risk: ${inserted.merchant} (score ${result.score})`,
    });
  }

  return inserted;
}

/** @deprecated Use createTransaction — kept for gradual migration */
export async function insertTransaction(
  tx: Omit<Transaction, "id" | "timestamp" | "userId">,
): Promise<Transaction> {
  return createTransaction({
    amount: tx.amount,
    merchant: tx.merchant,
    category: tx.category,
    location: tx.location,
    paymentMethod: tx.paymentMethod,
    userAvg: undefined,
    knownLocations: undefined,
  });
}

export async function updateTransactionAnomaly(
  id: string,
  isAnomaly: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("transactions")
    .update({ is_anomaly: isAnomaly })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export type { RiskResult } from "@/lib/risk";
export { scoreTransaction } from "@/lib/risk";
