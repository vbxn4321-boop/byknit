'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { logActivity } from '@/app/actions/activity';
import { createClient } from '@/utils/supabase/client';

const VISITOR_KEY = 'byknit_vid';

function getVisitorId(): string {
    try {
        let id = localStorage.getItem(VISITOR_KEY);
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem(VISITOR_KEY, id);
        }
        return id;
    } catch {
        return 'anon-' + Math.random().toString(36).slice(2, 12);
    }
}

// 페이지 이동 시 방문 로그를 남기고, 로그인 시 login 이벤트를 1회 기록한다.
export default function ActivityTracker({ serverUserId }: { serverUserId?: string | null }) {
    const pathname = usePathname();
    const router = useRouter();
    const lastPath = useRef<string | null>(null);

    useEffect(() => {
        if (!pathname || pathname.includes('/admin') || lastPath.current === pathname) return;
        const referrer = lastPath.current ? window.location.origin + lastPath.current : document.referrer;
        lastPath.current = pathname;
        logActivity({
            visitorId: getVisitorId(),
            eventType: 'pageview',
            path: pathname,
            referrer,
            locale: pathname.split('/')[1],
        });
    }, [pathname]);

    useEffect(() => {
        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event !== 'SIGNED_IN' || !session?.user) return;
            // 브라우저는 로그인됐는데 서버가 렌더한 화면은 비로그인인 경우(OAuth 직후) 화면을 다시 불러온다.
            if (session.user.id !== serverUserId) router.refresh();
            try {
                const key = `byknit_login_logged_${session.user.id}`;
                if (sessionStorage.getItem(key)) return;
                sessionStorage.setItem(key, '1');
            } catch { /* ignore */ }
            logActivity({
                visitorId: getVisitorId(),
                eventType: 'login',
                path: window.location.pathname,
            });
        });
        return () => subscription.unsubscribe();
    }, [serverUserId, router]);

    return null;
}
