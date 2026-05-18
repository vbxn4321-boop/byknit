-- Ensure orders table has all necessary columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount_usd numeric(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount numeric(10,2) DEFAULT 0;

-- Drop existing RLS policies to recreate them cleanly/update them
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow users to insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow users to update own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow users to view own orders" ON public.orders; -- potentially duplicate name

-- Re-create policies (including seller check for possible future seller dashboard usage)
CREATE POLICY "Users can view own orders" 
    ON public.orders FOR SELECT 
    USING (auth.uid() = user_id OR auth.uid() = seller_id);

CREATE POLICY "Allow users to insert own orders" 
    ON public.orders FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Index for seller analytics
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
