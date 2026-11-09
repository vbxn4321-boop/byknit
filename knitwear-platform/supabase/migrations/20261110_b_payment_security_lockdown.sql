-- [2/2] 새 코드가 배포된 것을 확인한 뒤에 실행하세요. 배포 전에 실행하면 주문/크레딧 기능이 멈춥니다.

BEGIN;

-- 1. 유료 데이터를 공개 테이블에서 비공개 테이블로 옮긴다
INSERT INTO public.pattern_private (pattern_id, pdf_url, grid_data, full_content)
SELECT id, content->>'pdf_url', grid_data, content#>'{metadata,full_content}'
FROM public.patterns
WHERE content ? 'pdf_url'
   OR grid_data IS NOT NULL
   OR content#>'{metadata,full_content}' IS NOT NULL
ON CONFLICT (pattern_id) DO NOTHING;

UPDATE public.patterns
SET content = (content - 'pdf_url') #- '{metadata,full_content}',
    grid_data = NULL
WHERE content ? 'pdf_url'
   OR grid_data IS NOT NULL
   OR content#>'{metadata,full_content}' IS NOT NULL;

-- 2. 주문과 크레딧 내역은 서버(서비스 롤)만 쓸 수 있다
DO $$
DECLARE
  policy record;
BEGIN
  FOR policy IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('orders', 'credit_transactions')
      AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', policy.policyname, policy.tablename);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = seller_id);

-- 3. 일반 사용자는 크레딧 잔액을 직접 바꿀 수 없다
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL
     OR public.is_admin()
     OR COALESCE(current_setting('app.seller_rpc', true), '') = '1' THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.seller_status IS DISTINCT FROM OLD.seller_status
     OR NEW.seller_approved_at IS DISTINCT FROM OLD.seller_approved_at
     OR NEW.seller_balance_krw IS DISTINCT FROM OLD.seller_balance_krw
     OR NEW.credits IS DISTINCT FROM OLD.credits THEN
    RAISE EXCEPTION 'Not allowed to modify privileged profile columns';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- 4. 이메일과 전화번호는 브라우저에서 조회할 수 없다
DO $$
DECLARE
  public_columns text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
  INTO public_columns
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name NOT IN ('email', 'phone');

  REVOKE SELECT ON public.profiles FROM anon, authenticated;
  EXECUTE format('GRANT SELECT (%s) ON public.profiles TO anon, authenticated', public_columns);
END $$;

COMMIT;
