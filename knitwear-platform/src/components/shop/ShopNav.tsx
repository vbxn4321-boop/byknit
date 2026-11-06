'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ShoppingCart, Package } from 'lucide-react';
import { useShopCartStore } from '@/stores/useShopCartStore';

export function ShopNav({ locale }: { locale: string }) {
    const isKo = locale === 'ko';
    const items = useShopCartStore(state => state.items);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const count = mounted ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;

    return (
        <div className="flex items-center gap-2 shrink-0">
            <Link
                href="/shop/orders"
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium text-brown-600 hover:bg-cream-100 transition-colors"
            >
                <Package className="w-4 h-4" />
                {isKo ? '주문내역' : 'Orders'}
            </Link>
            <Link
                href="/shop/cart"
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium text-brown-600 hover:bg-cream-100 transition-colors"
            >
                <ShoppingCart className="w-4 h-4" />
                {isKo ? '장바구니' : 'Cart'}
                {count > 0 && (
                    <span className="min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center">
                        {count}
                    </span>
                )}
            </Link>
        </div>
    );
}
