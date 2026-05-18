-- Create pattern_views table for analytics
CREATE TABLE IF NOT EXISTS public.pattern_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pattern_id UUID NOT NULL REFERENCES public.patterns(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_pattern_views_pattern_id ON public.pattern_views(pattern_id);
CREATE INDEX IF NOT EXISTS idx_pattern_views_viewed_at ON public.pattern_views(viewed_at);

-- Enable RLS
ALTER TABLE public.pattern_views ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Anyone can insert view records (when viewing a pattern)
-- We need to allow anon insertions too if guests can view patterns
CREATE POLICY "Anyone can insert view records" ON public.pattern_views
    FOR INSERT 
    WITH CHECK (true);

-- 2. Designers can view stats for their patterns
CREATE POLICY "Designers can view stats" ON public.pattern_views
    FOR SELECT 
    USING (
        auth.uid() IN (
            SELECT designer_id FROM public.patterns WHERE id = pattern_views.pattern_id
        )
    );
