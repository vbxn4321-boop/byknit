-- Function to find masked email by username
-- Used for "Find ID" feature
CREATE OR REPLACE FUNCTION public.get_masked_email_by_username(username_input text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of creator (postgres) to read email if RLS blocks it (though profiles is public, email might be private in future)
AS $$
DECLARE
    found_email text;
    local_part text;
    domain_part text;
BEGIN
    -- Search by username or display_name in profiles (robust matching)
    SELECT email INTO found_email
    FROM public.profiles
    WHERE (LOWER(TRIM(username)) = LOWER(TRIM(username_input)))
       OR (LOWER(TRIM(display_name)) = LOWER(TRIM(username_input)))
    LIMIT 1;

    IF found_email IS NULL THEN
        RETURN NULL;
    END IF;

    -- Split email
    local_part := split_part(found_email, '@', 1);
    domain_part := split_part(found_email, '@', 2);

    -- Mask logic
    IF length(local_part) <= 2 THEN
        -- If very short, just show first char
        RETURN substr(local_part, 1, 1) || '***@' || domain_part;
    ELSE
        -- Show first 2 chars
        RETURN substr(local_part, 1, 2) || '***@' || domain_part;
    END IF;
END;
$$;
