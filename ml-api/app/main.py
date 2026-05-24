"""
Finomaly ML API — FastAPI entry point.

Hybrid fraud detection: Rule Engine (40%) + Isolation Forest (60%)
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, predict, train
from app.config import get_settings
from app.logging_config import setup_logging
from app.ml.model_store import get_model

setup_logging()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Warm-load model at startup (optional if file exists)
    try:
        get_model()
    except Exception:
        pass
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]

    app = FastAPI(
        title="Finomaly Fraud Detection API",
        description="Hybrid ML + rule-based transaction anomaly detection",
        version="1.0.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(predict.router)
    app.include_router(train.router)

    return app


app = create_app()
