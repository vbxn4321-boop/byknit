'use client';

import { useState, useEffect } from 'react';
import { X, CreditCard, Sparkles, ShieldCheck } from 'lucide-react';
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
    
    // Default prices if not set in DB
    const priceKrw = pattern.price_krw || (pattern.price_usd ? pattern.price_usd * 1450 : 0);
    const priceUsd = pattern.price_usd || Math.round(priceKrw / 1450);
    
    // User needs enough credits to use credit payment
    const canPayWithCredits = currentCredits >= priceUsd;

    const [paymentOption, setPaymentOption] = useState<'credit' | 'direct'>(
        canPayWithCredits ? 'credit' : 'direct'
    );
    const [selectedMethod, setSelectedMethod] = useState<'card' | 'kakaopay'>('card');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSdkLoaded, setIsSdkLoaded] = useState(false);

    // Load PortOne (Iamport) SDK
    useEffect(() => {
        if (!isOpen) return;

        if (document.getElementById('iamport-sdk')) {
            setIsSdkLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.id = 'iamport-sdk';
        script.src = 'https://cdn.iamport.kr/v1/iamport.js';
        script.async = true;
        script.onload = () => setIsSdkLoaded(true);
        script.onerror = () => console.error('Iamport SDK load failed');
        document.body.appendChild(script);
    }, [isOpen]);

    if (!isOpen || !user) return null;

    const handleCheckout = async () => {
        setIsProcessing(true);

        // Option A: Pay with Credits
        if (paymentOption === 'credit') {
            try {
                const res = await createOrder({
                    patternId: pattern.id,
                    amount: priceUsd
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
            return;
        }

        // Option B: Direct PortOne checkout
        if (!isSdkLoaded) {
            alert(isKo ? '결제 모듈을 로딩 중입니다. 잠시만 기다려 주세요.' : 'Loading payment module. Please wait.');
            setIsProcessing(false);
            return;
        }

        const orderId = `direct-${user.id.substring(0, 8)}-${pattern.id.substring(0, 4)}-${Date.now()}`;
        const patternTitle = pattern.title?.[locale] || pattern.title?.ko || pattern.title?.en || 'Pattern';

        try {
            // @ts-ignore
            const IMP = window.IMP;
            if (!IMP) throw new Error('Iamport SDK not initialized');

            IMP.init('imp55247668'); // Sandbox merchant id

            const pgCode = selectedMethod === 'kakaopay' ? 'kakaopay.TC0ONETIME' : 'kcp.T0000';

            IMP.request_pay({
                pg: pgCode,
                pay_method: 'card',
                merchant_uid: orderId,
                name: `${patternTitle} 구매 (byKnit)`,
                amount: priceKrw,
                buyer_email: user.email || '',
                buyer_name: user.user_metadata?.full_name || '바이닛고객',
                m_redirect_url: `${window.location.origin}/${locale}/marketplace/${pattern.id}?directPaymentId=${orderId}`, // mobile fallback
                custom_data: {
                    user_id: user.id,
                    pattern_id: pattern.id,
                    credits: 0 // direct purchase indicates no credit addition
                },
                notice_url: `${window.location.origin}/api/payments/webhook`
            }, async (response: any) => {
                if (response.success) {
                    const paymentId = response.imp_uid;
                    const verifyRes = await verifyAndRecordDirectPurchase(paymentId, priceKrw, pattern.id);

                    if (verifyRes.success) {
                        alert(isKo ? '도안 구매가 완료되었습니다!' : 'Pattern purchased successfully!');
                        onSuccess();
                        onClose();
                    } else {
                        alert(verifyRes.error || (isKo ? '결제 검증에 실패했습니다.' : 'Payment verification failed.'));
                    }
                } else {
                    alert(response.error_msg || 'Payment cancelled');
                }
                setIsProcessing(false);
            });

        } catch (err: any) {
            console.error('Payment Direct Flow Error:', err);
            
            // Simulation Sandbox backup
            console.log('Falling back to direct sandbox simulation...');
            setTimeout(async () => {
                const mockPaymentId = `mock-direct-${Date.now()}`;
                const verifyRes = await verifyAndRecordDirectPurchase(mockPaymentId, priceKrw, pattern.id);
                
                if (verifyRes.success) {
                    alert(isKo ? '[시뮬레이션] 결제가 성공적으로 승인되었습니다!' : '[Simulation] Payment successfully processed!');
                    onSuccess();
                    onClose();
                } else {
                    alert(verifyRes.error || 'Verification failed');
                }
                setIsProcessing(false);
            }, 1500);
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
                                <p className="text-lg font-black text-stone-900">₩ {priceKrw.toLocaleString()}</p>
                                <p className="text-[11px] text-stone-400">({priceUsd.toLocaleString()} Credits)</p>
                            </div>
                        </div>
                    </div>

                    {/* Choose Payment Option */}
                    <div className="space-y-4 mb-6">
                        {/* Option 1: Credit Pay */}
                        <label 
                            className={`block p-4 rounded-2xl border transition-all duration-200 ${
                                paymentOption === 'credit'
                                    ? 'border-orange-500 bg-orange-50/20 ring-2 ring-orange-500/10'
                                    : 'border-stone-200 bg-white hover:border-stone-300'
                            } ${!canPayWithCredits ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <div className="flex items-start gap-3">
                                <input 
                                    type="radio" 
                                    name="paymentOption" 
                                    value="credit"
                                    checked={paymentOption === 'credit'}
                                    disabled={!canPayWithCredits}
                                    onChange={() => setPaymentOption('credit')}
                                    className="w-4.5 h-4.5 mt-0.5 text-orange-500 border-stone-300 focus:ring-orange-500 cursor-pointer"
                                />
                                <div className="flex-1">
                                    <div className="flex justify-between items-baseline">
                                        <span className="font-extrabold text-sm text-stone-800">{isKo ? '보유 크레딧으로 결제' : 'Pay with Credits'}</span>
                                        <span className="text-xs font-bold text-emerald-600">
                                            {currentCredits.toLocaleString()} Credits 보유
                                        </span>
                                    </div>
                                    <p className="text-xs text-stone-500 mt-1 leading-normal">
                                        {isKo 
                                            ? `보유하신 크레딧에서 ${priceUsd} 크레딧이 즉시 차감됩니다.`
                                            : `${priceUsd} credits will be deducted from your balance.`}
                                    </p>
                                    {!canPayWithCredits && (
                                        <span className="inline-block mt-2 text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                                            ⚠️ {isKo ? '크레딧 부족' : 'Insufficient Credits'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </label>

                        {/* Option 2: Direct PortOne Pay */}
                        <label 
                            className={`block p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                                paymentOption === 'direct'
                                    ? 'border-orange-500 bg-orange-50/20 ring-2 ring-orange-500/10'
                                    : 'border-stone-200 bg-white hover:border-stone-300'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <input 
                                    type="radio" 
                                    name="paymentOption" 
                                    value="direct"
                                    checked={paymentOption === 'direct'}
                                    onChange={() => setPaymentOption('direct')}
                                    className="w-4.5 h-4.5 mt-0.5 text-orange-500 border-stone-300 focus:ring-orange-500 cursor-pointer"
                                />
                                <div className="flex-1">
                                    <span className="font-extrabold text-sm text-stone-800">{isKo ? '실시간 직접 결제하기' : 'Pay Directly'}</span>
                                    <p className="text-xs text-stone-500 mt-1 leading-normal">
                                        {isKo 
                                            ? '크레딧 충전 과정 없이 카드나 간편결제로 바로 결제하여 도안을 구매합니다.'
                                            : 'Pay directly using credit card or KakaoPay without charging credits.'}
                                    </p>

                                    {/* Direct payment methods selection (visible only when direct is active) */}
                                    {paymentOption === 'direct' && (
                                        <div className="grid grid-cols-2 gap-2 mt-3.5 animate-in slide-in-from-top-1 duration-150">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedMethod('card')}
                                                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                                                    selectedMethod === 'card'
                                                        ? 'border-stone-800 bg-stone-900 text-white'
                                                        : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                                                }`}
                                            >
                                                <CreditCard size={14} />
                                                {isKo ? '신용카드' : 'Credit Card'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedMethod('kakaopay')}
                                                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                                                    selectedMethod === 'kakaopay'
                                                        ? 'border-yellow-400 bg-yellow-400 text-stone-900'
                                                        : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                                                }`}
                                            >
                                                <span className="text-sm leading-none">💛</span>
                                                {isKo ? '카카오페이' : 'KakaoPay'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </label>
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
                                {paymentOption === 'credit' 
                                    ? (isKo ? `${priceUsd} 크레딧 결제하기` : `Pay ${priceUsd} Credits`)
                                    : (isKo ? `₩ ${priceKrw.toLocaleString()} 안전 결제하기` : `Pay ₩ ${priceKrw.toLocaleString()}`)
                                }
                            </>
                        )}
                    </button>

                    <p className="text-center text-[10px] text-stone-400 mt-4">
                        🔒 PortOne 보안 토큰 결제 및 암호화 거래 시스템이 적용됩니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
