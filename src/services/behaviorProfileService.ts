import { supabase } from "@/integrations/supabase/client";
import {
  BEHAVIOR_WINDOW_SIZE,
  TRUSTED_RISK_THRESHOLD,
  type UserBehaviorProfile,
} from "@/types/behavior";
import type { TrustedTransactionRef } from "@/types/risk";
import { buildBehaviorProfile } from "@/utils/userBehaviorProfile";

/**
 * Loads trusted transactions (risk_score &lt; 30) and builds a behavior profile.
 * Anomalies and suspicious txs are excluded from learning.
 */
export async function fetchUserBehaviorProfile(
  userId: string,
): Promise<UserBehaviorProfile> {
  const { data, error } = await supabase
    .from("transactions")
    .select("amount, location, payment_method, risk_score, created_at")
    .eq("user_id", userId)
    .eq("is_anomaly", false)
    .lt("risk_score", TRUSTED_RISK_THRESHOLD)
    .order("created_at", { ascending: false })
    .limit(BEHAVIOR_WINDOW_SIZE);

  if (error) {
    console.error("behavior profile fetch failed", error);
    return buildBehaviorProfile([]);
  }

  const trusted = (data ?? []).map((row) => ({
    amount: Number(row.amount),
    location: row.location as string,
    type: row.payment_method as string,
  }));

  return buildBehaviorProfile(trusted);
}

/** Full trusted rows for ML API — anomalies never included */
export async function fetchTrustedTransactionRefs(
  userId: string,
): Promise<TrustedTransactionRef[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "amount, location, payment_method, ip_address, device_fingerprint, created_at, risk_score, is_anomaly",
    )
    .eq("user_id", userId)
    .eq("is_anomaly", false)
    .lt("risk_score", TRUSTED_RISK_THRESHOLD)
    .order("created_at", { ascending: false })
    .limit(BEHAVIOR_WINDOW_SIZE);

  if (error) {
    console.error("trusted refs fetch failed", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    amount: Number(row.amount),
    location: row.location as string,
    payment_method: row.payment_method as string,
    ip_address: (row.ip_address as string) ?? undefined,
    device_fingerprint: (row.device_fingerprint as string) ?? undefined,
    created_at: row.created_at as string,
    risk_score: Number(row.risk_score ?? 0),
  }));
}
