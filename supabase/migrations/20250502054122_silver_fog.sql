/*
  # Create storage bucket for prompt media

  1. New Storage Bucket
    - Creates a new public bucket called 'prompt-media' for storing images and videos
  
  2. Security
    - Enable public access to view media files
    - Allow authenticated users to upload media files to their own folder
*/

-- Create a new public bucket for storing prompt media
INSERT INTO storage.buckets (id, name, public)
VALUES ('prompt-media', 'prompt-media', true);

-- Allow public access to view files
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'prompt-media');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'prompt-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'prompt-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'prompt-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'prompt-media' AND
  (storage.foldername(name))[1] = auth.uid()::text
);