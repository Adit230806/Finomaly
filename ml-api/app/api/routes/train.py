"""Training endpoints — fit Isolation Forest on trusted-only data."""

from __future__ import annotations

import csv
import logging
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import verify_api_key
from app.config import get_settings
from app.ml.isolation_forest import IsolationForestModel
from app.ml.model_store import reload_model, save_metadata
from app.schemas.request import TrainRequest
from app.schemas.response import TrainResponse
from app.services.supabase_client import fetch_trusted_transactions

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["train"])


def _load_csv_trusted(path: str) -> list[dict]:
    """Load CSV and keep only rows marked trusted (is_anomaly=0, risk_score<30)."""
    records: list[dict] = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            is_anomaly = str(row.get("is_anomaly", "0")).lower() in ("1", "true", "yes")
            risk = float(row.get("risk_score", 0) or 0)
            if is_anomaly or risk >= 30:
                continue  # NEVER train on anomalies
            records.append(
                {
                    "amount": float(row["amount"]),
                    "payment_method": row.get("payment_method", "UPI"),
                    "location": row.get("location", "Pune, MH"),
                    "ip_address": row.get("ip_address", "unknown"),
                    "device_fingerprint": row.get("device_fingerprint", "device-1"),
                    "failed_login_attempts": int(row.get("failed_login_attempts", 0)),
                    "home_location": row.get("home_location", "Pune, MH"),
                    "timestamp": row.get("timestamp"),
                    "trusted_history": [],
                }
            )
    return records


@router.post(
    "/train",
    response_model=TrainResponse,
    dependencies=[Depends(verify_api_key)],
)
async def train_model(body: TrainRequest) -> TrainResponse:
    settings = get_settings()
    records: list[dict] = []

    if body.use_csv and Path(settings.training_data_path).exists():
        records.extend(_load_csv_trusted(settings.training_data_path))

    if body.use_supabase and body.user_id:
        trusted = fetch_trusted_transactions(body.user_id, limit=500)
        for t in trusted:
            records.append(
                {
                    **t,
                    "home_location": "Pune, MH",
                    "failed_login_attempts": 0,
                    "trusted_history": trusted,
                }
            )

    if len(records) < 10:
        raise HTTPException(
            status_code=400,
            detail=f"Need ≥10 trusted samples; got {len(records)}. Add data/training_data.csv",
        )

    model = IsolationForestModel()
    count = model.train(records, contamination=body.contamination, n_estimators=body.n_estimators)
    model.save(settings.model_path, settings.scaler_path)
    save_metadata(feature_count=8, sample_count=count)
    reload_model()

    return TrainResponse(
        success=True,
        samples_trained=count,
        model_path=settings.model_path,
        message=f"Isolation Forest trained on {count} trusted transactions",
    )
