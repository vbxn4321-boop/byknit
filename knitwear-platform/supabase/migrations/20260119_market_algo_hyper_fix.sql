-- HYPER FIX: Complete Database Restoration
-- This script repairs MISSING TABLES (follows) AND MISSING COLUMNS (status, prices, etc.)

-- 1. CREATE MISSING TABLES ----------------------------------------

-- 'follows' table (Missing!)
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(follower_id, following_id)
);

-- 'pattern_likes' table (Just in case)
CREATE TABLE IF NOT EXISTS public.pattern_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pattern_id UUID REFERENCES public.patterns(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(pattern_id, user_id)
);

-- 'pattern_views' table (Just in case)
CREATE TABLE IF NOT EXISTS public.pattern_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pattern_id UUID REFERENCES public.patterns(id) ON DELETE CASCADE NOT NULL,
    viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. CREATE MISSING COLUMNS ---------------------------------------
DO $$
BEGIN
    -- status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patterns' AND column_name = 'status') THEN
        ALTER TABLE public.patterns ADD COLUMN status text DEFAULT 'published';
    END IF;

    -- images
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patterns' AND column_name = 'images') THEN
        ALTER TABLE public.patterns ADD COLUMN images jsonb DEFAULT '[]'::jsonb;
    END IF;

    -- prices & details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patterns' AND column_name = 'price_krw') THEN
        ALTER TABLE public.patterns ADD COLUMN price_krw numeric;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patterns' AND column_name = 'price_usd') THEN
        ALTER TABLE public.patterns ADD COLUMN price_usd numeric;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patterns' AND column_name = 'is_free') THEN
        ALTER TABLE public.patterns ADD COLUMN is_free boolean DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patterns' AND column_name = 'difficulty') THEN
        ALTER TABLE public.patterns ADD COLUMN difficulty text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patterns' AND column_name = 'yarn_weight') THEN
        ALTER TABLE public.patterns ADD COLUMN yarn_weight text[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patterns' AND column_name = 'techniques') THEN
        ALTER TABLE public.patterns ADD COLUMN techniques text[];
    END IF;
END $$;


-- 3. RECREATE FUNCTION (get_mk_patterns) --------------------------
DROP FUNCTION IF EXISTS public.get_mk_patterns(uuid, int, int, text, text, text, text[], text[], text, boolean, text);

CREATE OR REPLACE FUNCTION public.get_mk_patterns(
    p_user_id UUID DEFAULT NULL,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0,
    p_category TEXT DEFAULT NULL,
    p_sort TEXT DEFAULT 'recommended',
    p_difficulty TEXT DEFAULT NULL,
    p_yarn_weights TEXT[] DEFAULT NULL,
    p_techniques TEXT[] DEFAULT NULL,
    p_format TEXT DEFAULT NULL,
    p_is_free BOOLEAN DEFAULT NULL,
    p_search_query TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title JSONB,
    description JSONB,
    price_usd NUMERIC,
    price_krw NUMERIC,
    is_free BOOLEAN,
    status TEXT,
    images JSONB,
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
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_interest_categories TEXT[];
BEGIN
    -- 1. Get User Interests
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
        p.price_usd::numeric,
        p.price_krw::numeric,
        p.is_free,
        p.status::text,
        to_jsonb(p.images),
        p.category::text,
        p.difficulty::text,
        p.designer_id,
        p.created_at,
        ps.views as view_count,
        ps.likes as like_count,
        ps.liked_by_user as is_liked,
        pr.display_name::text as author_name,
        pr.avatar_url::text as author_avatar,
        (
            -- Score logic
            CASE
                WHEN p_sort = 'newest' THEN
                    EXTRACT(EPOCH FROM p.created_at)
                WHEN p_sort = 'popular' THEN
                    (ps.likes * 10) + ps.views
                ELSE -- 'recommended'
                    (GREATEST(0, 60 - EXTRACT(DAY FROM (now() - p.created_at))) / 60.0 * 40) +
                    (LN(1 + ps.views + (ps.likes * 5)) * 10) +
                    -- Social Boost (Requires 'follows' table)
                    (CASE WHEN p_user_id IS NOT NULL AND EXISTS (
                        SELECT 1 FROM follows f 
                        WHERE f.follower_id = p_user_id AND f.following_id = p.designer_id
                    ) THEN 150 ELSE 0 END) +
                    (CASE WHEN v_interest_categories IS NOT NULL AND p.category = ANY(v_interest_categories) THEN 60 ELSE 0 END) +
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
        -- Array checks
        AND (p_yarn_weights IS NULL OR p.yarn_weight::text[] && p_yarn_weights)
        AND (p_techniques IS NULL OR p.techniques::text[] && p_techniques)
        -- Search
        AND (p_search_query IS NULL OR 
             (p.title->>'en')::text ILIKE '%' || p_search_query || '%' OR 
             (p.title->>'ko')::text ILIKE '%' || p_search_query || '%')
    ORDER BY score DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_mk_patterns TO anon, authenticated, service_role;
