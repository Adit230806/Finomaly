"""Supabase integration for fetching trusted transactions (training + context)."""

from __future__ import annotations

import logging
from typing import Any

from app.config import get_settings

logger = logging.getLogger(__name__)


def get_supabase():
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        return None
    try:
        from supabase import create_client

        return create_client(settings.supabase_url, settings.supabase_service_role_key)
    except Exception as exc:
        logger.error("Supabase client init failed: %s", exc)
        return None


def fetch_trusted_transactions(user_id: str, limit: int = 100) -> list[dict[str, Any]]:
    """
    Load trusted-only rows for ML training / feature context.
    CRITICAL: risk_score < 30 AND is_anomaly = false — never include flagged txs.
    """
    client = get_supabase()
    if client is None:
        return []

    response = (
        client.table("transactions")
        .select(
            "amount, location, payment_method, ip_address, device_fingerprint, "
            "created_at, risk_score, is_anomaly"
        )
        .eq("user_id", user_id)
        .eq("is_anomaly", False)
        .lt("risk_score", 30)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )

    rows = response.data or []
    return [
        {
            "amount": r["amount"],
            "location": r["location"],
            "payment_method": r["payment_method"],
            "ip_address": r.get("ip_address"),
            "device_fingerprint": r.get("device_fingerprint"),
            "created_at": r.get("created_at"),
            "risk_score": r.get("risk_score", 0),
        }
        for r in rows
    ]
