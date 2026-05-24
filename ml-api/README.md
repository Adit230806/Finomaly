# Finomaly ML API

Hybrid fraud detection: **Rule Engine (40%)** + **Isolation Forest (60%)**.

## Quick start

```bash
pip install -r requirements.txt
cp .env.example .env
python scripts/train_model.py
uvicorn app.main:app --reload --port 8000
```

See [../ML_DEPLOYMENT.md](../ML_DEPLOYMENT.md) for full setup.
