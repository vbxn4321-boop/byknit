
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Percent, Settings, Check, X, Loader2 } from 'lucide-react';
import { updateProductSale } from '@/app/actions/seller';

interface SellerProductListProps {
    initialProducts: any[];
    locale: string;
}

export function SellerProductList({ initialProducts, locale }: SellerProductListProps) {
    const t = useTranslations('seller');
    const [products, setProducts] = useState(initialProducts);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [discountValue, setDiscountValue] = useState(0);

    const handleToggleSale = async (product: any) => {
        setLoadingId(product.id);
        const newIsOnSale = !product.is_on_sale;
        try {
            await updateProductSale(product.id, newIsOnSale, product.discount_percentage);
            setProducts(products.map(p => p.id === product.id ? { ...p, is_on_sale: newIsOnSale } : p));
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoadingId(null);
        }
    };

    const handleSaveDiscount = async (productId: string) => {
        setLoadingId(productId);
        try {
            await updateProductSale(productId, true, discountValue);
            setProducts(products.map(p => p.id === productId ? { ...p, is_on_sale: true, discount_percentage: discountValue } : p));
            setEditingId(null);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="divide-y divide-tan-50">
            {products.length === 0 ? (
                <div className="p-12 text-center">
                    <p className="text-brown-400 font-medium">You haven't published any patterns yet.</p>
                </div>
            ) : (
                products.map((product) => (
                    <div key={product.id} className="p-6 flex items-center gap-6 hover:bg-cream-50/20 transition-all group">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-tan-100 flex-shrink-0">
                            {product.thumbnail_url && (
                                <img src={product.thumbnail_url} alt="" className="w-full h-full object-cover" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-brown-800 truncate">{product.title?.ko || product.title?.en}</h3>
                                {product.is_on_sale && (
                                    <span className="text-[10px] px-2 py-0.5 bg-rose-500 text-white rounded-full font-black uppercase">Sale {product.discount_percentage}%</span>
                                )}
                            </div>
                            <p className="text-sm text-brown-400 font-medium">${product.price_usd}</p>
                        </div>

                        {editingId === product.id ? (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={discountValue}
                                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                                    className="w-16 px-2 py-1.5 rounded-xl border border-tan-200 text-center text-sm font-bold text-brown-700"
                                />
                                <span className="text-sm font-bold text-brown-400">%</span>
                                <button
                                    onClick={() => handleSaveDiscount(product.id)}
                                    disabled={loadingId === product.id}
                                    className="p-2 rounded-xl bg-rose-500 text-white hover:bg-rose-600 transition-all"
                                >
                                    {loadingId === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => setEditingId(null)}
                                    className="p-2 rounded-xl bg-tan-100 text-brown-400 hover:bg-brown-200 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                {product.price_usd === 0 ? (
                                    <span className="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-400 text-xs font-bold">
                                        {locale === 'ko' ? '무료 상품은 할인 적용 불가' : 'Free - No discount'}
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setEditingId(product.id);
                                            setDiscountValue(product.discount_percentage || 0);
                                        }}
                                        className={`p-2.5 rounded-xl transition-all border ${product.is_on_sale ? 'bg-rose-50 text-rose-500 border-rose-200' : 'bg-tan-50 text-brown-400 border-tan-100 hover:bg-rose-50 hover:text-rose-500'
                                            }`}
                                        title={t('setDiscount')}
                                    >
                                        <Percent className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}
