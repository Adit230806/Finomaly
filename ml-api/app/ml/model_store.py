"""Singleton model store — loads joblib artifacts at startup."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from app.config import get_settings
from app.ml.isolation_forest import IsolationForestModel

logger = logging.getLogger(__name__)

_model: IsolationForestModel | None = None


def get_model() -> IsolationForestModel:
    global _model
    if _model is None:
        _model = IsolationForestModel()
        settings = get_settings()
        try:
            _model.load(settings.model_path, settings.scaler_path)
        except FileNotFoundError:
            logger.warning("No trained model on disk — predictions use heuristic fallback")
    return _model


def reload_model() -> IsolationForestModel:
    global _model
    _model = IsolationForestModel()
    settings = get_settings()
    _model.load(settings.model_path, settings.scaler_path)
    return _model


def save_metadata(feature_count: int, sample_count: int) -> None:
    settings = get_settings()
    path = Path(settings.metadata_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(
            {
                "feature_count": feature_count,
                "sample_count": sample_count,
                "features": [
                    "log_amount",
                    "payment_method_risk",
                    "transaction_hour",
                    "location_risk",
                    "device_change",
                    "velocity_1h",
                    "failed_login_attempts",
                    "ip_mismatch",
                ],
            },
            indent=2,
        ),
        encoding="utf-8",
    )
