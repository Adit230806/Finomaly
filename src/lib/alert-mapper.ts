import type { Alert } from "@/types/alert";

export function mapAlertRow(row: Record<string, unknown>): Alert {
  const tx = (row.transactions ?? {}) as Record<string, unknown>;
  const riskScore = row.risk_score as number;
  return {
    id: row.id as string,
    transactionId: row.transaction_id as string,
    severity:
      riskScore >= 80 ? "high" : riskScore >= 50 ? "medium" : "low",
    reason: row.reason as string,
    status: (row.status as Alert["status"]) ?? "New",
    timestamp: row.created_at as string,
    riskScore,
    merchant: (tx.merchant as string) ?? "",
    amount: Number(tx.amount ?? 0),
    location: (tx.location as string) ?? "",
  };
}
