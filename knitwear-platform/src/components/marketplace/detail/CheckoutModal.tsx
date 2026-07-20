'use client';

import { useState } from 'react';
import { X, Sparkles, ShieldCheck } from 'lucide-react';
import { createOrder } from '@/app/actions/order';
import { User } from '@supabase/supabase-js';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    pattern: {
        id: string;
        title: any;
        price_usd: number | null;
        price_krw: number | null;
        designer_id: string;
    };
    currentCredits: number;
    locale: string;
    user: User | null;
    onSuccess: () => void;
}

export function CheckoutModal({
    isOpen,
    onClose,
    pattern,
    currentCredits,
    locale,
    user,
    onSuccess
}: CheckoutModalProps) {
    const isKo = locale === 'ko';
    
    const priceCredits = (pattern.price_usd || 0) * 1000;
    
    // User needs enough credits to use credit payment
    const canPayWithCredits = currentCredits >= priceCredits;

    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen || !user) return null;

    const handleCheckout = async () => {
        setIsProcessing(true);

        try {
            const res = await createOrder({
                patternId: pattern.id,
                amount: priceCredits
            });

            if (res.error) {
                alert(res.error);
            } else {
                alert(isKo ? '도안 구매가 완료되었습니다!' : 'Pattern purchased successfully!');
                onSuccess();
                onClose();
            }
        } catch (err: any) {
            alert(err.message || 'Error occurred');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-stone-100">
                {/* Header */}
                <div className="bg-stone-50 px-6 py-4 flex items-center justify-between border-b border-stone-100">
                    <h3 className="font-extrabold text-stone-800 text-lg flex items-center gap-2">
                        <Sparkles size={20} className="text-orange-500" />
                        {isKo ? '도안 결제 및 구매' : 'Checkout Pattern'}
                    </h3>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Item Summary */}
                    <div className="bg-cream-50/50 rounded-2xl p-4 border border-tan-100 mb-6">
                        <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                            {isKo ? '구매 상품' : 'Item'}
                        </span>
                        <h4 className="font-bold text-stone-800 text-base mb-2 mt-0.5 line-clamp-1">
                            {pattern.title?.[locale] || pattern.title?.ko || pattern.title?.en}
                        </h4>
                        <div className="flex justify-between items-baseline mt-1">
                            <span className="text-xs text-stone-500">{isKo ? '가격' : 'Price'}</span>
                            <div className="text-right">
                                <p className="text-lg font-black text-stone-900">{priceCredits.toLocaleString()} Credits</p>
                            </div>
                        </div>
                    </div>

                    {/* Credit Status Summary */}
                    <div className="bg-stone-50 rounded-2xl p-5 mb-6 border border-stone-150 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-stone-500">{isKo ? '내 보유 크레딧' : 'Your Credits'}</span>
                            <span className="font-bold text-stone-800">{currentCredits.toLocaleString()} Credits</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-t border-stone-200/60 pt-3">
                            <span className="text-stone-500">{isKo ? '차감 예정 크레딧' : 'Required Credits'}</span>
                            <span className="font-extrabold text-orange-600">-{priceCredits.toLocaleString()} Credits</span>
                        </div>
                    </div>

                    {!canPayWithCredits && (
                        <div className="mb-6 p-4 bg-rose-50 rounded-2xl border border-rose-100 flex flex-col items-center text-center gap-2">
                            <p className="text-xs font-semibold text-rose-600">
                                ⚠️ {isKo ? '보유하신 크레딧이 부족합니다.' : 'Insufficient credit balance.'}
                            </p>
                            <p className="text-[11px] text-stone-500">
                                {isKo ? '안전한 거래를 위해 먼저 크레딧을 충전해 주세요.' : 'Please charge credits to proceed with the download.'}
                            </p>
                        </div>
                    )}

                    {/* CTA Button */}
                    {canPayWithCredits ? (
                        <button
                            onClick={handleCheckout}
                            disabled={isProcessing}
                            className={`w-full py-4 rounded-2xl text-white font-extrabold transition-all text-base flex items-center justify-center gap-2 shadow-md ${
                                isProcessing
                                    ? 'bg-stone-300 cursor-not-allowed'
                                    : 'bg-stone-950 hover:bg-stone-850 active:scale-[0.98]'
                            }`}
                        >
                            {isProcessing ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                    {isKo ? '결제 진행 중...' : 'Processing...'}
                                </>
                            ) : (
                                <>
                                    <ShieldCheck size={18} />
                                    {isKo ? `${priceCredits.toLocaleString()} 크레딧 결제하기` : `Pay ${priceCredits.toLocaleString()} Credits`}
                                </>
                            )}
                        </button>
                    ) : (
                        <a
                            href={`/${locale}/payments`}
                            className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold transition-all text-base flex items-center justify-center gap-2 shadow-md text-center"
                        >
                            <span>💳</span>
                            {isKo ? '크레딧 충전하러 가기' : 'Go to Charge Credits'}
                        </a>
                    )}

                    <p className="text-center text-[10px] text-stone-400 mt-4">
                        🔒 안전하고 빠른 크레딧 거래 시스템이 적용됩니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
