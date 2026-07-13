import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/request';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { createClient } from '@/utils/supabase/server';
import { GoogleAdSenseScript } from '@/components/ads/GoogleAdSense';
import { CookieBanner } from '@/components/privacy/CookieBanner';
import { CreditPopupManager } from '@/components/layout/CreditPopupManager';

const nunito = Nunito({
    variable: "--font-nunito",
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700", "800"],
});



export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'metadata' });

    return {
        title: t('title'),
        description: t('description'),
        keywords: [
            "knitting", "patterns", "crochet", "yarn", "DIY", "crafts", "byknit",
            "knitting chart maker", "crochet pattern generator", "photo to knitting pattern", "colorwork chart editor", "free knitting patterns",
            "뜨개질", "도안", "코바늘", "대바늘", "뜨개질 도안", "코바늘 도안", "대바늘 도안", "도안 변환기", "뜨개 도안 에디터", "사진 뜨개질", "무료 도안", "배색 차트", "뜨개질 차트", "손뜨개"
        ],
        openGraph: {
            title: t('title'),
            description: t('description'),
            url: 'https://byknit.com',
            siteName: 'byKnit',
            images: [
                {
                    url: 'https://byknit.com/og-image.png',
                    width: 1200,
                    height: 630,
                    alt: 'byKnit Open Graph Image',
                },
            ],
            locale: locale,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: t('title'),
            description: t('description'),
            images: ['https://byknit.com/og-image.png'],
        },
    };
}

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    if (!locales.includes(locale as Locale)) {
        notFound();
    }

    const messages = await getMessages();

    // Auth Check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Select AdSense ID based on locale
    const adClientKey = locale === 'ko'
        ? process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID_KR
        : process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID_EN;

    return (
        <html lang={locale} suppressHydrationWarning>
            <head>
                {/* Naver Search Advisor Verification */}
                <meta name="naver-site-verification" content="df5f7db3144b5b1714440e6b00c5d46336608816" />
                {/* PortOne SDK for KakaoPay */}
                <script src="https://cdn.iamport.kr/v1/iamport.js"></script>
                {/* Google Consent Mode v2 Initialization */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            // Default consent to 'denied'
                            gtag('consent', 'default', {
                                'ad_storage': 'denied',
                                'ad_user_data': 'denied',
                                'ad_personalization': 'denied',
                                'analytics_storage': 'denied'
                            });
                        `,
                    }}
                />
            </head>
            <body
                className={`${nunito.variable} font-sans antialiased bg-cream-50 text-brown-700 min-h-screen`}
                suppressHydrationWarning={true}
            >
                {/* Dynamically load the correct AdSense script */}
                <GoogleAdSenseScript pId={adClientKey || ''} />
                <NextIntlClientProvider messages={messages}>
                    <div className="flex flex-col min-h-screen">
                        <Header locale={locale as Locale} user={user} />
                        <main className="flex-1">
                            {children}
                        </main>
                        <Footer />
                        <CookieBanner />
                        <CreditPopupManager isAuth={!!user} />
                    </div>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
