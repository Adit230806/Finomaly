Set-Location $PSScriptRoot
python scripts/train_model.py
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
