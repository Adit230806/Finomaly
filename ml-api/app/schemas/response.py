"""API response models — matches Finomaly frontend contract."""

from typing import Literal

from pydantic import BaseModel, Field


ConfidenceLabel = Literal["Low", "Medium", "High"]
RiskStatus = Literal["Normal", "Suspicious", "Anomalous"]


class PredictResponse(BaseModel):
    is_anomaly: bool = Field(..., alias="isAnomaly")
    ml_score: int = Field(..., alias="mlScore")
    rule_score: int = Field(..., alias="ruleScore")
    final_score: int = Field(..., alias="finalScore")
    confidence: ConfidenceLabel
    reasons: list[str]
    status: RiskStatus
    contributes_to_profile: bool = Field(..., alias="contributesToProfile")

    model_config = {"populate_by_name": True}


class TrainResponse(BaseModel):
    success: bool
    samples_trained: int
    model_path: str
    message: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    version: str = "1.0.0"
