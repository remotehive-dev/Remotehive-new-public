-- ==========================================
-- 5. ADD APPLICATION URL TO JOBS
-- ==========================================
alter table public.jobs add column application_url text;
