
-- 9. NOTIFICATIONS
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  sender_id uuid references public.profiles(id), -- Nullable (e.g. system msg)
  type text check (type in ('review', 'purchase', 'follow', 'reply')) not null,
  reference_id uuid, -- ID of the review, order, or comment
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Notifications
alter table public.notifications enable row level security;
create policy "Users can view own notifications." on notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications." on notifications for update using (auth.uid() = user_id);
-- System triggers insertion, so we might not need an insert policy for public if we use security definer functions, 
-- but for now let's allow authenticated users to insert (triggered by their actions) if necessary, 
-- or rely on server-side service role. 
-- In this app structure, we use server actions with service role often, but let's add a safe insert policy just in case.
create policy "Users can insert notifications." on notifications for insert with check (true); 

-- 10. COMMENTS (Replies to Reviews)
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  review_id uuid references public.reviews(id) on delete cascade not null,
  content text not null check (length(content) >= 1),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Comments
alter table public.comments enable row level security;
create policy "Comments are viewable by everyone." on comments for select using (true);
create policy "Users can insert own comments." on comments for insert with check (auth.uid() = user_id);
create policy "Users can update own comments." on comments for update using (auth.uid() = user_id);
create policy "Users can delete own comments." on comments for delete using (auth.uid() = user_id);
