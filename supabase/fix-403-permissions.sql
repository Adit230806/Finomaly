-- Run once in Supabase Dashboard → SQL Editor → Run
-- Fixes: permission denied for table transactions / alerts (HTTP 403)

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

GRANT SELECT, INSERT, UPDATE ON public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.alerts       TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles     TO authenticated;
GRANT SELECT                 ON public.user_roles   TO authenticated;
