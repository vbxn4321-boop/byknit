-- 1. Create COMMENTS table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.comments (
    id uuid default gen_random_uuid() primary key,
    review_id uuid references public.reviews(id) on delete cascade not null,
    user_id uuid references public.profiles(id) not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create NOTIFICATIONS table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) not null,
    sender_id uuid references public.profiles(id),
    type text not null, -- 'review', 'reply', 'follow', 'like'
    reference_id uuid, -- ID of the review/order/etc.
    message text not null,
    is_read boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Fix Profiles RLS (Public Read) - Critical for reviews
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

-- 4. Fix Comments RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Comments are viewable by everyone." ON public.comments;
CREATE POLICY "Comments are viewable by everyone." ON public.comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create own comments" ON public.comments;
CREATE POLICY "Users can create own comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 5. Fix Notifications RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
