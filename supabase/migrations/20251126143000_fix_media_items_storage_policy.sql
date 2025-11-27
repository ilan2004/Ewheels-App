-- Migration: Fix Media Items Storage Policies
-- Date: 2025-11-26
-- Purpose: Add RLS policies for the media-items storage bucket to allow uploads

-- 1. Ensure the bucket exists (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-items', 'media-items', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated uploads to media-items" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated viewing of media-items" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own media-items" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own media-items" ON storage.objects;

-- 3. Create policies

-- Allow authenticated users to upload to their own folder in media-items
-- Path format: {user_id}/{filename}
CREATE POLICY "Allow authenticated uploads to media-items"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media-items' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view any file in media-items (since they might need to see others' media if shared/assigned)
-- Or restrict to own files? For now, let's allow read access to authenticated users as these are likely shared in the team.
CREATE POLICY "Allow authenticated viewing of media-items"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'media-items');

-- Allow users to update their own files
CREATE POLICY "Allow users to update own media-items"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media-items' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete own media-items"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'media-items' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
