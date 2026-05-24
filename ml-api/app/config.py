"""Application configuration loaded from environment variables."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ML_API_ROOT = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ML_API_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ml_api_host: str = "0.0.0.0"
    ml_api_port: int = 8000
    ml_api_key: str = "dev-key-change-me"
    log_level: str = "INFO"

    model_path: str = str(ML_API_ROOT / "models" / "isolation_forest.joblib")
    scaler_path: str = str(ML_API_ROOT / "models" / "scaler.joblib")
    metadata_path: str = str(ML_API_ROOT / "models" / "feature_metadata.json")
    training_data_path: str = str(ML_API_ROOT / "data" / "training_data.csv")

    supabase_url: str = ""
    supabase_service_role_key: str = ""

    rule_weight: float = 0.4
    ml_weight: float = 0.6
    anomaly_threshold: int = 60
    trusted_risk_threshold: int = 30

    cors_origins: str = "http://localhost:5173,http://localhost:3000"


@lru_cache
def get_settings() -> Settings:
    return Settings()
