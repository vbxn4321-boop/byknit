-- 무료/유료 표시 불일치 수정: is_free를 가격에서 항상 자동 계산한다.
-- 가격 기준은 앱(src/lib/pricing.ts)과 동일: price_krw 우선, 없으면 price_usd * 1450.

CREATE OR REPLACE FUNCTION public.sync_pattern_is_free()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.is_free := (
    CASE WHEN COALESCE(NEW.price_krw, 0) > 0 THEN NEW.price_krw
         ELSE ROUND(COALESCE(NEW.price_usd, 0) * 1450)
    END
  ) <= 0;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_pattern_is_free ON public.patterns;
CREATE TRIGGER trg_sync_pattern_is_free
  BEFORE INSERT OR UPDATE OF price_krw, price_usd ON public.patterns
  FOR EACH ROW EXECUTE FUNCTION public.sync_pattern_is_free();

-- 기존 데이터 보정
UPDATE public.patterns
SET is_free = (
  CASE WHEN COALESCE(price_krw, 0) > 0 THEN price_krw
       ELSE ROUND(COALESCE(price_usd, 0) * 1450)
  END
) <= 0;

-- (참고용 점검) price_krw=0 인데 price_usd>0 인 도안: 앱은 유료(price_usd 환산)로 취급한다.
-- 의도적으로 무료로 올린 도안이라면 price_usd를 0으로 바꿔야 한다.
-- SELECT id, title->>'ko' AS title_ko, price_krw, price_usd FROM public.patterns
--   WHERE COALESCE(price_krw, 0) = 0 AND COALESCE(price_usd, 0) > 0;
