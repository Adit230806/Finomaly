# Finomaly ML Fraud Detection — Deployment Guide

## Architecture

```
React (Vite)  →  mlRiskService.ts  →  FastAPI (Isolation Forest + Rules)
                      ↓
                 Supabase (transactions, alerts, trusted-only learning)
```

**Hybrid score:** `finalScore = (ruleScore × 0.4) + (mlScore × 0.6)`

**Trusted learning:** Only transactions with `is_anomaly = false` AND `risk_score < 30` train the model and update behavioral baselines.

---

## 1. Database (Supabase)

Run migrations in SQL Editor (in order):

1. `supabase/migrations/20260524140000_transaction_risk_columns.sql`
2. `supabase/migrations/20260524150000_add_risk_status_columns.sql`
3. `supabase/migrations/20260524160000_add_ml_score_columns.sql`

New columns: `rule_score`, `ml_score`, `final_score`, `detection_method`

---

## 2. ML API (Local)

```powershell
cd ml-api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Edit `.env`:

- `ML_API_KEY` — must match `VITE_ML_API_KEY` in frontend
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (optional, for `/train` from DB)

### Train Isolation Forest (trusted rows only)

```powershell
python scripts/train_model.py
```

This reads `data/training_data.csv`, **skips** rows where `is_anomaly=1` or `risk_score≥30`, and saves:

- `models/isolation_forest.joblib`
- `models/scaler.joblib`

### Start API

```powershell
.\run.ps1
# or
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Health check: `GET http://localhost:8000/health`

---

## 3. Frontend

Add to `.env`:

```env
VITE_ML_API_URL=http://localhost:8000
VITE_ML_API_KEY=dev-key-change-me
```

```powershell
npm run dev
```

If ML API is down, the app **falls back** to local rule-only scoring (`rules_fallback`).

---

## 4. API Reference

### `POST /api/v1/predict`

Headers: `X-API-Key: <ML_API_KEY>`

```json
{
  "user_id": "uuid",
  "amount": 85000,
  "payment_method": "Crypto",
  "location": "Lagos, NG",
  "ip_address": "203.0.113.50",
  "device_fingerprint": "device-unknown",
  "failed_login_attempts": 3,
  "trusted_transactions": []
}
```

Response:

```json
{
  "isAnomaly": true,
  "mlScore": 87,
  "ruleScore": 72,
  "finalScore": 81,
  "confidence": "High",
  "reasons": ["High transaction amount", "New device detected"],
  "status": "Anomalous",
  "contributesToProfile": false
}
```

### `POST /api/v1/train`

Retrain from CSV and/or Supabase trusted rows.

---

## 5. Docker (ML API)

```bash
cd ml-api
docker build -t finomaly-ml .
docker run -p 8000:8000 -e ML_API_KEY=prod-secret finomaly-ml
```

Train before deploy or mount `models/` volume.

---

## 6. Production Checklist

| Item | Action |
|------|--------|
| API key | Strong `ML_API_KEY`, never commit |
| CORS | Set `CORS_ORIGINS` to your Vercel URL |
| Model | Run `train_model.py` after enough trusted data |
| Supabase RLS | Users can only update own transactions |
| Vercel | Set `VITE_ML_API_URL` to hosted ML API |
| Retrain | Schedule weekly on trusted-only export |

---

## Folder Structure

```
ml-api/
  app/
    api/routes/     # health, predict, train
    core/           # rule_engine, hybrid_scorer
    ml/             # feature_engineering, isolation_forest
    schemas/        # request/response models
    services/       # prediction, supabase
  scripts/train_model.py
  data/training_data.csv
  models/*.joblib
src/services/mlRiskService.ts
src/services/transactionService.ts
```
