'use client';

import React from 'react';
import { 
    ShoppingBag, 
    Truck, 
    AlertCircle, 
    MessageSquare, 
    TrendingUp, 
    ArrowUpRight,
    TrendingDown,
    Calendar,
    ChevronRight
} from 'lucide-react';
import { SellerTab } from '@/app/[locale]/seller/page';

interface SellerDashboardProps {
    setActiveTab: (tab: SellerTab) => void;
    locale: string;
}

export function SellerDashboard({ setActiveTab, locale }: SellerDashboardProps) {
    // Mock statistical data
    const summaryCards = [
        { id: 'orders', title: locale === 'ko' ? '신규 주문' : 'New Orders', value: '4', color: 'bg-emerald-50 text-emerald-600', tab: 'orders' as SellerTab },
        { id: 'delays', title: locale === 'ko' ? '발송 지연' : 'Shipping Delays', value: '1', color: 'bg-amber-50 text-amber-600', tab: 'orders' as SellerTab },
        { id: 'claims', title: locale === 'ko' ? '클레임 요청' : 'Claim Requests', value: '2', color: 'bg-rose-50 text-rose-600', tab: 'claims' as SellerTab },
        { id: 'qa', title: locale === 'ko' ? '미답변 문의' : 'Unanswered Q&A', value: '3', color: 'bg-indigo-50 text-indigo-600', tab: 'claims' as SellerTab },
    ];

    const salesHistory = [
        { date: '07/18', day: locale === 'ko' ? '월' : 'Mon', amount: 245000 },
        { date: '07/19', day: locale === 'ko' ? '화' : 'Tue', amount: 398000 },
        { date: '07/20', day: locale === 'ko' ? '수' : 'Wed', amount: 587000 },
        { date: '07/21', day: locale === 'ko' ? '목' : 'Thu', amount: 1147000 },
        { date: '07/22', day: locale === 'ko' ? '금' : 'Fri', amount: 1627000 },
        { date: '07/23', day: locale === 'ko' ? '토' : 'Sat', amount: 2247000 },
        { date: '07/24', day: locale === 'ko' ? '일' : 'Sun', amount: 3242000 },
    ];

    const recentInquiries = [
        { id: 1, author: '김은지', title: '클래식 울 털실 아이보리색 재입고 일정', date: '10분 전', status: 'pending' },
        { id: 2, author: '이태영', title: '5호 대바늘 패키지 배송 문의드립니다.', date: '1시간 전', status: 'pending' },
        { id: 3, author: 'Sarah K.', title: 'Is the Sage Green yarn lot consistent?', date: '4시간 전', status: 'pending' },
    ];

    return (
        <div className="space-y-10 animate-fadeIn">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-stone-800 font-sans">
                        {locale === 'ko' ? '상점 현황 대시보드' : 'Store Dashboard'}
                    </h1>
                    <p className="text-stone-500 text-sm mt-1">
                        {locale === 'ko' ? '오늘 하루 상점의 핵심 지표와 대응할 업무 목록입니다.' : 'Your core store metrics and tasks for today.'}
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-stone-100 shadow-soft text-stone-600 text-xs font-bold w-fit">
                    <Calendar size={14} className="text-[#8FBC8F]" />
                    <span>2026.07.24 (GMT+9)</span>
                </div>
            </div>

            {/* Todo Summary Badges */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryCards.map((card) => (
                    <button
                        key={card.id}
                        onClick={() => setActiveTab(card.tab)}
                        className="bg-white p-6 rounded-3xl border border-stone-100 shadow-soft hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between text-left group"
                    >
                        <span className="text-stone-400 text-xs font-bold block mb-2">{card.title}</span>
                        <div className="flex items-end justify-between">
                            <span className="text-3xl font-black text-stone-800">{card.value}</span>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${card.color} group-hover:scale-110 transition-transform`}>
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Sales Dashboard Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Chart Card */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-soft lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-stone-400 text-xs font-bold block">{locale === 'ko' ? '매출 리포트' : 'Sales Report'}</span>
                            <h2 className="text-xl font-bold text-stone-800 mt-0.5">{locale === 'ko' ? '이번 주 누적 매출' : 'Weekly Revenue'}</h2>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold">
                            <TrendingUp size={14} />
                            <span>+14.8%</span>
                        </div>
                    </div>

                    <div className="text-3xl font-black text-stone-800">
                        ₩ 3,242,000 
                        <span className="text-stone-400 text-xs font-bold ml-2">vs {locale === 'ko' ? '지난주 동일 대비' : 'vs last week'}</span>
                    </div>

                    {/* Premium SVG Line Chart */}
                    <div className="pt-6">
                        <div className="w-full bg-stone-50/50 p-4 rounded-3xl border border-stone-100">
                            {(() => {
                                const points = salesHistory.map((item, i) => {
                                    const x = 50 + (i * 500) / 6;
                                    const y = 205 - (item.amount / 3500000) * 160;
                                    return { x, y, ...item };
                                });

                                const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                                const areaData = `${pathData} L ${points[points.length - 1].x} 205 L ${points[0].x} 205 Z`;

                                return (
                                    <svg className="w-full h-auto" viewBox="0 0 600 250">
                                        <defs>
                                            <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#8FBC8F" stopOpacity="0.4" />
                                                <stop offset="100%" stopColor="#8FBC8F" stopOpacity="0.0" />
                                            </linearGradient>
                                        </defs>

                                        {/* Y-axis Grid Lines */}
                                        <line x1="50" y1="45" x2="550" y2="45" stroke="#EAE9E6" strokeDasharray="4 4" />
                                        <line x1="50" y1="125" x2="550" y2="125" stroke="#EAE9E6" strokeDasharray="4 4" />
                                        <line x1="50" y1="205" x2="550" y2="205" stroke="#EAE9E6" strokeWidth="1" />

                                        {/* Area under the line */}
                                        <path d={areaData} fill="url(#chartAreaGrad)" />

                                        {/* Main Chart Line */}
                                        <path 
                                            d={pathData} 
                                            fill="none" 
                                            stroke="#556B2F" 
                                            strokeWidth="3" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                        />

                                        {/* Data points & Labels */}
                                        {points.map((p, idx) => {
                                            const label = locale === 'ko' 
                                                ? `₩${(p.amount / 10000).toFixed(1)}만` 
                                                : `₩${(p.amount / 1000).toFixed(0)}k`;

                                            return (
                                                <g key={idx}>
                                                    {/* Data label floating above circle */}
                                                    <text 
                                                        x={p.x} 
                                                        y={p.y - 12} 
                                                        textAnchor="middle" 
                                                        stroke="#ffffff" 
                                                        strokeWidth="4" 
                                                        paintOrder="stroke" 
                                                        className="text-[10px] font-black fill-[#556B2F]"
                                                    >
                                                        {label}
                                                    </text>

                                                    {/* Outer white ring & inner circle */}
                                                    <circle cx={p.x} cy={p.y} r={6} fill="#ffffff" className="shadow-soft" />
                                                    <circle cx={p.x} cy={p.y} r={4} fill="#556B2F" />

                                                    {/* X-axis date labels at the bottom */}
                                                    <text 
                                                        x={p.x} 
                                                        y={225} 
                                                        textAnchor="middle" 
                                                        className="text-[10px] font-bold fill-stone-400"
                                                    >
                                                        {p.date}({p.day})
                                                    </text>
                                                </g>
                                            );
                                        })}
                                    </svg>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* mini analytics and CS todo */}
                <div className="space-y-6">
                    {/* Month Summary Card */}
                    <div className="bg-[#556B2F] text-white p-6 md:p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col justify-between h-48">
                        <div className="absolute right-0 bottom-0 translate-x-6 translate-y-6 opacity-10">
                            <TrendingUp size={160} />
                        </div>
                        <div>
                            <span className="text-stone-200 text-xs font-bold block opacity-85">{locale === 'ko' ? '이번 달 정산 예정액' : 'Estimated Payout'}</span>
                            <div className="text-3xl font-black mt-2">₩ 14,890,000</div>
                        </div>
                        <button 
                            onClick={() => setActiveTab('settlement')}
                            className="flex items-center gap-1.5 text-xs font-bold text-[#E8F0E8] hover:text-white transition-colors w-fit group"
                        >
                            <span>{locale === 'ko' ? '정산 세부 내역 보기' : 'View Payout Details'}</span>
                            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                    </div>

                    {/* Unanswered Q&As Card */}
                    <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-soft space-y-4">
                        <div className="flex items-center justify-between border-b border-stone-50 pb-3">
                            <h3 className="font-bold text-stone-800 text-sm">{locale === 'ko' ? '최근 미답변 문의' : 'Recent Inquiries'}</h3>
                            <button 
                                onClick={() => setActiveTab('claims')}
                                className="text-xs font-bold text-stone-400 hover:text-stone-700 transition-colors"
                            >
                                {locale === 'ko' ? '전체보기' : 'See All'}
                            </button>
                        </div>
                        <div className="space-y-3">
                            {recentInquiries.map((q) => (
                                <div key={q.id} className="flex items-start gap-2.5 p-2.5 rounded-2xl hover:bg-stone-50 transition-colors cursor-pointer" onClick={() => setActiveTab('claims')}>
                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                                        <MessageSquare size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-bold text-stone-700 truncate">{q.title}</h4>
                                        <div className="flex items-center gap-1.5 text-[10px] text-stone-400 mt-1 font-semibold">
                                            <span>{q.author}</span>
                                            <span>•</span>
                                            <span>{q.date}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
