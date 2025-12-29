# Step 6: Supabase Schema and Policies

## Tables (SQL)
```sql
-- users
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  role text check (role in ('admin','employer','seeker')) default 'seeker',
  created_at timestamptz default now()
);

-- companies
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  verified boolean default false,
  created_at timestamptz default now()
);

-- skills
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

-- jobs
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  title text not null,
  description text not null,
  remote_only boolean default true,
  seniority text,
  timezone text,
  skills text[] default '{}',
  published_at timestamptz default now(),
  status text check (status in ('draft','published','closed')) default 'draft'
);
create index if not exists jobs_published_idx on public.jobs (published_at desc);
create index if not exists jobs_remote_only_idx on public.jobs (remote_only);
create index if not exists jobs_skills_gin on public.jobs using gin (skills);

-- applications
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  status text check (status in ('applied','screen','interview','offer','rejected')) default 'applied',
  resume_url text,
  created_at timestamptz default now()
);
create index if not exists applications_job_idx on public.applications (job_id);
create index if not exists applications_user_idx on public.applications (user_id);
```

## Row Level Security (RLS)
- Enable RLS on public tables:
```sql
alter table public.users enable row level security;
alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
```

- Policies (examples):
```sql
-- Read published remote jobs for anon
create policy "read_published_remote_jobs" on public.jobs
  for select using (status = 'published' and remote_only = true);

-- Insert applications for authenticated users
create policy "insert_own_applications" on public.applications
  for insert to authenticated
  with check (auth.uid() = user_id);

-- Read own applications
create policy "read_own_applications" on public.applications
  for select using (auth.uid() = user_id);
```

## Notes
- Use service role keys only on secure backend for administrative actions.
- Keep public reads constrained to remote, published jobs.
- Add additional policies for employer job management and admin dashboards.

## Next
- Seed initial data for companies, jobs, and skills.
- Implement job listing and application submission via Supabase clients in both frontends.

