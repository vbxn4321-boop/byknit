import { getTranslations } from 'next-intl/server';
import { MarketplaceClient } from '@/components/marketplace/MarketplaceClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'marketplace' });

    return {
        title: `${t('title')} - byKnit`,
        description: 'Discover and purchase knitting patterns from creators worldwide',
    };
}

export default async function MarketplacePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;

    return <MarketplaceClient locale={locale} />;
}
