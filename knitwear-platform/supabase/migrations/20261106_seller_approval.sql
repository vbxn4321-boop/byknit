-- 판매자 신청/승인 시스템
-- 무료 도안만 올리는 사용자는 승인 불필요, 유료 판매는 seller_status = 'approved' 필요.

-- 1. profiles 승인 상태 컬럼
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS seller_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS seller_approved_at timestamptz;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_seller_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_seller_status_check
  CHECK (seller_status IN ('none', 'pending', 'approved', 'rejected'));

-- 2. 관리자 판별 헬퍼
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- 3. 입점 신청서 테이블
CREATE TABLE IF NOT EXISTS public.seller_applications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  brand_name text NOT NULL,
  rep_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  seller_type text NOT NULL CHECK (seller_type IN ('individual', 'biz_general', 'biz_simplified', 'corporate')),
  business_num text,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_holder text NOT NULL,
  category text,
  intro text,
  portfolio_url text,
  biz_cert_file_name text,
  bank_book_file_name text,
  mail_order_file_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reject_reason text,
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_seller_applications_pending_per_user
  ON public.seller_applications(user_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_seller_applications_status ON public.seller_applications(status, created_at DESC);

ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own seller applications." ON public.seller_applications;
CREATE POLICY "Users can view own seller applications."
  ON public.seller_applications FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can submit own seller application." ON public.seller_applications;
CREATE POLICY "Users can submit own seller application."
  ON public.seller_applications FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
    AND reviewed_by IS NULL
    AND (SELECT seller_status FROM public.profiles WHERE id = auth.uid()) <> 'approved'
  );
-- UPDATE/DELETE 정책 없음: 심사는 아래 RPC(security definer)로만 가능

-- 4. 신청 접수 시 profiles.seller_status = 'pending'
CREATE OR REPLACE FUNCTION public.on_seller_application_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.seller_rpc', '1', true);
  UPDATE public.profiles SET seller_status = 'pending' WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seller_application_created ON public.seller_applications;
CREATE TRIGGER trg_seller_application_created
  AFTER INSERT ON public.seller_applications
  FOR EACH ROW EXECUTE FUNCTION public.on_seller_application_created();

-- 5. 승인 / 반려 RPC (관리자 전용)
CREATE OR REPLACE FUNCTION public.approve_seller_application(app_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin only';
  END IF;

  UPDATE public.seller_applications
  SET status = 'approved', reject_reason = NULL, reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = app_id AND status = 'pending'
  RETURNING user_id INTO target_user;

  IF target_user IS NULL THEN
    RAISE EXCEPTION 'Pending application not found';
  END IF;

  PERFORM set_config('app.seller_rpc', '1', true);
  UPDATE public.profiles
  SET seller_status = 'approved', seller_approved_at = now()
  WHERE id = target_user;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_seller_application(app_id uuid, reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin only';
  END IF;
  IF reason IS NULL OR btrim(reason) = '' THEN
    RAISE EXCEPTION 'Reject reason required';
  END IF;

  UPDATE public.seller_applications
  SET status = 'rejected', reject_reason = btrim(reason), reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = app_id AND status = 'pending'
  RETURNING user_id INTO target_user;

  IF target_user IS NULL THEN
    RAISE EXCEPTION 'Pending application not found';
  END IF;

  PERFORM set_config('app.seller_rpc', '1', true);
  UPDATE public.profiles SET seller_status = 'rejected' WHERE id = target_user;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_seller_application(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_seller_application(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_seller_application(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_seller_application(uuid, text) TO authenticated;

-- 6. 권한 상승 방지: 일반 사용자는 role / 판매자 상태 / 정산 잔액을 직접 바꿀 수 없다.
-- auth.uid()가 NULL인 경우(서비스 롤, SQL 편집기)와 관리자, 위 RPC 경유는 허용.
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
     OR NEW.seller_balance_krw IS DISTINCT FROM OLD.seller_balance_krw THEN
    RAISE EXCEPTION 'Not allowed to modify privileged profile columns';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- 7. (선택) 기존에 유료 도안을 판매 중인 디자이너를 승인 상태로 일괄 전환.
-- 실제 판매자를 목록/발행에서 잃지 않으려면 확인 후 주석을 풀어 실행하세요.
-- UPDATE public.profiles pr
-- SET seller_status = 'approved', seller_approved_at = now()
-- WHERE pr.seller_status = 'none'
--   AND EXISTS (
--     SELECT 1 FROM public.patterns p
--     WHERE p.designer_id = pr.id AND COALESCE(p.price_krw, 0) > 0
--   );
