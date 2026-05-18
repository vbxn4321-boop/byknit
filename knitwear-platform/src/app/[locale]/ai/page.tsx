import { getTranslations } from 'next-intl/server';
import { AIClient } from '@/components/ai/AIClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'nav' });

    return {
        title: `${t('chartConverter')} - byKnit`,
        description: 'Transform images into knitting charts or create patterns with AI',
    };
}

import { createClient } from '@/utils/supabase/server';

export default async function AIPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;

    // Auth Check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let credits = 0;
    if (user) {
        const { data } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
        credits = data?.credits ?? 0;
    }

    return <AIClient locale={locale} user={user} initialCredits={credits} />;
}
