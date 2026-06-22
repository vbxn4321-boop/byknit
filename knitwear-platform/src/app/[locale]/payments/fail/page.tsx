'use client';

import { useSearchParams, useRouter, useParams } from 'next/navigation';

export default function PaymentFailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const locale = (params?.locale as string) || 'ko';
    const isKo = locale === 'ko';

    const code = searchParams.get('code') || 'PAYMENT_CANCELLED';
    const message = searchParams.get('message') || (isKo ? '사용자가 결제를 취소했거나 연동 오류가 발생했습니다.' : 'Transaction cancelled or integration error.');

    const handleRetry = () => {
        router.push(`/${locale}/payments`);
    };

    const handleGoHome = () => {
        router.push(`/${locale}/marketplace`);
    };

    return (
        <div className="min-h-screen bg-cream-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-soft border border-tan-200 text-center">
                
                {/* Fail Icon */}
                <div className="w-16 h-16 bg-red-100 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>

                {/* Title & Desc */}
                <h2 className="text-2xl font-extrabold text-brown-800 mb-2">
                    {isKo ? '결제 실패' : 'Payment Failed'}
                </h2>
                <p className="text-brown-600 text-sm mb-6">
                    {isKo 
                        ? '결제를 진행하는 도중 문제가 생겨 완료되지 않았습니다.' 
                        : 'The payment process was interrupted and could not be completed.'}
                </p>

                {/* Error Details Box */}
                <div className="bg-red-50 text-red-800 border border-red-100 rounded-2xl p-5 text-left mb-8 flex flex-col gap-2 text-sm break-all">
                    <div>
                        <span className="font-bold">{isKo ? '에러 코드' : 'Error Code'}:</span> {code}
                    </div>
                    <div>
                        <span className="font-bold">{isKo ? '상세 사유' : 'Reason'}:</span> {message}
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={handleRetry}
                        className="w-full py-3.5 bg-brown-600 hover:bg-brown-700 text-white font-bold rounded-2xl transition-all duration-200 cursor-pointer shadow-soft"
                    >
                        {isKo ? '다시 충전하기' : 'Try Again'}
                    </button>
                    <button
                        onClick={handleGoHome}
                        className="w-full py-3.5 bg-white border border-tan-300 hover:bg-cream-50 text-brown-800 font-bold rounded-2xl transition-all duration-200 cursor-pointer"
                    >
                        {isKo ? '마켓플레이스로 돌아가기' : 'Go to Marketplace'}
                    </button>
                </div>

            </div>
        </div>
    );
}
