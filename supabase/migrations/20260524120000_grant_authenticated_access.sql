-- =============================================================================
-- Fix 403 "permission denied for table transactions/alerts"
--
-- RLS policies alone are not enough: the `authenticated` role must have
-- table-level GRANTs. Run this in Supabase SQL Editor if migrations are not
-- applied automatically.
-- =============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

GRANT SELECT, INSERT, UPDATE ON public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.alerts       TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles     TO authenticated;
GRANT SELECT                 ON public.user_roles   TO authenticated;
