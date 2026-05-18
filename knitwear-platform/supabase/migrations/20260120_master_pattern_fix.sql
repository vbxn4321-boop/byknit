-- MASTER FIX: Patterns Table Columns & RLS Policies
-- Execute this in the Supabase SQL Editor

-- 1. Ensure columns exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patterns' AND column_name = 'price_krw') THEN
        ALTER TABLE public.patterns ADD COLUMN price_krw numeric DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patterns' AND column_name = 'author_id') THEN
        ALTER TABLE public.patterns ADD COLUMN author_id uuid REFERENCES public.profiles(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patterns' AND column_name = 'previous_price') THEN
        ALTER TABLE public.patterns ADD COLUMN previous_price numeric;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patterns' AND column_name = 'price_updated_at') THEN
        ALTER TABLE public.patterns ADD COLUMN price_updated_at timestamp with time zone;
    END IF;
END $$;

-- 2. Force Enable RLS
ALTER TABLE public.patterns ENABLE ROW LEVEL SECURITY;

-- 3. DROP old policies to avoid conflicts
DROP POLICY IF EXISTS "Designers can update own patterns." ON public.patterns;
DROP POLICY IF EXISTS "Designers can delete own patterns." ON public.patterns;
DROP POLICY IF EXISTS "Designers can insert own patterns." ON public.patterns;

-- 4. CREATE clean policies
CREATE POLICY "Anyone can view patterns" 
ON public.patterns FOR SELECT 
USING (true);

CREATE POLICY "Designers can insert own patterns" 
ON public.patterns FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = designer_id OR auth.uid() = author_id);

CREATE POLICY "Designers can update own patterns" 
ON public.patterns FOR UPDATE 
TO authenticated 
USING (auth.uid() = designer_id OR auth.uid() = author_id)
WITH CHECK (auth.uid() = designer_id OR auth.uid() = author_id);

CREATE POLICY "Designers can delete own patterns" 
ON public.patterns FOR DELETE 
TO authenticated 
USING (auth.uid() = designer_id OR auth.uid() = author_id);
