-- Backfill view_count and download_count in patterns table using pattern_views table data
UPDATE patterns p
SET view_count = (
    SELECT count(*)
    FROM pattern_views pv
    WHERE pv.pattern_id = p.id
);
