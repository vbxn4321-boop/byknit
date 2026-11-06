'use client';

import { useState } from 'react';
import { ShopProductsAdmin } from '@/components/shop/admin/ShopProductsAdmin';
import { ShopOrdersAdmin } from '@/components/shop/admin/ShopOrdersAdmin';

export default function AdminShopPage() {
    const [tab, setTab] = useState<'products' | 'orders'>('products');

    const tabClass = (active: boolean) =>
        `px-4 py-2 rounded-xl text-sm font-bold transition-colors ${active ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'}`;

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto">
            <h1 className="text-2xl font-black text-stone-900 mb-6">뜨개 샵 관리</h1>
            <div className="flex gap-2 mb-6">
                <button type="button" onClick={() => setTab('products')} className={tabClass(tab === 'products')}>상품 관리</button>
                <button type="button" onClick={() => setTab('orders')} className={tabClass(tab === 'orders')}>주문 관리</button>
            </div>
            {tab === 'products' ? <ShopProductsAdmin /> : <ShopOrdersAdmin />}
        </div>
    );
}
