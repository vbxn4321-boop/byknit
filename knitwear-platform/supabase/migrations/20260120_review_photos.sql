-- SQL to add image support for reviews
-- 1. Create the 'reviews' storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies for review-images
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'review-images');

CREATE POLICY "Users can upload review images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'review-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Add 'images' column to 'reviews' table
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
