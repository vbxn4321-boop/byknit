-- 1. posts 테이블에 views (조회수) 컬럼 추가
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS views integer DEFAULT 0;

-- 2. 안전하게 조회수를 1씩 증가시키는 RPC 함수 생성
CREATE OR REPLACE FUNCTION public.increment_post_views(post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.posts
  SET views = COALESCE(views, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
