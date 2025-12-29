-- ==========================================
-- 4. USERS TABLE
-- ==========================================
create table public.users (
  id uuid default uuid_generate_v4() primary key,
  clerk_id text unique not null,
  role text check (role in ('admin', 'employer', 'jobseeker')) default 'jobseeker',
  company_id uuid references public.companies(id) on delete set null,
  full_name text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies for Users
alter table public.users enable row level security;

-- Users can view their own profile
create policy "Users can view own profile" 
  on public.users for select 
  using (clerk_id = auth.uid()::text); -- Note: auth.uid() in Supabase is usually UUID, but Clerk IDs are text. 
  -- We might need a custom function or just store Clerk ID in a text field and match it.
  -- For now, assuming we handle auth verification in the app layer or via a custom JWT claim.

-- Simplified RLS for development (allow all authenticated for now)
create policy "Authenticated users can view profiles"
  on public.users for select
  using (auth.role() = 'authenticated');

create policy "Users can update own profile"
  on public.users for update
  using (auth.role() = 'authenticated'); -- Logic to be refined

create policy "Users can insert their own profile"
  on public.users for insert
  with check (auth.role() = 'authenticated');
