-- Add seller reply columns to reviews table
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS seller_reply text;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS seller_reply_at timestamp with time zone;

-- Policy: Allow pattern designers (sellers) to update reviews for their own patterns (to reply)
-- We need a policy that allows UPDATE if the user is the owner of the pattern associated with the review.
-- Note: The existing "Allow users to update own reviews" only checks user_id. We need an additional one.

CREATE POLICY "Allow sellers to reply to reviews on their patterns"
    ON public.reviews
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT designer_id FROM public.patterns WHERE id = reviews.pattern_id
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT designer_id FROM public.patterns WHERE id = reviews.pattern_id
        )
    );
