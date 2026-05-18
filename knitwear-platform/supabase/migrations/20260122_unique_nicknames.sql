-- Ensure username and display_name are unique to prevent duplicate nicknames
-- This also helps the "Find ID" feature stay accurate

-- 1. Add unique constraint to username
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- 2. Add unique constraint to display_name (nickname)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_display_name_unique UNIQUE (display_name);

-- 3. Update trigger to ensure display_name is also initialized with username on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    username,
    display_name, -- Added display_name here
    full_name,
    marketing_consent, 
    privacy_policy_agreed, 
    ad_agreement
  )
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'username', -- Set initial display_name to username
    new.raw_user_meta_data->>'username', -- Map to full_name for compatibility
    COALESCE((new.raw_user_meta_data->>'marketing_consent')::boolean, false),
    COALESCE((new.raw_user_meta_data->>'privacy_policy_agreed')::boolean, false),
    COALESCE((new.raw_user_meta_data->>'ad_agreement')::boolean, false)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
