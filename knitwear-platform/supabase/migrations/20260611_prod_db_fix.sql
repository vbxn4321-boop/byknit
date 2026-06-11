-- 1. ALTER public.patterns TABLE TO ADD MISSING COLUMNS
ALTER TABLE public.patterns ADD COLUMN IF NOT EXISTS grid_data jsonb;
ALTER TABLE public.patterns ADD COLUMN IF NOT EXISTS palette jsonb;
ALTER TABLE public.patterns ADD COLUMN IF NOT EXISTS grid_width integer;
ALTER TABLE public.patterns ADD COLUMN IF NOT EXISTS grid_height integer;
ALTER TABLE public.patterns ADD COLUMN IF NOT EXISTS price_krw numeric DEFAULT 0;
ALTER TABLE public.patterns ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.patterns ADD COLUMN IF NOT EXISTS previous_price numeric;
ALTER TABLE public.patterns ADD COLUMN IF NOT EXISTS price_updated_at timestamp with time zone;
ALTER TABLE public.patterns ADD COLUMN IF NOT EXISTS status text DEFAULT 'published';
ALTER TABLE public.patterns ADD COLUMN IF NOT EXISTS content jsonb;
ALTER TABLE public.patterns ADD COLUMN IF NOT EXISTS discount_percentage integer DEFAULT 0;
ALTER TABLE public.patterns ADD COLUMN IF NOT EXISTS is_on_sale boolean DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.patterns.grid_data IS 'Grid editor data: 2D array of color indices from palette';
COMMENT ON COLUMN public.patterns.palette IS 'Color palette: array of hex color strings used in grid';
COMMENT ON COLUMN public.patterns.grid_width IS 'Number of columns in the grid pattern';
COMMENT ON COLUMN public.patterns.grid_height IS 'Number of rows in the grid pattern';

-- 2. ALTER public.posts TABLE TO ADD MISSING COLUMNS
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS images text[];

-- 3. CREATE public.pattern_views TABLE
CREATE TABLE IF NOT EXISTS public.pattern_views (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    pattern_id uuid REFERENCES public.patterns(id) ON DELETE CASCADE NOT NULL,
    viewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    viewed_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pattern_views_pattern_id ON public.pattern_views(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_views_viewed_at ON public.pattern_views(viewed_at);

ALTER TABLE public.pattern_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert views" ON public.pattern_views;
CREATE POLICY "Anyone can insert views" ON public.pattern_views FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can select own patterns views" ON public.pattern_views;
CREATE POLICY "Users can select own patterns views" ON public.pattern_views FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.patterns
        WHERE id = pattern_views.pattern_id AND designer_id = auth.uid()
    )
);

-- 4. CREATE public.pattern_likes TABLE
CREATE TABLE IF NOT EXISTS public.pattern_likes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    pattern_id uuid REFERENCES public.patterns(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(pattern_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_pattern_likes_pattern_id ON public.pattern_likes(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_likes_created_at ON public.pattern_likes(created_at);

ALTER TABLE public.pattern_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view pattern likes" ON public.pattern_likes;
CREATE POLICY "Anyone can view pattern likes" ON public.pattern_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can toggle likes" ON public.pattern_likes;
CREATE POLICY "Authenticated users can toggle likes" ON public.pattern_likes FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 5. RE-APPLY RLS POLICIES FOR public.patterns TO ENSURE COMPATIBILITY WITH author_id
DROP POLICY IF EXISTS "Anyone can view patterns" ON public.patterns;
DROP POLICY IF EXISTS "Designers can insert own patterns" ON public.patterns;
DROP POLICY IF EXISTS "Designers can update own patterns" ON public.patterns;
DROP POLICY IF EXISTS "Designers can delete own patterns" ON public.patterns;

CREATE POLICY "Anyone can view patterns" 
ON public.patterns FOR SELECT 
USING (true);

CREATE POLICY "Designers can insert own patterns" 
ON public.patterns FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = designer_id OR auth.uid() = author_id);

CREATE POLICY "Designers can update own patterns" 
ON public.patterns FOR UPDATE 
TO authenticated 
USING (auth.uid() = designer_id OR auth.uid() = author_id)
WITH CHECK (auth.uid() = designer_id OR auth.uid() = author_id);

CREATE POLICY "Designers can delete own patterns" 
ON public.patterns FOR DELETE 
TO authenticated 
USING (auth.uid() = designer_id OR auth.uid() = author_id);
