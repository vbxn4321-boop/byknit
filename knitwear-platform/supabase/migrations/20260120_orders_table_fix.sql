-- Create orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    pattern_id uuid REFERENCES public.patterns(id) NOT NULL,
    amount numeric(10,2) DEFAULT 0,
    amount_usd numeric(10,2) DEFAULT 0,
    status text DEFAULT 'paid',
    payment_provider text,
    transaction_id text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to prevent conflicts)
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow users to insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow users to update own orders" ON public.orders;

-- Create all necessary RLS policies
CREATE POLICY "Users can view own orders" 
    ON public.orders 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own orders" 
    ON public.orders 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own orders" 
    ON public.orders 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_user_pattern 
    ON public.orders(user_id, pattern_id);

CREATE INDEX IF NOT EXISTS idx_orders_status 
    ON public.orders(status);
