"""
Feature engineering for Isolation Forest.

Each row is one transaction. Features are designed for fintech fraud detection
and are computed using ONLY trusted (normal) history — never polluted by anomalies.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

import numpy as np
import pandas as pd

# Payment method → numeric risk weight (higher = riskier channel)
PAYMENT_METHOD_RISK: dict[str, float] = {
    "UPI": 0.1,
    "Card": 0.2,
    "Debit Card": 0.2,
    "Credit Card": 0.25,
    "Wallet": 0.25,
    "Apple Pay": 0.15,
    "Google Pay": 0.15,
    "PayPal": 0.35,
    "Bank Transfer": 0.45,
    "NEFT": 0.4,
    "IMPS": 0.35,
    "Crypto": 0.85,
}

FEATURE_COLUMNS = [
    "log_amount",
    "payment_method_risk",
    "transaction_hour",
    "location_risk",
    "device_change",
    "velocity_1h",
    "failed_login_attempts",
    "ip_mismatch",
]


@dataclass
class TransactionContext:
    amount: float
    payment_method: str
    location: str
    timestamp: datetime
    ip_address: str
    device_fingerprint: str
    failed_login_attempts: int
    home_location: str
    trusted_history: list[dict[str, Any]]


def _normalize_city(location: str) -> str:
    return location.split(",")[0].strip().lower()


def _payment_risk(method: str) -> float:
    return PAYMENT_METHOD_RISK.get(method, 0.35)


def _trusted_only(history: list[dict[str, Any]], threshold: int = 30) -> list[dict[str, Any]]:
    """Exclude anomalies from baseline — critical for accurate ML."""
    return [
        h
        for h in history
        if h.get("risk_score") is None or float(h["risk_score"]) < threshold
    ]


def compute_location_risk(location: str, trusted: list[dict[str, Any]], home: str) -> float:
    """1.0 = never seen location, 0.0 = home or known trusted city."""
    city = _normalize_city(location)
    home_city = _normalize_city(home)
    if city == home_city:
        return 0.0
    known = {_normalize_city(h.get("location", "")) for h in trusted}
    return 0.0 if city in known else 1.0


def compute_device_change(device: str, trusted: list[dict[str, Any]]) -> float:
    if not trusted or device in ("unknown", ""):
        return 0.0
    known_devices = {h.get("device_fingerprint") for h in trusted if h.get("device_fingerprint")}
    if not known_devices:
        return 0.0
    return 0.0 if device in known_devices else 1.0


def compute_ip_mismatch(ip: str, trusted: list[dict[str, Any]]) -> float:
    if not trusted or ip in ("unknown", "client", ""):
        return 0.0
    known_ips = {h.get("ip_address") for h in trusted if h.get("ip_address")}
    if not known_ips:
        return 0.0
    return 0.0 if ip in known_ips else 1.0


def compute_velocity(ts: datetime, trusted: list[dict[str, Any]]) -> float:
    """Count trusted txs in the last hour (including this one adds +1 in predict)."""
    window_start = ts.timestamp() - 3600
    count = 0
    for h in trusted:
        created = h.get("created_at")
        if created is None:
            continue
        if isinstance(created, str):
            created = datetime.fromisoformat(created.replace("Z", "+00:00"))
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        if created.timestamp() >= window_start:
            count += 1
    return float(count)


def build_feature_vector(ctx: TransactionContext) -> np.ndarray:
    """
    Build a single feature row for Isolation Forest inference.
    Step 1: filter trusted history
    Step 2: derive behavioral signals
    Step 3: return fixed-order numpy vector
    """
    trusted = _trusted_only(ctx.trusted_history)
    ts = ctx.timestamp or datetime.now(timezone.utc)

    features = {
        "log_amount": float(np.log1p(max(ctx.amount, 0))),
        "payment_method_risk": _payment_risk(ctx.payment_method),
        "transaction_hour": float(ts.hour),
        "location_risk": compute_location_risk(ctx.location, trusted, ctx.home_location),
        "device_change": compute_device_change(ctx.device_fingerprint, trusted),
        "velocity_1h": compute_velocity(ts, trusted) + 1.0,
        "failed_login_attempts": float(min(ctx.failed_login_attempts, 10)),
        "ip_mismatch": compute_ip_mismatch(ctx.ip_address, trusted),
    }

    return np.array([[features[col] for col in FEATURE_COLUMNS]], dtype=np.float64)


def dataframe_from_records(records: list[dict[str, Any]]) -> pd.DataFrame:
    """Convert raw training records into a feature matrix (trusted rows only)."""
    rows = []
    for rec in records:
        ctx = TransactionContext(
            amount=float(rec["amount"]),
            payment_method=str(rec.get("payment_method", "UPI")),
            location=str(rec.get("location", "Pune, MH")),
            timestamp=rec.get("timestamp") or datetime.now(timezone.utc),
            ip_address=str(rec.get("ip_address", "unknown")),
            device_fingerprint=str(rec.get("device_fingerprint", "unknown")),
            failed_login_attempts=int(rec.get("failed_login_attempts", 0)),
            home_location=str(rec.get("home_location", "Pune, MH")),
            trusted_history=rec.get("trusted_history", []),
        )
        vec = build_feature_vector(ctx)[0]
        rows.append(dict(zip(FEATURE_COLUMNS, vec)))

    return pd.DataFrame(rows, columns=FEATURE_COLUMNS)
