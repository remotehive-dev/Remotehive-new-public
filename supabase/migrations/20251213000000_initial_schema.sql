-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. COMPANIES TABLE
-- ==========================================
create table public.companies (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  logo_url text,
  website_url text,
  description text,
  rating numeric(3, 1) default 0,
  review_count integer default 0,
  tags text[] default '{}',
  type text check (type in ('Corporate', 'MNC', 'Startup', 'Agency', 'Consultancy')),
  locations text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies for Companies
alter table public.companies enable row level security;

-- Everyone can read companies
create policy "Companies are viewable by everyone" 
  on public.companies for select 
  using (true);

-- Only authenticated admins can insert/update/delete (Placeholder for now)
-- In a real app, you'd check a user_role table or metadata
create policy "Admins can modify companies" 
  on public.companies for all 
  using (auth.role() = 'authenticated'); -- Simplified for dev

-- ==========================================
-- 2. JOBS TABLE
-- ==========================================
create table public.jobs (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  title text not null,
  slug text unique not null,
  location text not null, -- Display string like "Remote (Worldwide)"
  type text check (type in ('full-time', 'part-time', 'contract', 'freelance', 'internship')),
  salary_range text,
  description text, -- Markdown or HTML
  requirements text[],
  benefits text[],
  tags text[] default '{}',
  status text default 'active' check (status in ('active', 'closed', 'draft')),
  posted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies for Jobs
alter table public.jobs enable row level security;

-- Everyone can read active jobs
create policy "Active jobs are viewable by everyone" 
  on public.jobs for select 
  using (status = 'active');

-- Authenticated users (Employers) can create jobs
create policy "Employers can create jobs" 
  on public.jobs for insert 
  with check (auth.role() = 'authenticated');

-- ==========================================
-- 3. SEED DATA (Optional - Run if you want initial data)
-- ==========================================

-- Insert Companies
INSERT INTO public.companies (id, name, slug, logo_url, rating, review_count, tags, type, locations) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'TechFlow', 'techflow', 'https://www.google.com/s2/favicons?domain=stripe.com&sz=128', 4.5, 120, ARRAY['MNC', 'Fintech'], 'MNC', ARRAY['Remote', 'San Francisco']),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Creative Studio', 'creative-studio', 'https://www.google.com/s2/favicons?domain=airbnb.com&sz=128', 4.2, 85, ARRAY['Startup', 'Design'], 'Startup', ARRAY['Remote', 'Berlin']),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Streamline', 'streamline', 'https://www.google.com/s2/favicons?domain=uber.com&sz=128', 3.9, 210, ARRAY['MNC', 'Logistics'], 'MNC', ARRAY['Remote', 'New York']);

-- Insert Jobs
INSERT INTO public.jobs (title, slug, company_id, location, type, salary_range, tags, status) VALUES
('Senior Frontend Engineer', 'senior-frontend-engineer-techflow', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Remote (Worldwide)', 'full-time', '$120k - $160k', ARRAY['React', 'TypeScript', 'Engineering'], 'active'),
('Product Designer', 'product-designer-creative-studio', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Remote (Europe)', 'contract', '$80/hr', ARRAY['Figma', 'UI/UX', 'Design'], 'active'),
('Backend Developer (Go)', 'backend-developer-go-streamline', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Remote (US)', 'full-time', '$140k - $180k', ARRAY['Go', 'PostgreSQL', 'Engineering'], 'active');
