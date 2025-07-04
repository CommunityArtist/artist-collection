/*
  # Fix storage bucket policy for public access

  1. Changes
    - Drop existing policy
    - Create new policy with correct public access settings
    - Ensure bucket is set to public
*/

-- First ensure the bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'prompt-media';

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Create new public access policy
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'prompt-media');

-- Ensure authenticated users can still upload files
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prompt-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);