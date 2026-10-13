'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { Users, Eye, UserPlus, Activity, Search } from 'lucide-react';
import { getAdminAnalytics } from '@/app/actions/activity';

type Data = Exclude<Awaited<ReturnType<typeof getAdminAnalytics>>, { error: string }>;

const EVENT_LABEL: Record<string, string> = { pageview: '페이지 방문', login: '로그인' };
const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number | string; sub?: string }) {
    return (
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <div className="flex items-center gap-2 text-stone-400 text-xs font-bold">{icon}{label}</div>
            <div className="text-2xl font-black text-stone-900 mt-2">{value}</div>
            {sub && <div className="text-xs text-stone-400 font-medium mt-1">{sub}</div>}
        </div>
    );
}

function RankList({ title, items }: { title: string; items: { name: string; value: number }[] }) {
    const max = Math.max(1, ...items.map(i => i.value));
    return (
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <h3 className="text-sm font-black text-stone-900 mb-3">{title}</h3>
            {items.length === 0 && <p className="text-xs text-stone-400">데이터 없음</p>}
            <ul className="space-y-2">
                {items.map(i => (
                    <li key={i.name} className="text-xs">
                        <div className="flex justify-between font-bold text-stone-600">
                            <span className="truncate pr-2">{i.name}</span><span>{i.value}</span>
                        </div>
                        <div className="h-1.5 bg-stone-100 rounded-full mt-1">
                            <div className="h-1.5 bg-rose-400 rounded-full" style={{ width: `${(i.value / max) * 100}%` }} />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function AdminAnalyticsPage() {
    const [days, setDays] = useState(14);
    const [eventType, setEventType] = useState('all');
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [data, setData] = useState<Data | null>(null);
    const [error, setError] = useState('');
    const [pending, startTransition] = useTransition();

    useEffect(() => {
        startTransition(async () => {
            try {
                const res = await getAdminAnalytics({ days, eventType, search: query });
                if ('error' in res) setError(res.error ?? '불러오기 실패');
                else { setError(''); setData(res); }
            } catch (e: any) {
                setError(e?.message || '불러오기 실패');
            }
        });
    }, [days, eventType, query]);

    const maxPv = Math.max(1, ...(data?.dailyStats.map(d => d.pageviews) || [1]));

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6 font-sans">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-black text-stone-900">방문자 · 회원 활동 분석</h1>
                    <p className="text-xs text-stone-400 font-medium mt-1">자체 수집 로그 기준입니다 (관리자 페이지 방문 및 봇은 제외, 한국 시간).</p>
                </div>
                <div className="flex gap-1">
                    {[7, 14, 30, 90].map(d => (
                        <button key={d} onClick={() => setDays(d)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${days === d ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-500'}`}>
                            {d}일
                        </button>
                    ))}
                </div>
            </div>

            {error && <div className="bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold rounded-xl p-4">{error}
                {error.includes('site_activity_logs') && <span className="block text-xs mt-1">Supabase에 20261013_site_activity_logs.sql 마이그레이션을 먼저 실행하세요.</span>}
            </div>}
            {!data && !error && <p className="text-sm text-stone-400 font-bold">불러오는 중...</p>}

            {data && (
                <div className={pending ? 'opacity-60 transition-opacity space-y-6' : 'space-y-6'}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Stat icon={<Eye size={14} />} label="오늘 방문자" value={data.summary.todayVisitors} sub={`페이지뷰 ${data.summary.todayPageviews}`} />
                        <Stat icon={<Users size={14} />} label={`최근 ${days}일 방문자`} value={data.summary.periodVisitors} sub={`페이지뷰 ${data.summary.periodPageviews} · 로그인 회원 ${data.summary.loggedInVisitors}명`} />
                        <Stat icon={<UserPlus size={14} />} label="전체 회원" value={data.memberStats.total} sub={`오늘 +${data.memberStats.newToday} · 7일 +${data.memberStats.new7d}`} />
                        <Stat icon={<Activity size={14} />} label="7일 내 접속 회원 (방문 기록 기준)" value={data.memberStats.active7d} />
                    </div>
                    {data.summary.truncated && <p className="text-xs text-amber-600 font-bold">로그가 20,000건을 넘어 최근 20,000건만 집계되었습니다.</p>}

                    <div className="bg-white rounded-2xl border border-stone-200 p-5">
                        <h3 className="text-sm font-black text-stone-900 mb-4">일별 방문 추이</h3>
                        <div className="flex items-end gap-1 h-36">
                            {data.dailyStats.map(d => (
                                <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                    <div className="w-full bg-rose-300 hover:bg-rose-500 rounded-t" style={{ height: `${(d.pageviews / maxPv) * 100}%`, minHeight: d.pageviews ? 2 : 0 }} />
                                    <span className="absolute -top-1 hidden group-hover:block bg-stone-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-10">
                                        {d.date.slice(5)} · 방문자 {d.visitors} / PV {d.pageviews}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between text-[10px] text-stone-400 font-bold mt-2">
                            <span>{data.dailyStats[0]?.date.slice(5)}</span><span>{data.dailyStats.at(-1)?.date.slice(5)}</span>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-3">
                        <RankList title="인기 페이지" items={data.topPages} />
                        <RankList title="유입 경로" items={data.topReferrers} />
                        <RankList title="기기" items={data.devices} />
                    </div>

                    <div className="bg-white rounded-2xl border border-stone-200 p-5 overflow-x-auto">
                        <h3 className="text-sm font-black text-stone-900 mb-3">최근 가입 회원</h3>
                        <table className="w-full text-xs min-w-[640px]">
                            <thead><tr className="text-left text-stone-400 border-b border-stone-100">
                                <th className="py-2">이메일</th><th>닉네임</th><th>가입 방식</th><th>가입일</th><th>최근 접속</th><th className="text-right">활동수({days}일)</th>
                            </tr></thead>
                            <tbody>
                                {data.recentMembers.map(m => (
                                    <tr key={m.id} className="border-b border-stone-50 text-stone-700 font-medium">
                                        <td className="py-2">{m.email}</td><td>{m.name || '-'}</td><td>{m.provider}</td>
                                        <td>{fmt(m.createdAt)}</td><td>{fmt(m.lastSignInAt)}</td><td className="text-right">{m.activityCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-white rounded-2xl border border-stone-200 p-5 overflow-x-auto">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <h3 className="text-sm font-black text-stone-900">활동 로그 (최근 200건)</h3>
                            <div className="flex gap-2">
                                <select value={eventType} onChange={e => setEventType(e.target.value)}
                                    className="text-xs font-bold border border-stone-200 rounded-lg px-2 py-1.5 bg-white">
                                    <option value="all">전체</option><option value="pageview">페이지 방문</option><option value="login">로그인</option>
                                </select>
                                <form onSubmit={e => { e.preventDefault(); setQuery(search); }} className="flex items-center border border-stone-200 rounded-lg px-2 bg-white">
                                    <Search size={12} className="text-stone-400" />
                                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이메일/닉네임/경로"
                                        className="text-xs py-1.5 px-2 outline-none w-40" />
                                </form>
                            </div>
                        </div>
                        <table className="w-full text-xs min-w-[640px]">
                            <thead><tr className="text-left text-stone-400 border-b border-stone-100">
                                <th className="py-2">시각</th><th>구분</th><th>회원</th><th>경로</th><th>기기</th><th>방문자ID</th>
                            </tr></thead>
                            <tbody>
                                {data.activity.map((a, i) => (
                                    <tr key={i} className="border-b border-stone-50 text-stone-700 font-medium">
                                        <td className="py-2 whitespace-nowrap">{fmt(a.at)}</td>
                                        <td>{EVENT_LABEL[a.event] || a.event}</td>
                                        <td>{a.email ? `${a.name ? a.name + ' · ' : ''}${a.email}` : <span className="text-stone-300">비회원</span>}</td>
                                        <td className="max-w-[240px] truncate">{a.path}</td><td>{a.device}</td>
                                        <td className="font-mono text-stone-400">{a.visitorId}</td>
                                    </tr>
                                ))}
                                {data.activity.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-stone-400">기록이 없습니다.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
