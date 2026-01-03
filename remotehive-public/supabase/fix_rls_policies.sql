-- ==========================================
-- FIX RLS POLICIES FOR ONBOARDING
-- ==========================================

-- 1. COMPANIES TABLE
-- Allow anyone to insert a new company (needed for onboarding)
create policy "Enable insert for everyone" 
on public.companies 
for insert 
with check (true);

-- Allow anyone to update companies
create policy "Enable update for everyone" 
on public.companies 
for update 
using (true);

-- 2. USERS TABLE
-- Allow anyone to insert a new user (needed for syncing Clerk users)
create policy "Enable insert for everyone" 
on public.users 
for insert 
with check (true);

-- Allow anyone to read users (needed to check if user exists)
create policy "Enable read for everyone" 
on public.users 
for select 
using (true);

-- Allow anyone to update users
create policy "Enable update for everyone" 
on public.users 
for update 
using (true);
