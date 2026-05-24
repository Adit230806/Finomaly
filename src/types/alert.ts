export type AlertStatus = "New" | "Under Review" | "Confirmed" | "Ignored";
export type AlertSeverity = "low" | "medium" | "high";

export interface Alert {
  id: string;
  transactionId: string;
  severity: AlertSeverity;
  reason: string;
  status: AlertStatus;
  timestamp: string;
  riskScore: number;
  merchant: string;
  amount: number;
  location: string;
}
