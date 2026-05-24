"""
Isolation Forest wrapper for unsupervised anomaly detection.

Training uses ONLY normal/trusted transactions — outliers in training data
would poison the model, so we filter risk_score < threshold before fit().
"""

from __future__ import annotations

import logging
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from app.ml.feature_engineering import FEATURE_COLUMNS, dataframe_from_records

logger = logging.getLogger(__name__)


class IsolationForestModel:
    def __init__(self) -> None:
        self.model: IsolationForest | None = None
        self.scaler: StandardScaler | None = None

    @property
    def is_loaded(self) -> bool:
        return self.model is not None and self.scaler is not None

    def train(
        self,
        records: list[dict],
        contamination: float = 0.05,
        n_estimators: int = 200,
    ) -> int:
        """
        Fit Isolation Forest on trusted-only feature matrix.
        Returns number of samples used.
        """
        if len(records) < 10:
            raise ValueError("Need at least 10 trusted transactions to train")

        df = dataframe_from_records(records)
        X = df[FEATURE_COLUMNS].values

        # Step 1: scale features so amount/velocity don't dominate
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        # Step 2: Isolation Forest — learns boundary of "normal" behavior
        self.model = IsolationForest(
            n_estimators=n_estimators,
            contamination=contamination,
            random_state=42,
            n_jobs=-1,
        )
        self.model.fit(X_scaled)

        logger.info("Trained Isolation Forest on %d trusted samples", len(records))
        return len(records)

    def predict_ml_score(self, feature_vector: np.ndarray) -> tuple[int, bool]:
        """
        Convert sklearn output to 0–100 mlScore.
        Lower decision_function = more anomalous.
        """
        if not self.is_loaded:
            raise RuntimeError("Model not loaded. Run training first.")

        assert self.scaler is not None and self.model is not None

        X_scaled = self.scaler.transform(feature_vector)
        raw_pred = self.model.predict(X_scaled)[0]  # 1 = inlier, -1 = outlier
        decision = self.model.decision_function(X_scaled)[0]

        # Map decision function to 0–100 (higher = more risky)
        # Typical range roughly -0.5 .. 0.5 for IF
        ml_score = int(np.clip((0.5 - decision) * 100, 0, 100))
        is_anomaly = raw_pred == -1 or ml_score >= 60

        return ml_score, is_anomaly

    def save(self, model_path: str, scaler_path: str) -> None:
        if not self.is_loaded:
            raise RuntimeError("Cannot save untrained model")
        Path(model_path).parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, model_path)
        joblib.dump(self.scaler, scaler_path)
        logger.info("Saved model to %s", model_path)

    def load(self, model_path: str, scaler_path: str) -> None:
        if not Path(model_path).exists():
            raise FileNotFoundError(f"Model not found: {model_path}")
        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)
        logger.info("Loaded Isolation Forest from %s", model_path)
