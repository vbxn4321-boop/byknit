-- Add hashtags column to patterns table
ALTER TABLE public.patterns
ADD COLUMN IF NOT EXISTS hashtags TEXT[] DEFAULT '{}'::TEXT[];
