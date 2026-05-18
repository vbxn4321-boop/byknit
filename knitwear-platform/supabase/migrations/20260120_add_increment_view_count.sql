-- Ensure columns exist
ALTER TABLE patterns ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE patterns ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;

-- Function to increment view count atomically
CREATE OR REPLACE FUNCTION increment_pattern_view_count(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE patterns
  SET view_count = view_count + 1
  WHERE id = p_id;
END;
$$;

-- Function to increment download count atomically
CREATE OR REPLACE FUNCTION increment_pattern_download_count(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE patterns
  SET download_count = download_count + 1
  WHERE id = p_id;
END;
$$;
