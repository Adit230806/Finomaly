#!/usr/bin/env bash
cd "$(dirname "$0")"
python scripts/train_model.py
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
