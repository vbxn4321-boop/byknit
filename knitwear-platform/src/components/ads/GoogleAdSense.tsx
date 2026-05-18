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

export function GoogleAdUnit({
    slotId,
    format = 'auto',
    responsive = true,
    style = { display: 'block' }
}: {
    slotId: string;
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
                data-ad-client={process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}
                data-ad-slot={slotId}
                data-ad-format={format}
                data-full-width-responsive={responsive}
            />

            {/* Placeholder for Dev/Empty */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-4 pointer-events-none">
                <span className="text-xs font-mono">Google Ad</span>
                {process.env.NODE_ENV === 'development' && (
                    <span className="text-[10px] opacity-70">Slot: {slotId || 'Missing ID'}</span>
                )}
            </div>

            <Script id={`ad-init-${slotId}`}>
                {`(adsbygoogle = window.adsbygoogle || []).push({});`}
            </Script>
        </div>
    );
}
