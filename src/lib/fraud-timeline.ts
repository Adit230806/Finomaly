import { format } from "date-fns";
import type { FraudTimelineEvent, Transaction } from "@/types/transaction";

export function buildFraudTimeline(
  tx: Transaction,
  options?: { hasAlert?: boolean },
): FraudTimelineEvent[] {
  const ts = tx.timestamp;
  const timeLabel = format(new Date(ts), "h:mm a");
  const events: FraudTimelineEvent[] = [
    {
      id: `${tx.id}-created`,
      label: "Transaction Created",
      detail: `${tx.merchant} · ${timeLabel}`,
      timestamp: ts,
      kind: "created",
    },
    {
      id: `${tx.id}-scored`,
      label: "Risk Engine Evaluated",
      detail: `Score ${tx.riskScore} · ${tx.confidenceLevel}% confidence`,
      timestamp: ts,
      kind: "scored",
    },
  ];

  if (tx.isAnomaly || tx.riskScore > 50) {
    events.push({
      id: `${tx.id}-flagged`,
      label: tx.isAnomaly ? "Flagged as Anomaly" : "Elevated Risk Detected",
      detail: tx.explanation[0] ?? "Risk signals detected",
      timestamp: ts,
      kind: "scored",
    });
  }

  if (options?.hasAlert || tx.riskScore > 80) {
    events.push({
      id: `${tx.id}-alert`,
      label: "Alert Generated",
      detail: `High-risk threshold exceeded (score ${tx.riskScore})`,
      timestamp: ts,
      kind: "alert",
    });
    events.push({
      id: `${tx.id}-notify`,
      label: "Admin Notified",
      detail: "Alert queued for fraud command center review",
      timestamp: ts,
      kind: "notified",
    });
  }

  return events;
}
