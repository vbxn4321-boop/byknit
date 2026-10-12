-- 사이트 방문/회원 활동 로그 (관리자 분석 페이지용)
-- 서버(service role)에서만 읽고 쓰므로 RLS 정책은 만들지 않는다 (일반 사용자 접근 차단).

CREATE TABLE IF NOT EXISTS public.site_activity_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id text NOT NULL,                       -- 브라우저 익명 ID (비로그인 방문자 집계용)
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type text NOT NULL DEFAULT 'pageview',    -- pageview | login | signup | ...
    path text,
    referrer text,
    locale text,
    device text,                                    -- mobile | tablet | desktop | bot
    user_agent text,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_site_activity_created_at ON public.site_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_activity_user_id ON public.site_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_site_activity_visitor_id ON public.site_activity_logs(visitor_id);
CREATE INDEX IF NOT EXISTS idx_site_activity_event_type ON public.site_activity_logs(event_type);

ALTER TABLE public.site_activity_logs ENABLE ROW LEVEL SECURITY;
