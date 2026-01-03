-- Add missing profile fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS phone_country_code text DEFAULT 'IN',
ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS address_line1 text,
ADD COLUMN IF NOT EXISTS address_line2 text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS zip_code text,
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS work_experience jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS education jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS projects jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS job_preferences jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}';

-- Create indexes for searchability (slugs/finding by fields)
CREATE INDEX IF NOT EXISTS users_skills_idx ON public.users USING gin(skills);
CREATE INDEX IF NOT EXISTS users_city_idx ON public.users(city);
CREATE INDEX IF NOT EXISTS users_country_idx ON public.users(country);
CREATE INDEX IF NOT EXISTS users_experience_level_idx ON public.users(experience_level);
CREATE INDEX IF NOT EXISTS users_full_name_idx ON public.users USING gin(to_tsvector('english', full_name));
