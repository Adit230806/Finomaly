import type { Category, PaymentMethod, Transaction } from "@/types/transaction";

export function mapTransactionRow(row: Record<string, unknown>): Transaction {
  const reasons =
    (row.anomaly_reasons as string[] | undefined)?.length
      ? (row.anomaly_reasons as string[])
      : ((row.explanation as string[]) ?? []);

  const confidence =
    row.confidence != null
      ? Number(row.confidence)
      : Number(row.confidence_level ?? 0);

  return {
    id: row.id as string,
    amount: Number(row.amount),
    merchant: row.merchant as string,
    category: ((row.category as string) ?? "Shopping") as Category,
    location: row.location as string,
    paymentMethod: (row.payment_method as string) as PaymentMethod,
    riskScore: row.risk_score as number,
    confidenceLevel: confidence,
    isAnomaly: row.is_anomaly as boolean,
    status: (row.is_anomaly ? "Anomaly" : "Normal") as Transaction["status"],
    explanation: reasons,
    timestamp: row.created_at as string,
    userId: row.user_id as string,
    ipAddress: (row.ip_address as string) ?? undefined,
    deviceFingerprint: (row.device_fingerprint as string) ?? undefined,
  };
}
