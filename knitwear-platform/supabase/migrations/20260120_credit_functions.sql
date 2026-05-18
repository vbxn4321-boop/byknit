-- RPC function to add credits transactionally
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id UUID,
  p_amount INT,
  p_description TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user credits
  UPDATE public.profiles
  SET credits = COALESCE(credits, 0) + p_amount
  WHERE id = p_user_id;

  -- Insert history record
  INSERT INTO public.credit_history (user_id, amount, description)
  VALUES (p_user_id, p_amount, p_description);
END;
$$;

-- RPC function to deduct credits transactionally
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id UUID,
  p_amount INT,
  p_description TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_credits INT;
BEGIN
  -- Check current balance
  SELECT credits INTO v_current_credits
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_current_credits < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Update user credits
  UPDATE public.profiles
  SET credits = credits - p_amount
  WHERE id = p_user_id;

  -- Insert history record (stored as negative amount for deduction)
  INSERT INTO public.credit_history (user_id, amount, description)
  VALUES (p_user_id, -p_amount, p_description);
END;
$$;
