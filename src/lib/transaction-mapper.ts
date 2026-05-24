import type { Category, PaymentMethod, Transaction, TxStatus } from "@/types/transaction";

function mapRiskStatus(row: Record<string, unknown>): TxStatus {
  const stored = row.risk_status as string | undefined;
  if (stored === "Anomalous" || stored === "Suspicious" || stored === "Normal") {
    return stored;
  }
  const score = Number(row.risk_score ?? 0);
  if (row.is_anomaly || score >= 60) return "Anomalous";
  if (score >= 30) return "Suspicious";
  return "Normal";
}

export function mapTransactionRow(row: Record<string, unknown>): Transaction {
  const reasons =
    (row.anomaly_reasons as string[] | undefined)?.length
      ? (row.anomaly_reasons as string[])
      : ((row.explanation as string[]) ?? []);

  const confidence =
    row.confidence != null
      ? Number(row.confidence)
      : Number(row.confidence_level ?? 0);

  const status = mapRiskStatus(row);
  const isAnomaly = status === "Anomalous" || Boolean(row.is_anomaly);
  const finalScore =
    row.final_score != null ? Number(row.final_score) : (row.risk_score as number);

  return {
    id: row.id as string,
    amount: Number(row.amount),
    merchant: row.merchant as string,
    category: ((row.category as string) ?? "Shopping") as Category,
    location: row.location as string,
    paymentMethod: (row.payment_method as string) as PaymentMethod,
    riskScore: finalScore,
    ruleScore: row.rule_score != null ? Number(row.rule_score) : undefined,
    mlScore: row.ml_score != null ? Number(row.ml_score) : undefined,
    finalScore: row.final_score != null ? Number(row.final_score) : undefined,
    detectionMethod: (row.detection_method as string) ?? undefined,
    confidenceLevel: confidence,
    confidenceLabel: (row.confidence_label as string) ?? undefined,
    isAnomaly,
    status: status === "Anomalous" ? "Anomaly" : status,
    explanation: reasons,
    timestamp: row.created_at as string,
    userId: row.user_id as string,
    ipAddress: (row.ip_address as string) ?? undefined,
    deviceFingerprint: (row.device_fingerprint as string) ?? undefined,
  };
}
