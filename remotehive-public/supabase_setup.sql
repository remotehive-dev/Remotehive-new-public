-- 1. Create the storage bucket for company logos
insert into storage.buckets (id, name, public)
values ('company-logos', 'company-logos', true)
on conflict (id) do nothing;

-- 2. Set up security policy for the bucket
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'company-logos' );

drop policy if exists "Authenticated Upload" on storage.objects;
create policy "Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'company-logos' AND auth.role() = 'authenticated' );

drop policy if exists "Authenticated Update" on storage.objects;
create policy "Authenticated Update"
  on storage.objects for update
  with check ( bucket_id = 'company-logos' AND auth.role() = 'authenticated' );

-- 3. Update companies table with new fields
alter table public.companies 
add column if not exists domain_verified boolean default false,
add column if not exists sso_enabled boolean default false,
add column if not exists sso_config jsonb default '{}'::jsonb;

-- 4. Create policy to allow updates to companies
-- FIX: Use (auth.jwt() ->> 'sub') instead of auth.uid() to avoid UUID=TEXT error with Clerk IDs
drop policy if exists "Enable update for users based on company_id" on public.companies;
create policy "Enable update for users based on company_id"
on public.companies for update
using (
  exists (
    select 1 from public.users
    where users.company_id = companies.id
    and users.clerk_id = (auth.jwt() ->> 'sub')
  )
);
