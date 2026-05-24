#!/usr/bin/env python3
"""
Train Isolation Forest on trusted-only transactions.

Usage:
  cd ml-api
  python scripts/train_model.py

Only rows with is_anomaly=0 and risk_score<30 are used.
Anomalies are NEVER included in training (prevents baseline pollution).
"""

from __future__ import annotations

import csv
import sys
from pathlib import Path

# Add ml-api root to path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.config import get_settings
from app.ml.isolation_forest import IsolationForestModel
from app.ml.model_store import save_metadata


def load_trusted_csv(path: Path) -> list[dict]:
    records = []
    with path.open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            is_anomaly = str(row.get("is_anomaly", "0")).lower() in ("1", "true")
            risk = float(row.get("risk_score", 0) or 0)
            if is_anomaly or risk >= 30:
                print(f"  skip anomaly/risky row: amount={row.get('amount')}")
                continue
            records.append(
                {
                    "amount": float(row["amount"]),
                    "payment_method": row.get("payment_method", "UPI"),
                    "location": row.get("location", "Pune, MH"),
                    "ip_address": row.get("ip_address", "unknown"),
                    "device_fingerprint": row.get("device_fingerprint", "device-1"),
                    "failed_login_attempts": int(row.get("failed_login_attempts", 0)),
                    "home_location": row.get("home_location", "Pune, MH"),
                    "trusted_history": [],
                }
            )
    return records


def main() -> None:
    settings = get_settings()
    csv_path = Path(settings.training_data_path)

    print("Finomaly Isolation Forest Training")
    print("=" * 40)
    print(f"Data: {csv_path}")

    if not csv_path.exists():
        print(f"ERROR: Missing {csv_path}")
        sys.exit(1)

    records = load_trusted_csv(csv_path)
    print(f"Trusted samples: {len(records)}")

    if len(records) < 10:
        print("ERROR: Need at least 10 trusted rows")
        sys.exit(1)

    model = IsolationForestModel()
    count = model.train(records, contamination=0.05, n_estimators=200)
    model.save(settings.model_path, settings.scaler_path)
    save_metadata(8, count)

    print(f"Model saved: {settings.model_path}")
    print(f"Scaler saved: {settings.scaler_path}")
    print(f"Trained on {count} trusted transactions only.")


if __name__ == "__main__":
    main()
