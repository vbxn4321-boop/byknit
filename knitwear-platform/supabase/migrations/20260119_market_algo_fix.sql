-- Drop the old version of the function (without search query)
DROP FUNCTION IF EXISTS public.get_recommended_patterns(uuid, int, int, text, text, text, text[], text[], text, boolean);

-- Drop the new version just in case (to ensure clean recreate)
DROP FUNCTION IF EXISTS public.get_recommended_patterns(uuid, int, int, text, text, text, text[], text[], text, boolean, text);

-- Recreate the correct function
CREATE OR REPLACE FUNCTION public.get_recommended_patterns(
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
        p.status = 'published'
        AND (p_category IS NULL OR p.category = p_category)
        AND (p_difficulty IS NULL OR p.difficulty = p_difficulty)
        AND (p_is_free IS NULL OR p.is_free = p_is_free)
        -- Array filters
        AND (p_yarn_weights IS NULL OR p.yarn_weight::text[] && p_yarn_weights)
        AND (p_techniques IS NULL OR p.techniques::text[] && p_techniques)
        -- Search filter
        AND (p_search_query IS NULL OR 
             p.title->>'en' ILIKE '%' || p_search_query || '%' OR 
             p.title->>'ko' ILIKE '%' || p_search_query || '%')
    ORDER BY score DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;
