-- SUPER FIX: Schema + Function (Final Exhaustive Solution)
-- This script checks for EVERY column used in the marketplace algorithm and ensures it exists.

-- 1. FIX THE TABLE SCHEMA (Adding all potentially missing columns)
DO $$
BEGIN
    -- 'status': Essential for filtering. Default to 'published' so existing patterns show up.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patterns' AND column_name = 'status') THEN
        ALTER TABLE public.patterns ADD COLUMN status text DEFAULT 'published';
    END IF;

    -- 'images': Used for display. Default to empty JSON array.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patterns' AND column_name = 'images') THEN
        ALTER TABLE public.patterns ADD COLUMN images jsonb DEFAULT '[]'::jsonb;
    END IF;

    -- 'price_krw'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patterns' AND column_name = 'price_krw') THEN
        ALTER TABLE public.patterns ADD COLUMN price_krw numeric;
    END IF;

    -- 'price_usd'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patterns' AND column_name = 'price_usd') THEN
        ALTER TABLE public.patterns ADD COLUMN price_usd numeric;
    END IF;

    -- 'is_free'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patterns' AND column_name = 'is_free') THEN
        ALTER TABLE public.patterns ADD COLUMN is_free boolean DEFAULT false;
    END IF;

    -- 'previous_price'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patterns' AND column_name = 'previous_price') THEN
        ALTER TABLE public.patterns ADD COLUMN previous_price numeric;
    END IF;

    -- 'price_updated_at'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patterns' AND column_name = 'price_updated_at') THEN
        ALTER TABLE public.patterns ADD COLUMN price_updated_at timestamp with time zone;
    END IF;
    
    -- 'difficulty' (Just in case)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patterns' AND column_name = 'difficulty') THEN
        ALTER TABLE public.patterns ADD COLUMN difficulty text;
    END IF;

    -- 'yarn_weight' (Just in case)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patterns' AND column_name = 'yarn_weight') THEN
        ALTER TABLE public.patterns ADD COLUMN yarn_weight text[];
    END IF;
    
    -- 'techniques' (Just in case)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patterns' AND column_name = 'techniques') THEN
        ALTER TABLE public.patterns ADD COLUMN techniques text[];
    END IF;
END $$;


-- 2. DROP ALL PREVIOUS FUNCTION VERSIONS (Cleanup)
DROP FUNCTION IF EXISTS public.get_recommended_patterns(uuid, int, int, text, text, text, text[], text[], text, boolean);
DROP FUNCTION IF EXISTS public.get_recommended_patterns(uuid, int, int, text, text, text, text[], text[], text, boolean, text);
DROP FUNCTION IF EXISTS public.get_recommended_patterns_v2(uuid, int, int, text, text, text, text[], text[], text, boolean, text);
DROP FUNCTION IF EXISTS public.get_mk_patterns(uuid, int, int, text, text, text, text[], text[], text, boolean, text);


-- 3. RECREATE THE ROBUST FUNCTION (get_mk_patterns)
-- Uses safe casting and JSONB handling
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
    -- Get User Interests
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
        -- Robust image handling: whatever it is, make it JSONB
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
            -- Score Logic
            CASE
                WHEN p_sort = 'newest' THEN
                    EXTRACT(EPOCH FROM p.created_at)
                WHEN p_sort = 'popular' THEN
                    (ps.likes * 10) + ps.views
                ELSE -- 'recommended'
                    (GREATEST(0, 60 - EXTRACT(DAY FROM (now() - p.created_at))) / 60.0 * 40) +
                    (LN(1 + ps.views + (ps.likes * 5)) * 10) +
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
        p.status = 'published' -- Now guaranteed to exist
        AND (p_category IS NULL OR p.category = p_category)
        AND (p_difficulty IS NULL OR p.difficulty = p_difficulty)
        AND (p_is_free IS NULL OR p.is_free = p_is_free)
        AND (p_yarn_weights IS NULL OR p.yarn_weight::text[] && p_yarn_weights)
        AND (p_techniques IS NULL OR p.techniques::text[] && p_techniques)
        AND (p_search_query IS NULL OR 
             (p.title->>'en')::text ILIKE '%' || p_search_query || '%' OR 
             (p.title->>'ko')::text ILIKE '%' || p_search_query || '%')
    ORDER BY score DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_mk_patterns TO anon, authenticated, service_role;
