import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/utils/supabase/server';
import { getMyShopOrders } from '@/app/actions/shop';
import { ShopOrderList } from '@/components/shop/ShopOrderList';

export const dynamic = 'force-dynamic';

export default async function ShopOrdersPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect(`/${locale}/login`);

    const orders = await getMyShopOrders();
    return (
        <Suspense>
            <ShopOrderList orders={orders} locale={locale} />
        </Suspense>
    );
}
