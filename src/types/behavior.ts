/** Behavioral baseline learned only from trusted (low-risk) transactions */

export const TRUSTED_RISK_THRESHOLD = 30;
export const BEHAVIOR_WINDOW_SIZE = 30;

export interface UserBehaviorProfile {
  averageAmount: number;
  medianAmount: number;
  trustedStdDeviation: number;
  normalTransactionCount: number;
  lastLocations: string[];
  commonTransactionTypes: string[];
  /** Most frequent trusted location */
  primaryHomeLocation: string;
}

export interface TrustedTransactionSnapshot {
  amount: number;
  type: string;
  location: string;
}
