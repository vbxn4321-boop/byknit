-- Analytics Tables (if not exist)
CREATE TABLE IF NOT EXISTS public.pattern_views (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    pattern_id uuid REFERENCES public.patterns(id) ON DELETE CASCADE NOT NULL,
    viewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    viewed_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pattern_views_pattern_id ON public.pattern_views(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_views_viewed_at ON public.pattern_views(viewed_at);

CREATE TABLE IF NOT EXISTS public.pattern_likes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    pattern_id uuid REFERENCES public.patterns(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(pattern_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_pattern_likes_pattern_id ON public.pattern_likes(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_likes_created_at ON public.pattern_likes(created_at);

-- Add price tracking columns if not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patterns' AND column_name = 'previous_price') THEN
        ALTER TABLE public.patterns ADD COLUMN previous_price numeric;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patterns' AND column_name = 'price_updated_at') THEN
        ALTER TABLE public.patterns ADD COLUMN price_updated_at timestamp with time zone;
    END IF;
END $$;

-- Recommendation Algorithm RPC
CREATE OR REPLACE FUNCTION public.get_recommended_patterns(
    p_user_id UUID DEFAULT NULL,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0,
    p_category TEXT DEFAULT NULL,
    p_sort TEXT DEFAULT 'recommended', -- 'recommended', 'newest', 'popular'
    p_difficulty TEXT DEFAULT NULL,
    p_yarn_weights TEXT[] DEFAULT NULL, -- Array of yarn weights
    p_techniques TEXT[] DEFAULT NULL,   -- Array of techniques
    p_format TEXT DEFAULT NULL,         -- 'pdf' or 'physical' (optional, if schema supports)
    p_is_free BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title JSONB,
    description JSONB,
    price_usd NUMERIC,
    price_krw NUMERIC,
    is_free BOOLEAN,
    status TEXT,
    images TEXT[],
    category TEXT,
    difficulty TEXT,
    designer_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    view_count BIGINT,
    like_count BIGINT,
    is_liked BOOLEAN,
    author_name TEXT,
    author_avatar TEXT,
    score DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_interest_categories TEXT[];
BEGIN
    -- 1. Get User Interests (Top 3 categories based on likes)
    IF p_user_id IS NOT NULL THEN
        SELECT ARRAY_AGG(sub.category)
        INTO v_interest_categories
        FROM (
            SELECT p.category
            FROM pattern_likes pl
            JOIN patterns p ON pl.pattern_id = p.id
            WHERE pl.user_id = p_user_id
            GROUP BY p.category
            ORDER BY count(*) DESC
            LIMIT 3
        ) sub;
    END IF;

    RETURN QUERY
    WITH pattern_stats AS (
        SELECT
            p.id,
            COUNT(DISTINCT pl.id) as likes,
            COUNT(DISTINCT pv.id) as views,
            CASE WHEN p_user_id IS NOT NULL THEN
                EXISTS(
                    SELECT 1 FROM pattern_likes pl2 
                    WHERE pl2.pattern_id = p.id AND pl2.user_id = p_user_id
                )
            ELSE FALSE END as liked_by_user
        FROM patterns p
        LEFT JOIN pattern_likes pl ON p.id = pl.pattern_id
        LEFT JOIN pattern_views pv ON p.id = pv.pattern_id
        GROUP BY p.id
    )
    SELECT
        p.id,
        p.title,
        p.description,
        p.price_usd,
        p.price_krw,
        p.is_free,
        p.status,
        p.images,
        p.category,
        p.difficulty,
        p.designer_id,
        p.created_at,
        ps.views as view_count,
        ps.likes as like_count,
        ps.liked_by_user as is_liked,
        pr.display_name as author_name,
        pr.avatar_url as author_avatar,
        (
            -- Score Calculation
            CASE
                WHEN p_sort = 'newest' THEN
                    EXTRACT(EPOCH FROM p.created_at)
                WHEN p_sort = 'popular' THEN
                    (ps.likes * 10) + ps.views
                ELSE -- 'recommended'
                    -- 1. Freshness (0-100, decays over 60 days)
                    (GREATEST(0, 60 - EXTRACT(DAY FROM (now() - p.created_at))) / 60.0 * 40) +
                    -- 2. Popularity (Log scale to prevent outliers dominating)
                    (LN(1 + ps.views + (ps.likes * 5)) * 10) +
                    -- 3. Social Boost (BIG boost for followed creators)
                    (CASE WHEN p_user_id IS NOT NULL AND EXISTS (
                        SELECT 1 FROM follows f 
                        WHERE f.follower_id = p_user_id AND f.following_id = p.designer_id
                    ) THEN 150 ELSE 0 END) +
                    -- 4. Interest Match (Boost if category matches user interests)
                    (CASE WHEN v_interest_categories IS NOT NULL AND p.category = ANY(v_interest_categories) THEN 60 ELSE 0 END) +
                    -- 5. Random Jitter (Discovery)
                    (random() * 20)
            END
        )::DOUBLE PRECISION as score
    FROM patterns p
    JOIN pattern_stats ps ON p.id = ps.id
    LEFT JOIN profiles pr ON p.designer_id = pr.id
    WHERE
        p.status = 'published'
        AND (p_category IS NULL OR p.category = p_category)
        AND (p_difficulty IS NULL OR p.difficulty = p_difficulty)
        AND (p_is_free IS NULL OR p.is_free = p_is_free)
        -- Array filters
        AND (p_yarn_weights IS NULL OR p.yarn_weight::text[] && p_yarn_weights)
        AND (p_techniques IS NULL OR p.techniques::text[] && p_techniques)
    ORDER BY score DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;
