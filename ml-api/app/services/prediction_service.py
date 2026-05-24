"""Orchestrates rule engine + Isolation Forest + hybrid scoring."""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from app.core.hybrid_scorer import build_response
from app.core.rule_engine import evaluate_rules
from app.ml.feature_engineering import (
    TransactionContext,
    build_feature_vector,
    compute_device_change,
    compute_ip_mismatch,
)
from app.ml.model_store import get_model
from app.schemas.request import PredictRequest
from app.schemas.response import PredictResponse

logger = logging.getLogger(__name__)


def _heuristic_ml_score(ctx: TransactionContext) -> tuple[int, list[str]]:
    """Fallback when model file is missing — lightweight statistical estimate."""
    reasons: list[str] = []
    score = 15
    trusted = ctx.trusted_history

    if trusted:
        amounts = [float(t["amount"]) for t in trusted]
        avg = sum(amounts) / len(amounts)
        if ctx.amount > avg * 3:
            score += 35
            reasons.append("Amount far above trusted average (heuristic ML)")
    else:
        score += 10

    loc_risk = compute_device_change(ctx.device_fingerprint, trusted)
    if loc_risk:
        score += 15
        reasons.append("New device (heuristic ML)")

    if compute_ip_mismatch(ctx.ip_address, trusted):
        score += 10
        reasons.append("IP mismatch (heuristic ML)")

    return min(100, score), reasons


def predict_transaction(req: PredictRequest) -> PredictResponse:
    """
    Full hybrid pipeline:
    1. Build context from trusted history only
    2. Rule engine → ruleScore
    3. Isolation Forest → mlScore
    4. Weighted combination → finalScore
    """
    trusted = [
        {
            "amount": t.amount,
            "location": t.location,
            "payment_method": t.payment_method,
            "device_fingerprint": t.device_fingerprint,
            "ip_address": t.ip_address,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "risk_score": t.risk_score if t.risk_score is not None else 0,
        }
        for t in req.trusted_transactions
    ]

    ts = req.timestamp or datetime.now(timezone.utc)
    ctx = TransactionContext(
        amount=req.amount,
        payment_method=req.payment_method,
        location=req.location,
        timestamp=ts,
        ip_address=req.ip_address or "unknown",
        device_fingerprint=req.device_fingerprint or "unknown",
        failed_login_attempts=req.failed_login_attempts,
        home_location=req.home_location or "Pune, MH",
        trusted_history=trusted,
    )

    device_chg = compute_device_change(ctx.device_fingerprint, trusted)
    ip_mis = compute_ip_mismatch(ctx.ip_address, trusted)

    rule = evaluate_rules(
        amount=req.amount,
        payment_method=req.payment_method,
        location=req.location,
        trusted=trusted,
        home_location=ctx.home_location,
        failed_login_attempts=req.failed_login_attempts,
        device_change=device_chg,
        ip_mismatch=ip_mis,
    )

    ml_reasons: list[str] = []
    model = get_model()

    try:
        if model.is_loaded:
            features = build_feature_vector(ctx)
            ml_score, ml_flag = model.predict_ml_score(features)
            if ml_flag:
                ml_reasons.append("Isolation Forest detected outlier pattern")
        else:
            ml_score, ml_reasons = _heuristic_ml_score(ctx)
    except Exception as exc:
        logger.warning("ML prediction failed, using heuristic: %s", exc)
        ml_score, ml_reasons = _heuristic_ml_score(ctx)

    response = build_response(
        rule_score=rule.rule_score,
        ml_score=ml_score,
        rule_reasons=rule.reasons,
        ml_reasons=ml_reasons,
    )

    logger.info(
        "Predict user=%s final=%d rule=%d ml=%d anomaly=%s",
        req.user_id,
        response.final_score,
        response.rule_score,
        response.ml_score,
        response.is_anomaly,
    )

    return response
