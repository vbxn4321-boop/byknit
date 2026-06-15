'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Eye, Heart, X, DollarSign, Calendar, Loader2, RefreshCw, Users } from 'lucide-react';
import { getAnalyticsData } from '@/app/actions/analytics';
import { createClient } from '@/utils/supabase/client';
import { syncViewCounts } from '@/app/actions/pattern';

interface SellerStatsProps {
    locale: string;
    totalSales: number;
    totalRevenue: number;
    totalViews: number;
    totalLikes: number;
    totalFollowers: number;
}

type DateMode = 'last30' | 'thisMonth' | 'lastMonth' | 'today' | 'custom';

export function SellerStats({
    locale,
    totalSales = 0,
    totalRevenue = 0,
    totalViews = 0,
    totalLikes = 0,
    totalFollowers = 0
}: SellerStatsProps) {
    const [selectedStat, setSelectedStat] = useState<'sales' | 'views' | 'likes' | 'followers' | null>(null);
    const [dateMode, setDateMode] = useState<DateMode>('last30');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [rangeError, setRangeError] = useState<string>('');

    // Reset date mode when popup opens
    useEffect(() => {
        if (selectedStat) {
            setDateMode('last30');
            setStartDate('');
            setEndDate('');
            setShowDatePicker(false);
            setRangeError('');
        }
    }, [selectedStat]);



    const dateLabels: Record<DateMode, string> = locale === 'ko'
        ? { last30: '최근 30일', thisMonth: '이번 달', lastMonth: '저번 달', today: '오늘', custom: '기간 지정' }
        : { last30: 'Last 30 Days', thisMonth: 'This Month', lastMonth: 'Last Month', today: 'Today', custom: 'Custom' };

    const stats = [
        {
            key: 'sales' as const,
            label: locale === 'ko' ? '판매' : 'Sales',
            value: totalSales,
            subValue: `${totalRevenue.toLocaleString()} ${locale === 'ko' ? '크레딧' : 'Credits'}`,
            icon: TrendingUp,
            bgColor: 'bg-peach-50',
            iconColor: 'text-peach-500',
            barColor: 'bg-peach-400'
        },
        {
            key: 'views' as const,
            label: locale === 'ko' ? '조회수' : 'Views',
            value: totalViews,
            icon: Eye,
            bgColor: 'bg-sage-50',
            iconColor: 'text-sage-500',
            barColor: 'bg-sage-400'
        },
        {
            key: 'likes' as const,
            label: locale === 'ko' ? '좋아요' : 'Likes',
            value: totalLikes,
            icon: Heart,
            bgColor: 'bg-rose-50',
            iconColor: 'text-rose-500',
            barColor: 'bg-rose-400'
        },
        {
            key: 'followers' as const,
            label: locale === 'ko' ? '팔로워' : 'Followers',
            value: totalFollowers,
            icon: Users,
            bgColor: 'bg-indigo-50',
            iconColor: 'text-indigo-500',
            barColor: 'bg-indigo-400'
        }
    ];

    const [graphData, setGraphData] = useState<{
        data: number[];
        label: string;
        month?: number;
        startDay?: number;
        year?: number;
    }>({ data: [], label: '' });
    const [isLoading, setIsLoading] = useState(false);


    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            setUserId(user?.id || null);
        };
        fetchUser();
    }, []);


    useEffect(() => {
        if (!selectedStat || !userId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                let start = new Date();
                let end = new Date();
                let label = '';
                let month, startDay, year;

                // Calculate date range based on mode
                if (dateMode === 'today') {
                    start = new Date();
                    end = new Date();
                    label = locale === 'ko' ? '오늘' : 'Today';
                    month = start.getMonth() + 1;
                    startDay = start.getDate();
                    year = start.getFullYear();
                } else if (dateMode === 'thisMonth') {
                    start = new Date();
                    start.setDate(1); // 1st of this month
                    end = new Date();
                    label = locale === 'ko' ? '이번 달' : 'This Month';
                    month = start.getMonth() + 1;
                    startDay = 1;
                    year = start.getFullYear();
                } else if (dateMode === 'lastMonth') {
                    start = new Date();
                    start.setMonth(start.getMonth() - 1);
                    start.setDate(1);
                    end = new Date(start.getFullYear(), start.getMonth() + 1, 0); // End of last month
                    label = locale === 'ko' ? '저번 달' : 'Last Month';
                    month = start.getMonth() + 1;
                    startDay = 1;
                    year = start.getFullYear();
                } else if (dateMode === 'custom' && startDate && endDate) {
                    start = new Date(startDate);
                    end = new Date(endDate);
                    label = `${start.getMonth() + 1}/${start.getDate()} ~ ${end.getMonth() + 1}/${end.getDate()}`;
                    month = start.getMonth() + 1;
                    startDay = start.getDate();
                    year = start.getFullYear();
                } else {
                    // last30
                    start = new Date();
                    start.setDate(start.getDate() - 30);
                    end = new Date();
                    label = locale === 'ko' ? '최근 30일' : 'Last 30 Days';
                    // For rolling 30 days, simpler to just not set month/startDay for tooltip if crossing months is tricky
                    // But our tooltip helper handles it if we provide a start date.
                    month = start.getMonth() + 1;
                    startDay = start.getDate();
                    year = start.getFullYear();
                }

                const data = await getAnalyticsData(userId, start.toISOString(), end.toISOString(), selectedStat);

                setGraphData({
                    data,
                    label,
                    month,
                    startDay,
                    year
                });

            } catch (err) {
                console.error('Failed to fetch analytics graph:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [selectedStat, dateMode, startDate, endDate, userId, locale]);

    // Validate date range
    const handleDateRangeChange = (start: string, end: string) => {
        setStartDate(start);
        setEndDate(end);
        setRangeError('');

        if (start && end) {
            const startD = new Date(start);
            const endD = new Date(end);
            const diffTime = Math.abs(endD.getTime() - startD.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            if (startD > endD) {
                setRangeError(locale === 'ko' ? '시작일이 종료일보다 늦습니다' : 'Start date is after end date');
            } else if (diffDays > 60) {
                setRangeError(locale === 'ko' ? '최대 60일까지 선택 가능합니다' : 'Maximum 60 days allowed');
            } else {
                setDateMode('custom');
            }
        }
    };

    return (
        <>
            {/* Header Actions */}
            <div className="flex justify-end mb-4">
                <button
                    onClick={async () => {
                        setIsLoading(true);
                        try {
                            await syncViewCounts();
                            window.location.reload();
                        } catch (e) {
                            console.error(e);
                        } finally {
                            setIsLoading(false);
                        }
                    }}
                    disabled={isLoading}
                    className="flex items-center gap-1 text-xs text-brown-400 hover:text-brown-600 transition-colors"
                >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    {locale === 'ko' ? '데이터 동기화' : 'Sync Data'}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <button
                        key={stat.key}
                        onClick={() => setSelectedStat(stat.key)}
                        className="bg-white p-5 rounded-2xl shadow-soft border border-tan-100 hover:shadow-lg transition-all text-center group"
                    >
                        <div className={`mx-auto w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center ${stat.iconColor} mb-3`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <p className="text-3xl font-black text-brown-800">{stat.value.toLocaleString()}</p>
                        {stat.subValue && (
                            <p className="text-sm font-bold text-brown-400 flex items-center justify-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {stat.subValue}
                            </p>
                        )}
                        <p className="text-xs font-bold text-brown-400 mt-1">{stat.label}</p>
                    </button>
                ))}
            </div>

            {/* Stats Detail Popup */}
            {selectedStat && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedStat(null)}>
                    <div
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-tan-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {(() => {
                                    const stat = stats.find(s => s.key === selectedStat);
                                    if (!stat) return null;
                                    return (
                                        <>
                                            <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center ${stat.iconColor}`}>
                                                <stat.icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-brown-800">{stat.label}</h3>
                                                <p className="text-sm text-brown-400">{locale === 'ko' ? '기간별 상세' : 'Period Details'}</p>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                            <button
                                onClick={() => setSelectedStat(null)}
                                className="p-2 rounded-xl hover:bg-tan-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-brown-400" />
                            </button>
                        </div>

                        {/* Date Mode Selector */}
                        <div className="px-6 py-4 bg-cream-50 flex flex-wrap gap-2">
                            {(['last30', 'thisMonth', 'lastMonth', 'today'] as DateMode[]).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setDateMode(mode)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${dateMode === mode
                                        ? 'bg-brown-700 text-white'
                                        : 'bg-white text-brown-500 hover:bg-tan-100'
                                        }`}
                                >
                                    {dateLabels[mode]}
                                </button>
                            ))}
                            {/* Calendar Button */}
                            <button
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${dateMode === 'custom'
                                    ? 'bg-brown-700 text-white'
                                    : 'bg-white text-brown-500 hover:bg-tan-100'
                                    }`}
                            >
                                <Calendar className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Date Range Picker */}
                        {showDatePicker && (
                            <div className="px-6 py-3 bg-cream-100 border-b border-tan-200">
                                <div className="flex gap-2 items-center mb-2">
                                    <div className="flex-1">
                                        <label className="text-[10px] text-brown-400 block mb-1">
                                            {locale === 'ko' ? '시작일' : 'Start'}
                                        </label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            max={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => handleDateRangeChange(e.target.value, endDate)}
                                            className="w-full px-3 py-2 rounded-lg border border-tan-200 text-brown-700 text-sm"
                                        />
                                    </div>
                                    <span className="text-brown-400 mt-4">~</span>
                                    <div className="flex-1">
                                        <label className="text-[10px] text-brown-400 block mb-1">
                                            {locale === 'ko' ? '종료일' : 'End'}
                                        </label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            max={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => handleDateRangeChange(startDate, e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-tan-200 text-brown-700 text-sm"
                                        />
                                    </div>
                                </div>
                                {rangeError && (
                                    <p className="text-rose-500 text-xs">{rangeError}</p>
                                )}
                                <p className="text-[10px] text-brown-300 mt-1">
                                    {locale === 'ko' ? '최대 60일까지 선택 가능' : 'Max 60 days'}
                                </p>
                            </div>
                        )}

                        <div className="p-6 relative">
                            <p className="text-xs font-bold text-brown-400 mb-4">
                                {locale === 'ko' ? '일별 추이' : 'Daily Trend'}
                            </p>

                            {isLoading ? (
                                <div className="h-40 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-brown-400" />
                                </div>
                            ) : (() => {
                                const maxValue = Math.max(...graphData.data, 1);
                                const stat = stats.find(s => s.key === selectedStat);
                                const daysCount = graphData.data.length;

                                // Helper to display date in tooltip
                                const getTooltipDate = (idx: number) => {
                                    if (graphData.month && graphData.startDay && graphData.year) {
                                        const date = new Date(graphData.year, graphData.month - 1, graphData.startDay + idx);
                                        return `${date.getMonth() + 1}월 ${date.getDate()}일`;
                                    }
                                    return `${idx + 1}일`;
                                };

                                // Helper for X-axis labels
                                const getXAxisLabel = (idx: number) => {
                                    if (graphData.month && graphData.startDay && graphData.year) {
                                        const date = new Date(graphData.year, graphData.month - 1, graphData.startDay + idx);
                                        return `${date.getDate()}일`;
                                    }
                                    return `${idx + 1}일`;
                                };

                                return (
                                    <>
                                        <div className="flex">
                                            {/* Y-Axis Labels */}
                                            <div className="flex flex-col justify-between h-40 pr-2 text-[10px] text-brown-300 w-6">
                                                <span>{maxValue}</span>
                                                <span>{Math.round(maxValue / 2)}</span>
                                                <span>0</span>
                                            </div>

                                            {/* Bars Container */}
                                            <div className="flex-1 pt-8 relative">
                                                {daysCount === 0 ? (
                                                    <div className="h-full flex items-center justify-center text-xs text-gray-400">
                                                        No Data
                                                    </div>
                                                ) : (
                                                    <div className="flex items-end gap-[2px] h-40">
                                                        {graphData.data.map((value, idx) => (
                                                            <div
                                                                key={idx}
                                                                className={`flex-1 ${stat?.barColor || 'bg-brown-400'} rounded-t opacity-70 hover:opacity-100 transition-opacity cursor-pointer relative group`}
                                                                style={{ height: `${(value / maxValue) * 100}%`, minHeight: value > 0 ? '4px' : '0' }}
                                                            >
                                                                {/* Tooltip */}
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-brown-600 text-white text-xs px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-20 pointer-events-none shadow-xl transform translate-y-1 group-hover:translate-y-0 text-center">
                                                                    <p className="font-medium opacity-70 text-[10px] mb-0.5">{getTooltipDate(idx)}</p>
                                                                    <p className="font-bold text-lg leading-none">{value.toLocaleString()}</p>
                                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-brown-600"></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* X-Axis Labels */}
                                        <div className="flex justify-between mt-2 text-xs text-brown-300 ml-6">
                                            <span>{daysCount > 0 ? getXAxisLabel(0) : ''}</span>
                                            <span>{daysCount > 0 ? getXAxisLabel(Math.floor(daysCount / 2)) : ''}</span>
                                            <span>{daysCount > 0 ? getXAxisLabel(daysCount - 1) : ''}</span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Total */}
                        <div className="px-6 pb-6">
                            <div className="bg-cream-50 rounded-2xl p-4 text-center">
                                <p className="text-sm text-brown-500 font-medium">
                                    {locale === 'ko' ? '총계' : 'Total'}
                                </p>
                                <p className="text-2xl font-black text-brown-800">
                                    {stats.find(s => s.key === selectedStat)?.value.toLocaleString() || 0}
                                </p>
                                {selectedStat === 'sales' && (
                                    <p className="text-sm text-brown-400 font-bold">
                                        ({locale === 'ko' ? '수익' : 'Revenue'}: {totalRevenue.toLocaleString()} {locale === 'ko' ? '크레딧' : 'Credits'})
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
