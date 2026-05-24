"""
Hybrid fraud scorer: combines rule engine + Isolation Forest.

finalScore = (ruleScore * 0.4) + (mlScore * 0.6)

Anomalies (finalScore >= threshold) must NOT be added to learning baseline.
"""

from __future__ import annotations

from app.config import get_settings
from app.schemas.response import PredictResponse


def combine_scores(rule_score: int, ml_score: int) -> int:
    settings = get_settings()
    final = (rule_score * settings.rule_weight) + (ml_score * settings.ml_weight)
    return int(min(100, max(0, round(final))))


def confidence_label(final_score: int) -> str:
    if final_score >= 60:
        return "High"
    if final_score >= 30:
        return "Medium"
    return "Low"


def risk_status(final_score: int) -> str:
    if final_score >= 60:
        return "Anomalous"
    if final_score >= 30:
        return "Suspicious"
    return "Normal"


def build_response(
    rule_score: int,
    ml_score: int,
    rule_reasons: list[str],
    ml_reasons: list[str],
) -> PredictResponse:
    settings = get_settings()
    final_score = combine_scores(rule_score, ml_score)
    is_anomaly = final_score >= settings.anomaly_threshold
    contributes = final_score < settings.trusted_risk_threshold

    # Merge reasons (deduplicated, rule first then ML)
    seen: set[str] = set()
    reasons: list[str] = []
    for r in rule_reasons + ml_reasons:
        if r not in seen:
            seen.add(r)
            reasons.append(r)

    if not reasons:
        reasons = ["Matches trusted behavioral pattern"]

    if is_anomaly and "ML model flagged statistical outlier" not in reasons:
        reasons.append("ML model flagged statistical outlier")

    return PredictResponse(
        isAnomaly=is_anomaly,
        mlScore=ml_score,
        ruleScore=rule_score,
        finalScore=final_score,
        confidence=confidence_label(final_score),  # type: ignore[arg-type]
        reasons=reasons,
        status=risk_status(final_score),  # type: ignore[arg-type]
        contributesToProfile=contributes,
    )
