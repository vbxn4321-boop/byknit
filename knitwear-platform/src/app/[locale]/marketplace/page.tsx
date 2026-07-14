import { getTranslations } from 'next-intl/server';
import { MarketplaceClient } from '@/components/marketplace/MarketplaceClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;

    return {
        title: locale === 'ko' ? '뜨개질 도안 마켓플레이스 (무료 대바늘 & 코바늘 도안) - byKnit' : 'Knitting & Crochet Patterns Marketplace - byKnit',
        description: locale === 'ko'
            ? '전 세계 크리에이터들이 제작한 무료 및 유료 대바늘, 코바늘 뜨개질 도안을 둘러보고 구매해 보세요. 옷, 가방, 모자, 목도리 등 다양한 니팅 가이드가 가득합니다.'
            : 'Discover and purchase free and premium knitting and crochet patterns from creators worldwide. Explore cardigans, sweaters, bags, and accessories.',
    };
}

export default async function MarketplacePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;

    return <MarketplaceClient locale={locale} />;
}
