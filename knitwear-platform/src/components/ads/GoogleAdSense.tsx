'use client';

import Script from 'next/script';

export function GoogleAdSenseScript({ pId }: { pId: string }) {
    if (!pId) return null;

    return (
        <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
        />
    );
}

// AdSense 게시자 ID (공개 값). 환경변수가 없을 때의 기본값.
const DEFAULT_AD_CLIENT = 'ca-pub-4367705210889906';

export function GoogleAdUnit({
    slotId,
    client,
    format = 'auto',
    responsive = true,
    style = { display: 'block' }
}: {
    slotId: string;
    client?: string;
    format?: 'auto' | 'fluid' | 'rectangle';
    responsive?: boolean;
    style?: React.CSSProperties;
}) {
    return (
        <div className="my-4 overflow-hidden rounded-lg bg-gray-50 border border-gray-100 min-h-[100px] flex items-center justify-center relative">
            {/* Real Ad Unit */}
            <ins
                className="adsbygoogle"
                style={style}
                data-ad-client={client || process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID || DEFAULT_AD_CLIENT}
                data-ad-slot={slotId}
                data-ad-format={format}
                data-full-width-responsive={responsive}
            />

            {/* 개발 환경에서만 자리 표시 (실서비스에서는 광고 위에 겹치지 않도록 숨김) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-4 pointer-events-none">
                    <span className="text-xs font-mono">Google Ad</span>
                    <span className="text-[10px] opacity-70">Slot: {slotId || 'Missing ID'}</span>
                </div>
            )}

            <Script id={`ad-init-${slotId}`}>
                {`(adsbygoogle = window.adsbygoogle || []).push({});`}
            </Script>
        </div>
    );
}
