-- Fix for missing RLS policies on patterns table
-- Allows designers to update and delete their own patterns

-- 1. Check if UPDATE policy exists, if not, create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'patterns' AND policyname = 'Designers can update own patterns.'
    ) THEN
        CREATE POLICY "Designers can update own patterns." ON public.patterns
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = designer_id OR auth.uid() = author_id)
        WITH CHECK (auth.uid() = designer_id OR auth.uid() = author_id);
    END IF;
END $$;

-- 2. Check if DELETE policy exists, if not, create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'patterns' AND policyname = 'Designers can delete own patterns.'
    ) THEN
        CREATE POLICY "Designers can delete own patterns." ON public.patterns
        FOR DELETE
        TO authenticated
        USING (auth.uid() = designer_id OR auth.uid() = author_id);
    END IF;
END $$;

-- 3. Add column safety (ensure author_id exists if it was being used)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patterns' AND column_name = 'author_id') THEN
        ALTER TABLE public.patterns ADD COLUMN author_id uuid REFERENCES public.profiles(id);
    END IF;
END $$;
