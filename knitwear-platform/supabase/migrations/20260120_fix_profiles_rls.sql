-- 1. PROFILES: Allow everyone to view profiles (needed for avatar/name in reviews)
-- First, enable RLS to be sure
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing potential conflicting policies (defensive)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Everyone can view profiles" ON public.profiles;

-- Create the public read policy
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);


-- 2. COMMENTS: Allow everyone to view comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments are viewable by everyone." ON public.comments;
DROP POLICY IF EXISTS "Public comments are viewable by everyone" ON public.comments;

CREATE POLICY "Comments are viewable by everyone." ON public.comments FOR SELECT USING (true);
