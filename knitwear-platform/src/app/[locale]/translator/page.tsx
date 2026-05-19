import { getTranslations } from 'next-intl/server';
import { TranslatorClient } from '@/components/translator/TranslatorClient';
import { createClient } from '@/utils/supabase/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'nav' });

    return {
        title: locale === 'ko' ? 'AI 뜨개 도안 번역기 - byKnit' : 'AI Pattern Translator - byKnit',
        description: '구글도 못 번역하는 서술형 영문 뜨개 도안을 표준 한국어 뜨개 약어와 해설로 완벽하게 번역해 주는 전문 AI 번역기입니다.',
    };
}

export default async function TranslatorPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;

    // Retrieve active Supabase session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return <TranslatorClient locale={locale} user={user} />;
}
