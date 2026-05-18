-- Analytics & Price Tracking Tables for Seller Dashboard
-- Uses IF NOT EXISTS to skip existing tables

-- pattern_views 테이블
CREATE TABLE IF NOT EXISTS public.pattern_views (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    pattern_id uuid REFERENCES public.patterns(id) ON DELETE CASCADE NOT NULL,
    viewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    viewed_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pattern_views_pattern_id ON public.pattern_views(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_views_viewed_at ON public.pattern_views(viewed_at);

-- pattern_likes 테이블
CREATE TABLE IF NOT EXISTS public.pattern_likes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    pattern_id uuid REFERENCES public.patterns(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(pattern_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_pattern_likes_pattern_id ON public.pattern_likes(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_likes_created_at ON public.pattern_likes(created_at);

-- patterns 테이블에 가격 추적 컬럼 추가
ALTER TABLE public.patterns 
ADD COLUMN IF NOT EXISTS previous_price numeric,
ADD COLUMN IF NOT EXISTS price_updated_at timestamp with time zone;
