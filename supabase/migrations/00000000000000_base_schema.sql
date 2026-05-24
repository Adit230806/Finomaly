-- =============================================================================
-- FINOMALY — COMPLETE BASE SCHEMA  (v3 — fully corrected)
--
-- Paste this entire file into the Supabase SQL Editor and click Run.
-- Safe to run on a completely empty database or one with partial objects.
--
-- EXECUTION ORDER (strict dependency chain):
--   1.  Extensions
--   2.  Enum type creation
--   3.  Enum value additions      ← bare top-level, NOT inside DO blocks
--   4.  Core tables               (profiles, user_roles)
--   5.  Domain tables             (transactions, alerts)
--   6.  Helper functions          (has_role, get_my_role)
--   7.  Trigger function + trigger (handle_new_user)
--   8.  RLS enable
--   9.  RLS policies              ← only AFTER tables exist
--   10. Realtime publication
--   11. Indexes
-- =============================================================================


-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================================
-- 2. ENUM TYPE — app_role
--
-- CREATE TYPE inside a DO block is fine.
-- ALTER TYPE ADD VALUE must be a bare top-level statement — Postgres forbids
-- it inside any transaction block or anonymous DO block.
-- =============================================================================

-- Create the type only if it does not exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_type t
    JOIN   pg_namespace n ON n.oid = t.typnamespace
    WHERE  t.typname = 'app_role'
      AND  n.nspname = 'public'
  ) THEN
    CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'analyst');
  END IF;
END;
$$;


-- =============================================================================
-- 3. ENUM VALUE ADDITIONS
--
-- These MUST be bare top-level statements.
-- IF NOT EXISTS (Postgres 9.6+) makes them safe to re-run.
-- =============================================================================

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'user';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'analyst';


-- =============================================================================
-- 4a. TABLE — profiles
--
-- One row per auth.users row, created automatically by the trigger.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID        NOT NULL,
  name       TEXT,
  email      TEXT,
  role       TEXT        NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE
);


-- =============================================================================
-- 4b. TABLE — user_roles
--
-- Typed role store — used by has_role() and get_my_role().
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id         UUID              NOT NULL DEFAULT gen_random_uuid(),
  user_id    UUID              NOT NULL,
  role       public.app_role   NOT NULL,
  created_at TIMESTAMPTZ       NOT NULL DEFAULT now(),

  CONSTRAINT user_roles_pkey        PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT user_roles_user_role_unique UNIQUE (user_id, role)
);


-- =============================================================================
-- 4c. TABLE — transactions
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.transactions (
  id               UUID          NOT NULL DEFAULT gen_random_uuid(),
  user_id          UUID          NOT NULL,
  email            TEXT          NOT NULL DEFAULT '',
  amount           NUMERIC(12,2) NOT NULL,
  merchant         TEXT          NOT NULL,
  category         TEXT          NOT NULL DEFAULT 'Shopping',
  location         TEXT          NOT NULL,
  payment_method   TEXT          NOT NULL,
  risk_score       INT           NOT NULL DEFAULT 0,
  confidence_level NUMERIC(5,2)  NOT NULL DEFAULT 0,
  is_anomaly       BOOLEAN       NOT NULL DEFAULT false,
  explanation      TEXT[]        NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);


-- =============================================================================
-- 4d. TABLE — alerts
--
-- Must come AFTER transactions because of the FK on transaction_id.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.alerts (
  id             UUID        NOT NULL DEFAULT gen_random_uuid(),
  transaction_id UUID        NOT NULL,
  user_id        UUID        NOT NULL,
  email          TEXT        NOT NULL DEFAULT '',
  risk_score     INT         NOT NULL,
  reason         TEXT        NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'New',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT alerts_pkey PRIMARY KEY (id),
  CONSTRAINT alerts_transaction_id_fkey
    FOREIGN KEY (transaction_id) REFERENCES public.transactions (id) ON DELETE CASCADE,
  CONSTRAINT alerts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);


-- =============================================================================
-- 5. BACKFILL COLUMNS
--
-- These DO blocks handle the case where the tables already existed from an
-- older migration that was missing these columns.
-- They are safe no-ops when the columns already exist.
-- =============================================================================

DO $$
BEGIN
  -- profiles.role
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE  table_schema = 'public'
      AND  table_name   = 'profiles'
      AND  column_name  = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
  END IF;

  -- transactions.email
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE  table_schema = 'public'
      AND  table_name   = 'transactions'
      AND  column_name  = 'email'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN email TEXT NOT NULL DEFAULT '';
  END IF;

  -- transactions.category
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE  table_schema = 'public'
      AND  table_name   = 'transactions'
      AND  column_name  = 'category'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN category TEXT NOT NULL DEFAULT 'Shopping';
  END IF;

  -- alerts.email
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE  table_schema = 'public'
      AND  table_name   = 'alerts'
      AND  column_name  = 'email'
  ) THEN
    ALTER TABLE public.alerts ADD COLUMN email TEXT NOT NULL DEFAULT '';
  END IF;
END;
$$;


-- =============================================================================
-- 6a. FUNCTION — has_role(user_id, role)
--
-- SECURITY DEFINER so it bypasses RLS on user_roles when called from policies.
-- Called only by authenticated users (GRANT below).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.has_role(
  _user_id UUID,
  _role    public.app_role
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   public.user_roles
    WHERE  user_id = _user_id
      AND  role    = _role
  );
$$;

REVOKE ALL  ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
REVOKE ALL  ON FUNCTION public.has_role(UUID, public.app_role) FROM anon;
GRANT  EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;


-- =============================================================================
-- 6b. FUNCTION — get_my_role()
--
-- RPC helper — frontend calls supabase.rpc('get_my_role') after login
-- to get the canonical role string from the database.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT
  FROM   public.user_roles
  WHERE  user_id = auth.uid()
  ORDER  BY created_at
  LIMIT  1;
$$;

REVOKE ALL  ON FUNCTION public.get_my_role() FROM PUBLIC;
REVOKE ALL  ON FUNCTION public.get_my_role() FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_my_role() TO authenticated;


-- =============================================================================
-- 7. TRIGGER FUNCTION — handle_new_user()
--
-- Fires on every INSERT into auth.users (email signup + OAuth).
-- Creates the matching profile and user_roles rows.
--
-- Edge cases handled:
--   • GitHub OAuth  → no 'role' in metadata → defaults to 'user'
--   • 'analyst'     → normalised to 'admin' for legacy accounts
--   • bad role str  → caught by EXCEPTION block → defaults to 'user'
--   • re-runs       → ON CONFLICT DO UPDATE / DO NOTHING
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _raw_role TEXT;
  _role     public.app_role;
BEGIN
  _raw_role := COALESCE(NEW.raw_user_meta_data->>'role', '');

  -- Safe cast with fallback
  BEGIN
    IF _raw_role = '' THEN
      _role := 'user'::public.app_role;
    ELSE
      _role := _raw_role::public.app_role;
    END IF;
  EXCEPTION
    WHEN invalid_text_representation THEN _role := 'user'::public.app_role;
    WHEN OTHERS                      THEN _role := 'user'::public.app_role;
  END;

  -- Normalise legacy value
  IF _role = 'analyst' THEN
    _role := 'admin'::public.app_role;
  END IF;

  -- Upsert profile
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'name'),      ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
      NEW.email
    ),
    COALESCE(NEW.email, ''),
    _role::TEXT
  )
  ON CONFLICT (id) DO UPDATE
    SET name  = EXCLUDED.name,
        email = EXCLUDED.email,
        role  = EXCLUDED.role;

  -- Insert role row (idempotent)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;

-- Attach trigger — DROP first so this script is safe to re-run
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- =============================================================================
-- 8. ENABLE ROW LEVEL SECURITY
--
-- Must happen AFTER tables are created.
-- Enabling RLS on a table that already has it enabled is a no-op.
-- =============================================================================

ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts       ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- 9. RLS POLICIES
--
-- All policies come AFTER the tables they reference.
-- Every DROP uses IF EXISTS so re-runs are safe.
--
-- Security model:
--   • Every row has a user_id column.
--   • auth.uid() = user_id  →  you own this row.
--   • Both 'user' and 'admin' roles see ONLY their own rows.
--   • Role-based UI differences are enforced in the frontend, not here.
-- =============================================================================

-- ── profiles ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "profiles_select_own_or_analyst" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own"            ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"            ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"            ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING ( auth.uid() = id );

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING     ( auth.uid() = id )
  WITH CHECK ( auth.uid() = id );


-- ── user_roles ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "user_roles_select_own_or_analyst" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_own"            ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_own"            ON public.user_roles;

CREATE POLICY "user_roles_select_own"
  ON public.user_roles FOR SELECT
  USING ( auth.uid() = user_id );

-- No INSERT policy: rows are inserted only by the SECURITY DEFINER trigger.


-- ── transactions ──────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "tx_select_own_or_analyst" ON public.transactions;
DROP POLICY IF EXISTS "tx_update_own_or_analyst" ON public.transactions;
DROP POLICY IF EXISTS "tx_select_own"            ON public.transactions;
DROP POLICY IF EXISTS "tx_insert_own"            ON public.transactions;
DROP POLICY IF EXISTS "tx_update_own"            ON public.transactions;

CREATE POLICY "tx_select_own"
  ON public.transactions FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "tx_insert_own"
  ON public.transactions FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "tx_update_own"
  ON public.transactions FOR UPDATE
  USING     ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );


-- ── alerts ────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "alerts_select_own_or_analyst" ON public.alerts;
DROP POLICY IF EXISTS "alerts_update_own_or_analyst" ON public.alerts;
DROP POLICY IF EXISTS "alerts_select_own"            ON public.alerts;
DROP POLICY IF EXISTS "alerts_insert_own"            ON public.alerts;
DROP POLICY IF EXISTS "alerts_update_own"            ON public.alerts;

CREATE POLICY "alerts_select_own"
  ON public.alerts FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "alerts_insert_own"
  ON public.alerts FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "alerts_update_own"
  ON public.alerts FOR UPDATE
  USING     ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );


-- =============================================================================
-- 10. REALTIME PUBLICATION
--
-- Wrapped in a DO block because ALTER PUBLICATION has no IF NOT EXISTS.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE  pubname   = 'supabase_realtime'
      AND  schemaname = 'public'
      AND  tablename  = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE  pubname   = 'supabase_realtime'
      AND  schemaname = 'public'
      AND  tablename  = 'alerts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
  END IF;
END;
$$;

-- Full replica identity: UPDATE/DELETE payloads carry the complete old row
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.alerts       REPLICA IDENTITY FULL;


-- =============================================================================
-- 11. INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_tx_user_created
  ON public.transactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tx_user_anomaly
  ON public.transactions (user_id, is_anomaly)
  WHERE is_anomaly = true;

CREATE INDEX IF NOT EXISTS idx_alerts_user_created
  ON public.alerts (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_user_status
  ON public.alerts (user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
  ON public.user_roles (user_id);


-- =============================================================================
-- 12. TABLE PRIVILEGES (required alongside RLS)
--
-- Without these GRANTs, PostgREST returns:
--   "permission denied for table transactions" (HTTP 403)
-- =============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

GRANT SELECT, INSERT, UPDATE ON public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.alerts       TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles     TO authenticated;
GRANT SELECT                 ON public.user_roles   TO authenticated;
