-- Add consent columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marketing_consent boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_policy_agreed boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ad_agreement boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    username,
    full_name,
    marketing_consent, 
    privacy_policy_agreed, 
    ad_agreement
  )
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    COALESCE((new.raw_user_meta_data->>'marketing_consent')::boolean, false),
    COALESCE((new.raw_user_meta_data->>'privacy_policy_agreed')::boolean, false),
    COALESCE((new.raw_user_meta_data->>'ad_agreement')::boolean, false)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (if not exists logic handled by dropping first to be safe or explicit check)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
