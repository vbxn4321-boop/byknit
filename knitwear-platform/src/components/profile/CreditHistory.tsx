'use client';

import { useEffect, useState } from 'react';
import { getCreditHistory } from '@/app/actions/credits';
import { requestCancelPayment } from '@/app/actions/payment';
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
    const [refundingId, setRefundingId] = useState<string | null>(null);
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

    const handleRefund = async (tx: CreditTransaction, paymentId: string) => {
        const confirmMsg = locale === 'ko'
            ? `정말 이 결제 건을 환불하시겠습니까?\n환불 시 충전된 ${tx.amount} 크레딧이 즉시 차감 회수되며, 결제 금액이 결제 수단으로 환불 처리됩니다.`
            : `Are you sure you want to refund this payment?\nUpon refund, the charged ${tx.amount} credits will be deducted immediately, and the payment amount will be refunded.`;

        if (!confirm(confirmMsg)) return;

        setRefundingId(tx.id);
        try {
            const res = await requestCancelPayment(paymentId, '사용자 즉시 환불');
            if (res.success) {
                alert(locale === 'ko' ? '환불 처리가 성공적으로 완료되었습니다.' : 'Refund completed successfully.');
                window.location.reload();
            } else {
                alert(res.error || (locale === 'ko' ? '환불 처리 중 오류가 발생했습니다.' : 'An error occurred during refund.'));
            }
        } catch (err: any) {
            console.error('Refund click failed:', err);
            alert(locale === 'ko' ? '서버 연결 실패로 환불 처리를 완료하지 못했습니다.' : 'Failed to connect to server.');
        } finally {
            setRefundingId(null);
        }
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
                {displayedHistory.map((tx) => {
                    const isPortOneDeposit = tx.amount > 0 && tx.description.includes('포트원 충전');
                    const paymentIdMatch = tx.description.match(/주문번호: (.*?)\)/);
                    const paymentId = paymentIdMatch ? paymentIdMatch[1] : null;
                    const isWithin7Days = (Date.now() - new Date(tx.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000;
                    const refunded = paymentId ? history.some(h => h.amount < 0 && h.description.includes('환불') && h.description.includes(paymentId)) : false;
                    const canRefund = isPortOneDeposit && paymentId && isWithin7Days && !refunded;

                    return (
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
                                    {canRefund && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (paymentId) handleRefund(tx, paymentId);
                                            }}
                                            disabled={refundingId !== null}
                                            className="mt-2 text-xs font-bold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:bg-stone-100 disabled:text-stone-400 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                                        >
                                            {refundingId === tx.id ? (
                                                <>
                                                    <span className="w-3.5 h-3.5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></span>
                                                    {locale === 'ko' ? '처리 중...' : 'Processing...'}
                                                </>
                                            ) : (
                                                locale === 'ko' ? '환불 신청' : 'Refund'
                                            )}
                                        </button>
                                    )}
                                    {isPortOneDeposit && refunded && (
                                        <span className="inline-block mt-2 text-xs font-semibold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg">
                                            {locale === 'ko' ? '환불 완료' : 'Refunded'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className={`font-bold text-lg ${tx.amount > 0 ? 'text-sage-600' : 'text-rose-600'} flex items-center gap-1.5`}>
                                {tx.amount > 0 ? '+' : ''}{tx.amount}
                                <div className="w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-[10px] font-black text-white leading-none shadow-sm">C</div>
                            </div>
                        </div>
                    );
                })}
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
