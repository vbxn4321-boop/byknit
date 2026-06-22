'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { verifyAndChargePayment } from '@/app/actions/payment';

export default function PaymentSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const locale = (params?.locale as string) || 'ko';
    const isKo = locale === 'ko';

    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [errorMessage, setErrorMessage] = useState('');

    const paymentId = searchParams.get('paymentId');
    const amountStr = searchParams.get('amount');
    const creditsStr = searchParams.get('credits');

    useEffect(() => {
        if (!paymentId || !amountStr || !creditsStr) {
            setStatus('error');
            setErrorMessage(isKo ? '결제 정보가 올바르지 않습니다.' : 'Invalid payment information.');
            return;
        }

        const verify = async () => {
            try {
                const amount = parseInt(amountStr, 10);
                const credits = parseInt(creditsStr, 10);

                const res = await verifyAndChargePayment(paymentId, amount, credits);

                if (res.success) {
                    setStatus('success');
                } else {
                    setStatus('error');
                    setErrorMessage(res.error || (isKo ? '결제 검증에 실패했습니다.' : 'Payment verification failed.'));
                }
            } catch (err: any) {
                console.error(err);
                setStatus('error');
                setErrorMessage(err.message || 'Server connection error');
            }
        };

        verify();
    }, [paymentId, amountStr, creditsStr, isKo]);

    const handleGoBack = () => {
        router.push(`/${locale}/marketplace`);
    };

    return (
        <div className="min-h-screen bg-cream-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-soft border border-tan-200 text-center">
                
                {/* 1. Verifying State */}
                {status === 'verifying' && (
                    <div className="py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brown-600 mx-auto mb-6"></div>
                        <h2 className="text-xl font-bold text-brown-800 mb-2">
                            {isKo ? '결제 확인 중' : 'Verifying Payment'}
                        </h2>
                        <p className="text-brown-600 text-sm">
                            {isKo 
                                ? '결제 정산을 안전하게 확인하고 있습니다. 잠시만 기다려 주세요.' 
                                : 'We are verifying your transaction. Please wait.'}
                        </p>
                    </div>
                )}

                {/* 2. Success State */}
                {status === 'success' && (
                    <div className="py-4">
                        <div className="w-16 h-16 bg-emerald-100 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-extrabold text-brown-800 mb-2">
                            {isKo ? '충전 완료!' : 'Charge Successful!'}
                        </h2>
                        <p className="text-brown-600 text-sm mb-6">
                            {isKo 
                                ? '요청하신 크레딧이 계정에 정상적으로 적립되었습니다.' 
                                : 'Credits have been credited to your account balance.'}
                        </p>

                        {/* Receipt Box */}
                        <div className="bg-cream-50 rounded-2xl p-5 text-left border border-tan-150 mb-6 flex flex-col gap-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-brown-600">{isKo ? '주문번호' : 'Order ID'}</span>
                                <span className="font-semibold text-brown-800 break-all pl-4 text-right">{paymentId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-brown-600">{isKo ? '결제금액' : 'Amount'}</span>
                                <span className="font-semibold text-brown-800">₩ {parseInt(amountStr || '0', 10).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-t border-tan-100 pt-3 mt-1">
                                <span className="font-bold text-brown-700">{isKo ? '지급 크레딧' : 'Received Credits'}</span>
                                <span className="font-bold text-emerald-600 text-base">+{parseInt(creditsStr || '0', 10).toLocaleString()} Credits</span>
                            </div>
                        </div>

                        <button
                            onClick={handleGoBack}
                            className="w-full py-3.5 bg-brown-600 hover:bg-brown-700 text-white font-bold rounded-2xl transition-all duration-200 cursor-pointer shadow-soft"
                        >
                            {isKo ? '마켓플레이스로 이동' : 'Go to Marketplace'}
                        </button>
                    </div>
                )}

                {/* 3. Error State */}
                {status === 'error' && (
                    <div className="py-4">
                        <div className="w-16 h-16 bg-red-100 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-8 h-8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-extrabold text-red-800 mb-2">
                            {isKo ? '결제 오류' : 'Payment Error'}
                        </h2>
                        <p className="text-brown-600 text-sm mb-6">
                            {isKo 
                                ? '결제 처리 중 예상치 못한 문제가 발생했습니다.' 
                                : 'An error occurred during payment processing.'}
                        </p>

                        <div className="bg-red-50 text-red-800 border border-red-100 rounded-2xl p-4 text-sm text-left mb-6 break-all">
                            <strong>Error Details:</strong> {errorMessage}
                        </div>

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => router.push(`/${locale}/payments`)}
                                className="w-full py-3.5 bg-brown-600 hover:bg-brown-700 text-white font-bold rounded-2xl transition-all duration-200 cursor-pointer"
                            >
                                {isKo ? '다시 시도하기' : 'Try Again'}
                            </button>
                            <button
                                onClick={handleGoBack}
                                className="w-full py-3.5 bg-white border border-tan-300 hover:bg-cream-50 text-brown-800 font-bold rounded-2xl transition-all duration-200 cursor-pointer"
                            >
                                {isKo ? '취소하고 홈으로' : 'Cancel and Go Home'}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
