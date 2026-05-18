import { getTranslations } from 'next-intl/server';
import { PatternDetailClient } from '@/components/marketplace/PatternDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketplace' });

    return {
        title: `Pattern Details - byKnit`,
        description: 'View and download knitting pattern',
    };
}

import { createClient } from '@/utils/supabase/server';

export default async function PatternDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
    const { locale, id } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return <PatternDetailClient patternId={id} locale={locale} user={user} />;
}
