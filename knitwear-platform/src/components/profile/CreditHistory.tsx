'use client';

import { useEffect, useState } from 'react';
import { getCreditHistory } from '@/app/actions/credits';
import { useTranslations } from 'next-intl';
import { Coins, ArrowUpRight, ArrowDownLeft, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { enUS, ko } from 'date-fns/locale';

interface CreditTransaction {
    id: string;
    amount: number;
    description: string;
    created_at: string;
}

export function CreditHistory({ userId }: { userId: string }) {
    const t = useTranslations('profile');
    const tCommon = useTranslations('common');
    const [history, setHistory] = useState<CreditTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const locale = (typeof window !== 'undefined' && window.location.pathname.startsWith('/ko')) ? 'ko' : 'en';

    const formatDescription = (desc: string) => {
        if (desc === 'signUpBonus') return t('credits.signUpBonus');
        if (desc === 'AI Image Conversion') return t('credits.aiImageConversion');
        if (desc === 'AI Editor Import') return t('credits.aiEditorImport');
        if (desc.startsWith('AI Export')) {
            const formatMatch = desc.match(/\((.*?)\)/);
            const formatStr = formatMatch ? formatMatch[1] : '';
            return t('credits.aiExport', { format: formatStr });
        }
        if (desc === 'Pattern Upload Bonus') return t('credits.patternUploadBonus');
        return desc;
    };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await getCreditHistory(userId);
                setHistory(data || []);
            } catch (error) {
                console.error('Error in CreditHistory:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [userId]);

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-tan-100 rounded-2xl" />
                ))}
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-3xl border border-tan-200">
                <div className="w-16 h-16 bg-cream-100 rounded-full flex items-center justify-center mx-auto mb-4 text-brown-400">
                    <Coins size={32} />
                </div>
                <h3 className="text-lg font-bold text-brown-700 mb-1">{t('credits.noHistory')}</h3>
                <p className="text-brown-500 text-sm">{t('credits.noHistoryDesc')}</p>
            </div>
        );
    }

    const displayedHistory = isExpanded ? history : history.slice(0, 3);

    return (
        <div className="space-y-4">
            <div className="space-y-4">
                {displayedHistory.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-tan-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${tx.amount > 0 ? 'bg-sage-100 text-sage-600' : 'bg-rose-100 text-rose-600'}`}>
                                {tx.amount > 0 ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                            </div>
                            <div>
                                <p className="font-bold text-brown-700">
                                    {formatDescription(tx.description)}
                                </p>
                                <p className="text-xs text-brown-400 flex items-center gap-1 mt-1">
                                    <Clock size={12} />
                                    {format(new Date(tx.created_at), 'PPP p', { locale: locale === 'ko' ? ko : enUS })}
                                </p>
                            </div>
                        </div>
                        <div className={`font-bold text-lg ${tx.amount > 0 ? 'text-sage-600' : 'text-rose-600'} flex items-center gap-1.5`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                            <div className="w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-[10px] font-black text-white leading-none shadow-sm">C</div>
                        </div>
                    </div>
                ))}
            </div>

            {history.length > 3 && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full py-3 mt-2 flex items-center justify-center gap-2 text-sm font-bold text-brown-500 hover:text-rose-500 bg-cream-50/50 hover:bg-cream-100/50 rounded-2xl transition-all border border-dashed border-tan-200"
                >
                    {isExpanded ? (
                        <>
                            {tCommon('showLess')}
                            <ChevronUp className="w-4 h-4" />
                        </>
                    ) : (
                        <>
                            {tCommon('showMore')}
                            <ChevronDown className="w-4 h-4" />
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
