-- 운영 DB에 20261106_seller_approval.sql이 적용되지 않아 profiles.seller_status 컬럼이 없다.
-- (로그: "column profiles.seller_status does not exist" → 관리자 판매자 목록 조회 실패)
--
-- [먼저 확인] SQL Editor에서 아래 쿼리를 실행해 현재 상태를 본다.
--
--   SELECT column_name FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'profiles'
--     AND column_name IN ('seller_status', 'seller_approved_at', 'seller_balance_krw', 'credits');
--
--   SELECT to_regclass('public.seller_applications') AS seller_applications,
--          to_regclass('public.pattern_private')     AS pattern_private,
--          to_regprocedure('public.is_admin()')       AS is_admin;
--
-- seller_balance_krw 또는 credits가 없으면 이 파일을 실행하지 말고 먼저 알려줄 것
-- (아래 보호 트리거가 그 컬럼을 참조한다).
--
-- 이 파일은 여러 번 실행해도 안전하다. 20261106 파일을 그대로 다시 실행하지 않는 이유:
-- 그 파일의 6번(권한 보호 함수)이 20261110_b에서 강화된 버전(크레딧 보호 포함)을 덮어써 버린다.

BEGIN;

-- 1. profiles 승인 상태 컬럼
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS seller_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS seller_approved_at timestamptz;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_seller_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_seller_status_check
  CHECK (seller_status IN ('none', 'pending', 'approved', 'rejected'));

-- 20261110_b가 profiles를 컬럼 단위 SELECT 권한으로 바꿨다면 새 컬럼은 따로 열어줘야 한다.
-- (table 단위 권한이 남아 있는 경우에도 해가 없다)
GRANT SELECT (seller_status, seller_approved_at) ON public.profiles TO anon, authenticated;

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

-- 6. 권한 상승 방지 (20261110_b의 최신 버전: 크레딧 보호 포함)
-- 크레딧은 서버(서비스 롤)에서만 바꾸므로 auth.uid()가 NULL인 경로로 통과한다.
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

COMMIT;

-- 7. (선택, 별도 실행) 이미 유료 도안을 판매 중인 디자이너를 승인 상태로 일괄 전환.
-- 지금 컬럼이 새로 생기면 모든 판매자가 'none'이 되어 관리자 판매자 목록이 비고 유료 발행이 막힌다.
-- 대상 확인:
--   SELECT pr.id, pr.display_name FROM public.profiles pr
--   WHERE pr.seller_status = 'none'
--     AND EXISTS (SELECT 1 FROM public.patterns p WHERE p.designer_id = pr.id AND COALESCE(p.price_krw, 0) > 0);
-- 확인 후 실행:
--   UPDATE public.profiles pr
--   SET seller_status = 'approved', seller_approved_at = now()
--   WHERE pr.seller_status = 'none'
--     AND EXISTS (SELECT 1 FROM public.patterns p WHERE p.designer_id = pr.id AND COALESCE(p.price_krw, 0) > 0);
