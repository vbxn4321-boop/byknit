-- Ensure patterns are viewable by everyone
-- This is critical for the Pattern Detail modal to work for all users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'patterns' AND policyname = 'Everyone can view patterns'
    ) THEN
        CREATE POLICY "Everyone can view patterns" ON public.patterns
        FOR SELECT
        USING (true);
    END IF;
END $$;
