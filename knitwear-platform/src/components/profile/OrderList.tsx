'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';

import { PatternModal } from '@/components/common/PatternModal';
import { User } from '@supabase/supabase-js';

interface OrderListProps {
    initialOrders: any[];
    locale: string;
    user: User | null;
}

export function OrderList({ initialOrders, locale, user }: OrderListProps) {
    const t = useTranslations('profile');
    const tCommon = useTranslations('common');
    const [visibleCount, setVisibleCount] = useState(3);
    const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);

    if (!initialOrders || initialOrders.length === 0) {
        return <p className="text-center py-8 text-brown-400 font-medium">{tCommon('noOrders')}</p>;
    }

    const displayedOrders = initialOrders.slice(0, visibleCount);

    const handleShowMore = () => {
        setVisibleCount(prev => prev + 15);
    };

    const handleShowLess = () => {
        setVisibleCount(3);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-4">
                {displayedOrders.map((order: any) => (
                    <div
                        key={order.id}
                        onClick={() => order.patterns?.id && setSelectedPatternId(order.patterns.id)}
                        className="flex items-center gap-4 p-4 rounded-2xl border border-tan-50 hover:bg-cream-50/30 transition-all group cursor-pointer active:scale-[0.99]"
                    >
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-tan-200 flex-shrink-0">
                            {order.patterns?.thumbnail_url && (
                                <img src={order.patterns.thumbnail_url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-brown-700 truncate group-hover:text-rose-500 transition-colors">
                                {locale === 'ko' ? (order.patterns?.title?.ko || order.patterns?.title?.en) : (order.patterns?.title?.en || order.patterns?.title?.ko)}
                            </h4>
                            <p className="text-sm text-brown-400">
                                {new Date(order.created_at).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-brown-700">${order.amount}</p>
                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${order.status === 'paid' ? 'bg-sage-100 text-sage-600' : 'bg-tan-100 text-brown-400'
                                }`}>
                                {order.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {initialOrders.length > 3 && (
                <div className="flex gap-2">
                    {initialOrders.length > visibleCount && (
                        <button
                            onClick={handleShowMore}
                            className="flex-1 py-3 mt-2 flex items-center justify-center gap-2 text-sm font-bold text-brown-500 hover:text-rose-500 bg-cream-50/50 hover:bg-cream-100/50 rounded-2xl transition-all border border-dashed border-tan-200"
                        >
                            {tCommon('showMore')} ({Math.min(15, initialOrders.length - visibleCount)})
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    )}
                    {visibleCount > 3 && (
                        <button
                            onClick={handleShowLess}
                            className="flex-1 py-3 mt-2 flex items-center justify-center gap-2 text-sm font-bold text-brown-500 hover:text-rose-500 bg-cream-50/50 hover:bg-cream-100/50 rounded-2xl transition-all border border-dashed border-tan-200"
                        >
                            {tCommon('showLess') || 'Fold'}
                            <ChevronUp className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}

            {selectedPatternId && (
                <PatternModal
                    patternId={selectedPatternId}
                    locale={locale}
                    user={user}
                    onClose={() => setSelectedPatternId(null)}
                />
            )}
        </div>
    );
}
