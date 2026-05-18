'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export function CookieBanner() {
    const t = useTranslations('cookieBanner');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if consent has already been made
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie_consent', 'granted');
        setIsVisible(false);

        // Google Consent Mode v2 signal
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('consent', 'update', {
                'ad_storage': 'granted',
                'ad_user_data': 'granted',
                'ad_personalization': 'granted',
                'analytics_storage': 'granted'
            });
        }
    };

    const handleDeny = () => {
        localStorage.setItem('cookie_consent', 'denied');
        setIsVisible(false);

        // Google Consent Mode v2 signal (ensure denied)
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('consent', 'update', {
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'analytics_storage': 'denied'
            });
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-tan-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 z-50 animate-in slide-in-from-bottom duration-500">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-brown-600 text-center sm:text-left">
                    <p>
                        {t('message')}
                        <Link href="/privacy" className="ml-1 underline text-rose-500 hover:text-rose-600">
                            {t('privacyLink')}
                        </Link>
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleDeny}
                        className="px-4 py-2 text-sm font-medium text-brown-600 bg-tan-100 hover:bg-tan-200 rounded-lg transition-colors"
                    >
                        {t('deny')}
                    </button>
                    <button
                        onClick={handleAccept}
                        className="px-6 py-2 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-lg shadow-sm transition-all active:scale-95"
                    >
                        {t('acceptAll')}
                    </button>
                </div>
            </div>
        </div>
    );
}
