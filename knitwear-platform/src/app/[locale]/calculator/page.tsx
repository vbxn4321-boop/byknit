import { getTranslations } from 'next-intl/server';
import CalculatorClient from '@/components/calculator/CalculatorClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'calculator' });

    return {
        title: `${t('title')} - byKnit`,
        description: t('subtitle'),
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
