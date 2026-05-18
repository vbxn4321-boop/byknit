-- Add credits column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS credits INT DEFAULT 5;

-- Create credit_history table
CREATE TABLE IF NOT EXISTS public.credit_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.credit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credit history"
  ON public.credit_history
  FOR SELECT
  USING (auth.uid() = user_id);
  
-- Grant permissions
GRANT SELECT ON public.credit_history TO authenticated;
