"""
Rule-based fraud engine — mirrors Finomaly TypeScript rules.

Produces ruleScore (0–100) and human-readable reasons.
Trained ONLY on trusted patterns when comparing amounts/locations.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

HIGH_AMOUNT_THRESHOLD = 20_000
DEFAULT_HOME = "Pune, MH"


@dataclass
class RuleResult:
    rule_score: int
    reasons: list[str]


def _normalize_city(location: str) -> str:
    return location.split(",")[0].strip().lower()


def _trusted_stats(trusted: list[dict[str, Any]]) -> dict[str, float]:
    amounts = [float(t["amount"]) for t in trusted if "amount" in t]
    if not amounts:
        return {"avg": 0.0, "median": 0.0, "std": 0.0, "count": 0}
    import statistics

    return {
        "avg": statistics.mean(amounts),
        "median": statistics.median(amounts),
        "std": statistics.pstdev(amounts) if len(amounts) > 1 else 0.0,
        "count": float(len(amounts)),
    }


def evaluate_rules(
    amount: float,
    payment_method: str,
    location: str,
    trusted: list[dict[str, Any]],
    home_location: str = DEFAULT_HOME,
    failed_login_attempts: int = 0,
    device_change: float = 0.0,
    ip_mismatch: float = 0.0,
) -> RuleResult:
    score = 0
    reasons: list[str] = []

    if amount > HIGH_AMOUNT_THRESHOLD:
        score += 60
        reasons.append("High transaction amount")

    if failed_login_attempts >= 3:
        score += 25
        reasons.append("Multiple failed login attempts")

    if device_change >= 1.0:
        score += 20
        reasons.append("New device detected")

    if ip_mismatch >= 1.0:
        score += 15
        reasons.append("IP address mismatch")

    stats = _trusted_stats(trusted)
    home = _normalize_city(home_location)

    if stats["count"] == 0:
        if _normalize_city(location) != home:
            score += 40
            reasons.append("Location mismatch (no trusted history)")
        if payment_method == "Crypto":
            score += 25
            reasons.append("High-risk payment type (Crypto)")
        elif payment_method == "Bank Transfer" and amount > 25_000:
            score += 20
            reasons.append("Large bank transfer")
    else:
        cap = max(stats["avg"] * 2, stats["median"] * 2, stats["avg"] + stats["std"] * 2)
        if amount > cap:
            score += 40
            reasons.append(
                f"Amount exceeds trusted pattern (median ₹{int(stats['median'])})"
            )

        known_cities = {_normalize_city(t.get("location", "")) for t in trusted}
        if _normalize_city(location) not in known_cities and _normalize_city(location) != home:
            score += 40
            reasons.append("Location not in trusted history")

        types = {t.get("payment_method") for t in trusted}
        if stats["count"] >= 3 and payment_method not in types:
            score += 20
            reasons.append(f"Unusual payment type ({payment_method})")

        if payment_method == "Crypto":
            score += 25
            reasons.append("High-risk payment type (Crypto)")
        elif payment_method == "Bank Transfer" and amount > 25_000:
            score += 20
            reasons.append("Large bank transfer")

    return RuleResult(rule_score=min(100, score), reasons=reasons or ["No rule-based risk signals"])
