'use server';

import { headers } from 'next/headers';
import { createClient, createAdminClient } from '@/utils/supabase/server';

const ALLOWED_EVENTS = ['pageview', 'login'] as const;

function detectDevice(ua: string): string {
    if (/bot|crawler|spider|crawling|facebookexternalhit|slurp|headless/i.test(ua)) return 'bot';
    if (/ipad|tablet/i.test(ua)) return 'tablet';
    if (/mobi|android|iphone/i.test(ua)) return 'mobile';
    return 'desktop';
}

// 방문/활동 기록 (클라이언트 ActivityTracker에서 호출). 실패해도 사용자 경험에 영향 없도록 조용히 무시한다.
export async function logActivity(input: {
    visitorId: string;
    eventType: string;
    path: string;
    referrer?: string;
    locale?: string;
}) {
    try {
        if (!input.visitorId || input.visitorId.length > 64) return;
        if (!ALLOWED_EVENTS.includes(input.eventType as (typeof ALLOWED_EVENTS)[number])) return;

        const ua = (await headers()).get('user-agent') || '';
        const device = detectDevice(ua);
        if (device === 'bot') return;

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const admin = await createAdminClient();
        await admin.from('site_activity_logs').insert({
            visitor_id: input.visitorId,
            user_id: user?.id ?? null,
            event_type: input.eventType,
            path: input.path.slice(0, 500),
            referrer: input.referrer ? input.referrer.slice(0, 500) : null,
            locale: input.locale?.slice(0, 10) ?? null,
            device,
            user_agent: ua.slice(0, 300),
        });
    } catch (e) {
        console.error('logActivity failed:', e);
    }
}

async function assertAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') throw new Error('Forbidden');
}

export interface ActivityFilters {
    eventType?: string;
    search?: string; // 이메일/닉네임/경로
    days?: number;
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const kstDay = (d: Date | string) => new Date(new Date(d).getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);

// 관리자 분석 대시보드 데이터
export async function getAdminAnalytics(filters: ActivityFilters = {}) {
    await assertAdmin();
    const admin = await createAdminClient();

    const days = Math.min(Math.max(filters.days ?? 14, 1), 90);
    const since = new Date(Date.now() - days * 86400000).toISOString();

    // 기간 내 로그 (최대 20,000건 집계)
    const { data: logs, error: logsError } = await admin
        .from('site_activity_logs')
        .select('visitor_id, user_id, event_type, path, referrer, device, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(20000);
    if (logsError) return { error: logsError.message };

    const rows = logs || [];
    const pageviews = rows.filter(r => r.event_type === 'pageview');

    // 일별 방문자(고유 visitor_id) / 페이지뷰
    const daily = new Map<string, { visitors: Set<string>; pageviews: number }>();
    for (let i = days - 1; i >= 0; i--) {
        daily.set(kstDay(new Date(Date.now() - i * 86400000)), { visitors: new Set(), pageviews: 0 });
    }
    for (const r of pageviews) {
        const bucket = daily.get(kstDay(r.created_at));
        if (!bucket) continue;
        bucket.visitors.add(r.visitor_id);
        bucket.pageviews++;
    }
    const dailyStats = [...daily.entries()].map(([date, v]) => ({ date, visitors: v.visitors.size, pageviews: v.pageviews }));

    const uniq = (list: typeof rows) => new Set(list.map(r => r.visitor_id)).size;
    const todayKey = kstDay(new Date());
    const todayPv = pageviews.filter(r => kstDay(r.created_at) === todayKey);

    // 상위 페이지 / 유입 / 기기
    const count = <T,>(items: T[], key: (i: T) => string | null) => {
        const m = new Map<string, number>();
        for (const i of items) { const k = key(i); if (k) m.set(k, (m.get(k) || 0) + 1); }
        return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));
    };
    const topPages = count(pageviews, r => (r.path || '').replace(/^\/(ko|en)(?=\/|$)/, '') || '/');
    const topReferrers = count(pageviews, r => {
        if (!r.referrer) return '(직접 방문)';
        try { return new URL(r.referrer).hostname; } catch { return r.referrer; }
    });
    const devices = count(pageviews, r => r.device);

    // 회원 현황 (auth.users)
    const { data: usersData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const users = usersData?.users || [];
    const userIds = users.map(u => u.id);
    const { data: profiles } = userIds.length
        ? await admin.from('profiles').select('id, display_name, username, role').in('id', userIds)
        : { data: [] as any[] };
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    const nameOf = (id: string | null) => {
        if (!id) return null;
        const u = users.find(x => x.id === id);
        const p: any = profileMap.get(id);
        return { email: u?.email ?? null, name: p?.display_name || p?.username || null };
    };

    const sevenDaysAgo = Date.now() - 7 * 86400000;
    const memberStats = {
        total: users.length,
        newToday: users.filter(u => kstDay(u.created_at) === todayKey).length,
        new7d: users.filter(u => new Date(u.created_at).getTime() >= sevenDaysAgo).length,
        active7d: users.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at).getTime() >= sevenDaysAgo).length,
    };

    const recentMembers = [...users]
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
        .slice(0, 30)
        .map(u => ({
            id: u.id,
            email: u.email ?? '',
            name: (profileMap.get(u.id) as any)?.display_name || (profileMap.get(u.id) as any)?.username || '',
            provider: (u.app_metadata?.provider as string) || 'email',
            createdAt: u.created_at,
            lastSignInAt: u.last_sign_in_at ?? null,
            activityCount: rows.filter(r => r.user_id === u.id).length,
        }));

    // 활동 로그 (필터 적용)
    let feed = rows.filter(r => !filters.eventType || filters.eventType === 'all' || r.event_type === filters.eventType);
    const q = filters.search?.trim().toLowerCase();
    const activity = feed
        .map(r => {
            const who = nameOf(r.user_id);
            return {
                at: r.created_at,
                event: r.event_type,
                path: r.path,
                device: r.device,
                visitorId: r.visitor_id.slice(0, 8),
                email: who?.email ?? null,
                name: who?.name ?? null,
            };
        })
        .filter(a => !q || [a.email, a.name, a.path].some(v => v?.toLowerCase().includes(q)))
        .slice(0, 200);

    return {
        summary: {
            todayVisitors: uniq(todayPv),
            todayPageviews: todayPv.length,
            periodVisitors: uniq(pageviews),
            periodPageviews: pageviews.length,
            loggedInVisitors: new Set(pageviews.filter(r => r.user_id).map(r => r.user_id)).size,
            truncated: rows.length >= 20000,
        },
        memberStats,
        dailyStats,
        topPages,
        topReferrers,
        devices,
        recentMembers,
        activity,
    };
}
