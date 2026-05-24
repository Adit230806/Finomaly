-- Add persisted risk-engine fields for analytics and explainability

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS ip_address          TEXT,
  ADD COLUMN IF NOT EXISTS device_fingerprint  TEXT,
  ADD COLUMN IF NOT EXISTS confidence          NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS anomaly_reasons     TEXT[] NOT NULL DEFAULT '{}';

-- Backfill from legacy columns when present
UPDATE public.transactions
SET
  confidence = COALESCE(confidence, confidence_level, 0),
  anomaly_reasons = CASE
    WHEN anomaly_reasons IS NULL OR anomaly_reasons = '{}'
    THEN COALESCE(explanation, '{}')
    ELSE anomaly_reasons
  END
WHERE confidence = 0 OR anomaly_reasons = '{}';

CREATE INDEX IF NOT EXISTS idx_tx_user_confidence
  ON public.transactions (user_id, confidence DESC);

CREATE INDEX IF NOT EXISTS idx_tx_merchant_risk
  ON public.transactions (merchant, risk_score DESC);
