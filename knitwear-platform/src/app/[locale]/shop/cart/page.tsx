import { createClient } from '@/utils/supabase/server';
import { ShopCheckout } from '@/components/shop/ShopCheckout';

export const dynamic = 'force-dynamic';

export default async function ShopCartPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <ShopCheckout
            locale={locale}
            user={user ? { id: user.id, email: user.email ?? null } : null}
        />
    );
}
