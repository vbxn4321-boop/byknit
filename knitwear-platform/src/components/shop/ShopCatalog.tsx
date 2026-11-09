'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Store } from 'lucide-react';
import { SHOP_CATEGORIES, shopCategoryLabel } from '@/constants/shop';
import type { ShopProduct } from '@/types/shop';
import { ShopNav } from './ShopNav';

export function ShopCatalog({ products, locale, children }: { products: ShopProduct[]; locale: string; children?: ReactNode }) {
    const isKo = locale === 'ko';
    const [category, setCategory] = useState('all');

    // 상품이 있는 카테고리만 탭으로 보여준다
    const categories = useMemo(
        () => SHOP_CATEGORIES.filter(c => products.some(p => p.category === c.id)),
        [products],
    );
    const visible = category === 'all' ? products : products.filter(p => p.category === category);

    const tabClass = (active: boolean) =>
        `px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${active ? 'bg-brown-700 text-white' : 'bg-white text-brown-600 border border-tan-200 hover:bg-cream-100'}`;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-brown-700">{isKo ? '뜨개 샵' : 'Knitting Shop'}</h1>
                    <p className="text-sm text-brown-500 mt-1">
                        {isKo ? '뜨개질에 필요한 도구를 만나보세요.' : 'Tools for your knitting projects.'}
                    </p>
                </div>
                <ShopNav locale={locale} />
            </div>

            {categories.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
                    <button type="button" onClick={() => setCategory('all')} className={tabClass(category === 'all')}>
                        {isKo ? '전체' : 'All'}
                    </button>
                    {categories.map(c => (
                        <button key={c.id} type="button" onClick={() => setCategory(c.id)} className={tabClass(category === c.id)}>
                            {isKo ? c.ko : c.en}
                        </button>
                    ))}
                </div>
            )}

            {visible.length === 0 ? (
                !children && (
                    <div className="py-24 text-center text-brown-500">
                        <Store className="w-10 h-10 mx-auto mb-3 text-tan-300" />
                        <p>{isKo ? '상품을 준비하고 있어요.' : 'Products are coming soon.'}</p>
                    </div>
                )
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {visible.map(product => (
                        <Link key={product.id} href={`/shop/${product.id}`} className="group block">
                            <div className="relative aspect-square rounded-2xl overflow-hidden bg-cream-100 border border-tan-100">
                                {product.images[0] && (
                                    <Image
                                        src={product.images[0]}
                                        alt={product.name}
                                        fill
                                        sizes="(max-width: 768px) 50vw, 25vw"
                                        className={`object-cover group-hover:scale-105 transition-transform duration-300 ${product.stock === 0 ? 'opacity-50' : ''}`}
                                    />
                                )}
                                {product.stock === 0 && (
                                    <span className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-stone-800 text-white text-xs font-bold">
                                        {isKo ? '품절' : 'Sold out'}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-brown-500 mt-3">{shopCategoryLabel(product.category, locale)}</p>
                            <h2 className="text-sm font-medium text-brown-700 mt-0.5 line-clamp-2">{product.name}</h2>
                            <p className="text-base font-bold text-brown-700 mt-1">₩{product.price_krw.toLocaleString()}</p>
                        </Link>
                    ))}
                </div>
            )}

            {children}
        </div>
    );
}
