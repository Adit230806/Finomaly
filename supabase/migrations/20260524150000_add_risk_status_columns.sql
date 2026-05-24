-- Risk status labels for simplified anomaly engine (Normal / Suspicious / Anomalous)

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS risk_status TEXT NOT NULL DEFAULT 'Normal',
  ADD COLUMN IF NOT EXISTS confidence_label TEXT NOT NULL DEFAULT 'Low Risk';

-- Backfill from existing rows
UPDATE public.transactions
SET
  risk_status = CASE
    WHEN is_anomaly = true OR risk_score >= 60 THEN 'Anomalous'
    WHEN risk_score >= 30 THEN 'Suspicious'
    ELSE 'Normal'
  END,
  confidence_label = CASE
    WHEN risk_score >= 60 THEN 'High Risk'
    WHEN risk_score >= 30 THEN 'Medium Risk'
    ELSE 'Low Risk'
  END
WHERE risk_status = 'Normal' AND risk_score > 0;
