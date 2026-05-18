-- Allow users to view their own orders
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND schemaname = 'public' AND policyname = 'Allow users to view own orders') THEN
        CREATE POLICY "Allow users to view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;
