import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/request';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { createClient } from '@/utils/supabase/server';
import { GoogleAdSenseScript } from '@/components/ads/GoogleAdSense';
import { CookieBanner } from '@/components/privacy/CookieBanner';

const nunito = Nunito({
    variable: "--font-nunito",
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700", "800"],
});



export const metadata: Metadata = {
    title: "byKnit - Create, Share & Discover Knitting Patterns",
    description: "Your creative knitting journey starts here. Discover patterns, create designs, and let AI inspire your next project.",
    keywords: ["knitting", "patterns", "crochet", "yarn", "DIY", "crafts"],
};

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
                    </div>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
