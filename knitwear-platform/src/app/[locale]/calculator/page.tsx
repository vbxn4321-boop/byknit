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

export default async function CalculatorPage() {
    return <CalculatorClient />;
}
