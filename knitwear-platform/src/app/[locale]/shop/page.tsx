import { getShopProducts } from '@/app/actions/shop';
import { ShopCatalog } from '@/components/shop/ShopCatalog';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    return {
        title: locale === 'ko' ? '뜨개 샵 - 뜨개질 도구 판매 - byKnit' : 'Knitting Shop - Tools & Notions - byKnit',
        description: locale === 'ko'
            ? '대바늘, 코바늘, 부자재 등 뜨개질에 필요한 도구를 byKnit 샵에서 만나보세요.'
            : 'Shop knitting needles, crochet hooks, and notions at byKnit.',
    };
}

export default async function ShopPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const products = await getShopProducts();
    return <ShopCatalog products={products} locale={locale} />;
}
