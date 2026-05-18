-- 1. posts 테이블에 images (이미지 URL 배열) 컬럼 추가
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS images text[];

-- 2. 이미지를 업로드하기 위한 Storage Bucket 생성 (존재하지 않을 때만 생성)
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-images', 'community-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Bucket에 대한 RLS 정책 활성화 및 안전 정책 추가
CREATE POLICY "Allow public read access to community-images"
  ON storage.objects FOR SELECT USING (bucket_id = 'community-images');

CREATE POLICY "Allow authenticated upload to community-images"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'community-images' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Allow owners to delete their community-images"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'community-images' AND auth.uid() = owner
  );
