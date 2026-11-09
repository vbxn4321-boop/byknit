-- [1/2] 코드를 배포하기 전에 실행하세요. 기존 기능에 영향을 주지 않는 준비 작업입니다.

-- 1. 결제 후에만 전달되는 도안 데이터. RLS 정책이 없으므로 서비스 롤로만 접근할 수 있다.
CREATE TABLE IF NOT EXISTS public.pattern_private (
  pattern_id uuid PRIMARY KEY REFERENCES public.patterns(id) ON DELETE CASCADE,
  pdf_url text,
  grid_data jsonb,
  full_content jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pattern_private ENABLE ROW LEVEL SECURITY;

-- 2. 새로 등록되는 유료 PDF용 비공개 버킷. 조회는 서버의 서명 URL로만 가능하다.
INSERT INTO storage.buckets (id, name, public)
VALUES ('pattern-files', 'pattern-files', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Authenticated users can upload pattern files" ON storage.objects;
CREATE POLICY "Authenticated users can upload pattern files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pattern-files');

-- 3. 크레딧 내역 INSERT 시 잔액을 갱신하는 트리거 보장
CREATE OR REPLACE FUNCTION public.update_profile_credits()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles
  SET credits = COALESCE(credits, 0) + NEW.amount
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_credit_transaction_created ON public.credit_transactions;
CREATE TRIGGER on_credit_transaction_created
  AFTER INSERT ON public.credit_transactions
  FOR EACH ROW EXECUTE PROCEDURE public.update_profile_credits();

-- 4. 같은 포트원 결제로 주문이 두 번 생기지 않도록 한다.
-- 이 문장에서 오류가 나면 이미 중복 주문이 있다는 뜻이므로, 전체 실행을 멈추고 오류 내용을 확인하세요.
CREATE UNIQUE INDEX IF NOT EXISTS orders_portone_transaction_unique
  ON public.orders (transaction_id)
  WHERE payment_provider = 'portone' AND transaction_id IS NOT NULL;
