-- Create job_roles table
CREATE TABLE IF NOT EXISTS public.job_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;

-- Create Policy for Public Read Access
CREATE POLICY "Allow public read access" ON public.job_roles
    FOR SELECT USING (true);

-- Create Policy for Service Role Write Access (Implicit, but good to be explicit if needed for specific roles)
-- Service role bypasses RLS, so no specific policy needed for it usually.
