export type RiskLevel = "low" | "medium" | "high";
export type TxStatus = "Normal" | "Anomaly";
export type Category =
  | "Shopping"
  | "Food"
  | "Entertainment"
  | "Transfer"
  | "ATM"
  | "Travel";
export type PaymentMethod =
  | "Card"
  | "Bank Transfer"
  | "Crypto"
  | "Wallet"
  | "UPI";

export interface Transaction {
  id: string;
  amount: number;
  merchant: string;
  category: Category;
  location: string;
  paymentMethod: PaymentMethod;
  riskScore: number;
  confidenceLevel: number;
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
  /** Optional context for scoring (user history) */
  userAvg?: number;
  knownLocations?: string[];
}

export interface FraudTimelineEvent {
  id: string;
  label: string;
  detail?: string;
  timestamp: string;
  kind: "created" | "scored" | "alert" | "notified";
}
