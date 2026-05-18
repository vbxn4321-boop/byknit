-- 1. Ensure Reviews Table exists
CREATE TABLE IF NOT EXISTS public.reviews (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) not null,
    pattern_id uuid references public.patterns(id) not null,
    rating integer not null check (rating >= 1 and rating <= 5),
    content text not null,
    images JSONB DEFAULT '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, pattern_id)
);

-- Ensure 'images' column exists (in case table was created before)
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Enable RLS on reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Select policy
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Reviews are viewable by everyone.') THEN
        CREATE POLICY "Reviews are viewable by everyone." ON public.reviews FOR SELECT USING (true);
    END IF;
END $$;

-- 2. Storage Bucket for review-images
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for review-images
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Review images are public') THEN
        CREATE POLICY "Review images are public" ON storage.objects FOR SELECT TO public USING (bucket_id = 'review-images');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can upload own review images') THEN
        CREATE POLICY "Users can upload own review images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
            bucket_id = 'review-images' AND (storage.foldername(name))[1] = auth.uid()::text
        );
    END IF;
END $$;

-- 3. FIX: Allow users to insert their own orders (Unique names to avoid collision)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND schemaname = 'public' AND policyname = 'Allow users to insert own orders') THEN
        CREATE POLICY "Allow users to insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND schemaname = 'public' AND policyname = 'Allow users to update own orders') THEN
        CREATE POLICY "Allow users to update own orders" ON public.orders FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

