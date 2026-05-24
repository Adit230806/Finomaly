"""Pydantic request models for the fraud detection API."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class TrustedTransactionRef(BaseModel):
    """A prior trusted transaction used for behavioral feature engineering."""

    amount: float
    location: str
    payment_method: str
    device_fingerprint: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: Optional[datetime] = None
    risk_score: Optional[float] = None


class PredictRequest(BaseModel):
    """Incoming transaction to score with hybrid rule + ML engine."""

    user_id: str = Field(..., description="Supabase user UUID")
    amount: float = Field(..., gt=0)
    payment_method: str = Field(..., description="UPI, Card, Bank Transfer, Wallet, Crypto")
    location: str
    merchant: Optional[str] = None
    category: Optional[str] = None
    timestamp: Optional[datetime] = None
    ip_address: Optional[str] = "unknown"
    device_fingerprint: Optional[str] = "unknown"
    failed_login_attempts: int = Field(0, ge=0)
    home_location: Optional[str] = "Pune, MH"
    trusted_transactions: list[TrustedTransactionRef] = Field(
        default_factory=list,
        description="Only normal/trusted txs (risk < 30). Anomalies must be excluded.",
    )


class TrainRequest(BaseModel):
    """Optional training parameters."""

    contamination: float = Field(0.05, ge=0.01, le=0.25)
    n_estimators: int = Field(200, ge=50, le=500)
    use_csv: bool = True
    use_supabase: bool = False
    user_id: Optional[str] = None
