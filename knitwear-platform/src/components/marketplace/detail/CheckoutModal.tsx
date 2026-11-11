'use client';
import { isMaintenanceActive, maintenancePaymentMessage } from '@/utils/maintenance';

import { useState, useEffect } from 'react';
import { X, Sparkles, ShieldCheck, Info } from 'lucide-react';
import { verifyAndRecordDirectPurchase } from '@/app/actions/payment';
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
    locale: string;
    user: User | null;
    onSuccess: () => void;
}

export function CheckoutModal({
    isOpen,
    onClose,
    pattern,
    locale,
    user,
    onSuccess
}: CheckoutModalProps) {
    const isKo = locale === 'ko';

    const priceKrw = pattern.price_krw || Math.round((pattern.price_usd || 0) * 1450);
    const isFree = priceKrw <= 0;

    const [isProcessing, setIsProcessing] = useState(false);
    const [isSdkLoaded, setIsSdkLoaded] = useState(false);

    // 포트원 V1(아임포트) SDK 스크립트 동적 주입
    useEffect(() => {
        if (!isOpen || isFree) return;

        if (typeof window !== 'undefined' && (window as any).IMP) {
            setIsSdkLoaded(true);
            return;
        }

        const existingScript = document.getElementById('iamport-sdk') as HTMLScriptElement;
        if (existingScript) {
            if ((window as any).IMP) {
                setIsSdkLoaded(true);
            } else {
                existingScript.addEventListener('load', () => setIsSdkLoaded(true));
            }
            return;
        }

        const script = document.createElement('script');
        script.id = 'iamport-sdk';
        script.src = 'https://cdn.iamport.kr/v1/iamport.js';
        script.async = true;
        script.onload = () => setIsSdkLoaded(true);
        script.onerror = () => console.error('Iamport SDK load failed');
        document.body.appendChild(script);
    }, [isOpen, isFree]);

    if (!isOpen || !user) return null;

    const handleFreeCheckout = async () => {
        setIsProcessing(true);
        try {
            const res = await createOrder({ patternId: pattern.id, amount: 0 });
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

    const handlePaidCheckout = () => {
        if (isMaintenanceActive()) {
            alert(maintenancePaymentMessage(isKo));
            return;
        }
        // @ts-ignore
        const IMP = typeof window !== 'undefined' ? window.IMP : null;
        if (!IMP) {
            alert(isKo ? '결제 모듈을 로딩 중입니다. 잠시 후 다시 시도해 주세요.' : 'Loading payment module. Please try again in a moment.');
            return;
        }

        setIsProcessing(true);

        const orderId = `pattern-${pattern.id.substring(0, 8)}-${Date.now()}`;
        const patternTitle = pattern.title?.[locale] || pattern.title?.ko || pattern.title?.en || 'Pattern';

        try {
            IMP.init('imp55247668');

            IMP.request_pay({
                pg: 'html5_inicis',
                pay_method: 'card',
                merchant_uid: orderId,
                name: `${patternTitle} (byKnit)`,
                amount: priceKrw,
                buyer_email: user.email || '',
                buyer_name: user.user_metadata?.full_name || '바이닛고객',
                buyer_tel: user.user_metadata?.phone || '010-0000-0000',
                m_redirect_url: `${window.location.origin}/${locale}/marketplace/${pattern.id}`,
                custom_data: {
                    user_id: user.id,
                    pattern_id: pattern.id
                },
                notice_url: `${window.location.origin}/api/payments/webhook`
            }, async (response: any) => {
                if (!response.success) {
                    alert(response.error_msg || (isKo ? '결제에 실패했습니다.' : 'Payment failed.'));
                    setIsProcessing(false);
                    return;
                }

                const res = await verifyAndRecordDirectPurchase(response.imp_uid, priceKrw, pattern.id);
                if (res.success) {
                    alert(isKo ? '도안 구매가 완료되었습니다!' : 'Pattern purchased successfully!');
                    onSuccess();
                    onClose();
                } else {
                    alert(res.error || (isKo ? '결제 검증에 실패했습니다.' : 'Payment verification failed.'));
                }
                setIsProcessing(false);
            });
        } catch (err: any) {
            console.error('Payment Error:', err);
            alert(err.message || (isKo ? '결제 모듈을 불러오지 못했습니다.' : 'Failed to load payment module.'));
            setIsProcessing(false);
        }
    };

    const handleCheckout = isFree ? handleFreeCheckout : handlePaidCheckout;

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
                                <p className="text-lg font-black text-stone-900">
                                    {isFree ? (isKo ? '무료' : 'Free') : `₩${priceKrw.toLocaleString()}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Refund Policy Notice Box */}
                    <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/80 mb-5 text-[11px] text-stone-500 leading-relaxed">
                        <div className="flex items-center gap-1.5 font-bold text-stone-700 mb-1">
                            <Info size={14} className="text-orange-500 shrink-0" />
                            <span>{isKo ? '취소 및 환불 안내' : 'Refund & Cancellation Policy'}</span>
                        </div>
                        <ul className="list-disc pl-4 space-y-0.5 text-stone-600 text-[10.5px]">
                            <li>
                                {isKo
                                    ? '구매한 상품은 결제일로부터 3개월 동안 다운로드 가능합니다.'
                                    : 'Purchased files can be downloaded for up to 3 months from the payment date.'}
                            </li>
                            <li>
                                {isKo
                                    ? '디지털 상품 특성상 다운로드(열람) 완료 시 교환 및 환불이 불가능합니다.'
                                    : 'Refunds are not available once the file has been downloaded or viewed.'}
                            </li>
                            <li>
                                {isKo
                                    ? '결제 후 미다운로드 상태에서 7일 이내 요청 시 100% 환불 가능합니다.'
                                    : 'A 100% refund is available within 7 days if not downloaded.'}
                            </li>
                        </ul>
                    </div>

                    {/* CTA Button */}
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
                                {isFree
                                    ? (isKo ? '무료로 받기' : 'Get for Free')
                                    : (isKo ? `₩${priceKrw.toLocaleString()} 결제하기` : `Pay ₩${priceKrw.toLocaleString()}`)}
                            </>
                        )}
                    </button>

                    <p className="text-center text-[10px] text-stone-400 mt-4">
                        🔒 PortOne 보안 결제 모듈을 사용하여 안전하게 결제됩니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
