-- 1. REVIEWS: Allow everyone to see reviews (Public Read)
DROP POLICY IF EXISTS "Reviews are viewable by everyone." ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone." ON public.reviews FOR SELECT USING (true);

-- 2. REVIEWS: Allow authenticated users to insert/update/delete their own reviews
DROP POLICY IF EXISTS "Users can create their own reviews" ON public.reviews;
CREATE POLICY "Users can create their own reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- 3. ORDERS: Allow users to view their own orders (Important for download check)
DROP POLICY IF EXISTS "Allow users to view own orders" ON public.orders;
CREATE POLICY "Allow users to view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 4. ORDERS: Allow users to insert/update their own orders (For payments/free usage)
DROP POLICY IF EXISTS "Allow users to insert own orders" ON public.orders;
CREATE POLICY "Allow users to insert own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update own orders" ON public.orders;
CREATE POLICY "Allow users to update own orders" ON public.orders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
