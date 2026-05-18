'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const t = useTranslations('common');

    useEffect(() => {
        console.error('Runtime Error:', error);
    }, [error]);

    return (
        <div className="error-boundary min-h-screen flex flex-col items-center justify-center bg-cream-50 p-4 font-sans z-[9999]">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-tan-200">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">😢</span>
                </div>
                <h2 className="text-2xl font-bold text-brown-700 mb-2">
                    {t('errorTitle') || 'Something went wrong!'}
                </h2>
                <p className="text-brown-600 mb-8 leading-relaxed">
                    {error.message || t('errorMessage') || 'An unexpected error occurred. Please try again.'}
                </p>
                <button
                    onClick={reset}
                    className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
                >
                    {t('tryAgain') || 'Try again'}
                </button>
            </div>
        </div>
    );
}
