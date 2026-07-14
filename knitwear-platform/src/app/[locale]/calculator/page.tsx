import { getTranslations } from 'next-intl/server';
import CalculatorClient from '@/components/calculator/CalculatorClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;

    return {
        title: locale === 'ko' ? '스마트 뜨개질 계산기 (콧수 계산 & 게이지 변환기) - byKnit' : 'Knitting Calculator & Gauge Converter - byKnit',
        description: locale === 'ko'
            ? '내 손땀(게이지)에 맞춰 뜨개질 도안의 콧수와 단수를 1초 만에 자동 계산하고 재설정해 주는 스마트 계산기입니다. 래글런 늘림 및 양말 단수 공식 계산도 제공합니다.'
            : 'Automatically calculate and convert knitting stitch and row counts to match your personal gauge. Calculate top-down raglan neck cast-on, socks, and grading.',
    };
}

import { createClient } from '@/utils/supabase/server';

export default async function CalculatorPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    
    // Auth Check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return <CalculatorClient locale={locale} user={user} />;
}
