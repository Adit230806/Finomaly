-- Hybrid ML + rule scoring columns for Finomaly fraud engine

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS rule_score INTEGER,
  ADD COLUMN IF NOT EXISTS ml_score INTEGER,
  ADD COLUMN IF NOT EXISTS final_score INTEGER,
  ADD COLUMN IF NOT EXISTS detection_method TEXT NOT NULL DEFAULT 'hybrid';

COMMENT ON COLUMN public.transactions.rule_score IS 'Rule engine score 0-100';
COMMENT ON COLUMN public.transactions.ml_score IS 'Isolation Forest score 0-100';
COMMENT ON COLUMN public.transactions.final_score IS '0.4*rule + 0.6*ml';
COMMENT ON COLUMN public.transactions.detection_method IS 'hybrid | rules_only | ml_only';

-- Backfill from existing risk_score where hybrid columns are null
UPDATE public.transactions
SET
  rule_score = COALESCE(rule_score, risk_score),
  ml_score = COALESCE(ml_score, risk_score),
  final_score = COALESCE(final_score, risk_score)
WHERE final_score IS NULL AND risk_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_final_score
  ON public.transactions (user_id, final_score DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_trusted_learning
  ON public.transactions (user_id, created_at DESC)
  WHERE is_anomaly = false AND risk_score < 30;
