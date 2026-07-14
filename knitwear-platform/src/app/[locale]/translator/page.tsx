import { getTranslations } from 'next-intl/server';
import { TranslatorClient } from '@/components/translator/TranslatorClient';
import { createClient } from '@/utils/supabase/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;

    return {
        title: locale === 'ko' ? '영문 뜨개 도안 번역기 (약어 자동 한글 번역) - byKnit' : 'AI Knitting Pattern Translator - byKnit',
        description: locale === 'ko' 
            ? '서술형 영문 뜨개 도안의 어려운 약어(k2tog, ssk 등)와 설명글을 표준 한국어 뜨개 용어와 해설로 1초 만에 완벽하게 무료로 번역해 주는 전문 AI 번역기입니다.'
            : 'Translate descriptive English knitting patterns into standard symbols and Korean explanations in just 1 second using our free specialized AI translator.',
    };
}

export default async function TranslatorPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;

    // Retrieve active Supabase session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return <TranslatorClient locale={locale} user={user} />;
}
