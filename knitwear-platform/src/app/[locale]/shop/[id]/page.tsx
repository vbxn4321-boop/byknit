import { notFound } from 'next/navigation';
import { getShopProduct } from '@/app/actions/shop';
import { ShopProductDetail } from '@/components/shop/ShopProductDetail';
import { ogImageUrl } from '@/utils/imageUrl';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props) {
    const { id } = await params;
    const product = await getShopProduct(id);
    if (!product) return {};
    return {
        title: `${product.name} - byKnit`,
        description: product.summary || undefined,
        openGraph: product.images[0] ? { images: [ogImageUrl(product.images[0])] } : undefined,
    };
}

export default async function ShopProductPage({ params }: Props) {
    const { locale, id } = await params;
    const product = await getShopProduct(id);
    if (!product) notFound();
    return <ShopProductDetail product={product} locale={locale} />;
}
