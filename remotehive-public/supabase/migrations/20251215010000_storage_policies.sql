-- Create a new storage bucket for resumes if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('Jobseeker-Resume', 'Jobseeker-Resume', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- Policy: Allow authenticated users to upload files to the Jobseeker-Resume bucket
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Jobseeker-Resume' AND
  auth.role() = 'authenticated'
);

-- Policy: Allow public access to view files in the Jobseeker-Resume bucket
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'Jobseeker-Resume'
);

-- Policy: Allow authenticated users to update files in this bucket.
CREATE POLICY "Allow authenticated updates"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Jobseeker-Resume' AND
  auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to delete files in this bucket
CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'Jobseeker-Resume' AND
  auth.role() = 'authenticated'
);
