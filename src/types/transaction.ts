export type RiskLevel = "low" | "medium" | "high";
export type TxStatus = "Normal" | "Suspicious" | "Anomalous" | "Anomaly";
export type Category =
  | "Shopping"
  | "Food"
  | "Entertainment"
  | "Transfer"
  | "ATM"
  | "Travel";
export type PaymentMethod =
  | "UPI"
  | "Card"
  | "Debit Card"
  | "Credit Card"
  | "Bank Transfer"
  | "NEFT"
  | "IMPS"
  | "Wallet"
  | "Apple Pay"
  | "Google Pay"
  | "PayPal"
  | "Crypto";

export interface Transaction {
  id: string;
  amount: number;
  merchant: string;
  category: Category;
  location: string;
  paymentMethod: PaymentMethod;
  riskScore: number;
  ruleScore?: number;
  mlScore?: number;
  finalScore?: number;
  detectionMethod?: string;
  confidenceLevel: number;
  confidenceLabel?: string;
  isAnomaly: boolean;
  status: TxStatus;
  explanation: string[];
  timestamp: string;
  userId: string;
  ipAddress?: string;
  deviceFingerprint?: string;
}

/** Input for creating a transaction — risk fields are computed server-side in the service layer */
export interface CreateTransactionInput {
  amount: number;
  merchant: string;
  category: Category;
  location: string;
  paymentMethod: PaymentMethod;
  ipAddress?: string;
  deviceFingerprint?: string;
  homeLocation?: string;
}

export interface FraudTimelineEvent {
  id: string;
  label: string;
  detail?: string;
  timestamp: string;
  kind: "created" | "scored" | "alert" | "notified";
}
