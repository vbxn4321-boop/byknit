-- Recommendation Algorithm RPC
-- Calculates a weighted score based on:
-- 1. Freshness (Created recently)
-- 2. Popularity (Likes + Views)
-- 3. Social (Followed Creators)
-- 4. Interests (Matched Categories from user's likes)
-- 5. Random Discovery

CREATE OR REPLACE FUNCTION public.get_recommended_patterns(
    p_user_id UUID DEFAULT NULL,
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0,
    p_category TEXT DEFAULT NULL,
    p_sort TEXT DEFAULT 'recommended' -- 'recommended', 'newest', 'popular'
)
RETURNS TABLE (
    id UUID,
    title JSONB,
    description JSONB,
    price NUMERIC,
    images TEXT[],
    category TEXT,
    difficulty TEXT,
    author_id UUID,
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
            EXISTS(
                SELECT 1 FROM pattern_likes pl2 
                WHERE pl2.pattern_id = p.id AND pl2.user_id = p_user_id
            ) as liked_by_user
        FROM patterns p
        LEFT JOIN pattern_likes pl ON p.id = pl.pattern_id
        LEFT JOIN pattern_views pv ON p.id = pv.pattern_id
        GROUP BY p.id
    )
    SELECT
        p.id,
        p.title,
        p.description,
        p.price,
        p.images,
        p.category,
        p.difficulty,
        p.author_id,
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
                    (CASE WHEN EXISTS (
                        SELECT 1 FROM follows f 
                        WHERE f.follower_id = p_user_id AND f.following_id = p.author_id
                    ) THEN 150 ELSE 0 END) +
                    -- 4. Interest Match (Boost if category matches user interests)
                    (CASE WHEN p.category = ANY(v_interest_categories) THEN 60 ELSE 0 END) +
                    -- 5. Random Jitter (Discovery)
                    (random() * 20)
            END
        )::DOUBLE PRECISION as score
    FROM patterns p
    JOIN pattern_stats ps ON p.id = ps.id
    LEFT JOIN profiles pr ON p.author_id = pr.id
    WHERE
        (p_category IS NULL OR p.category = p_category)
        AND p.status = 'published'
    ORDER BY score DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;
