'use client';
import { optimizedImageUrl } from '@/utils/imageUrl';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingBag, X, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCartStore } from '@/stores/useCartStore';

interface CartDrawerProps {
    locale: string;
}

export function CartDrawer({ locale }: CartDrawerProps) {
    const isKo = locale === 'ko';
    const { items, isOpen, setIsOpen, removeItem, clearCart, _hasHydrated } = useCartStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !_hasHydrated) return null;
    if (!isOpen) return null;

    const totalPrice = items.reduce((acc, item) => acc + (item.priceKrw || 0), 0);

    const getTitleString = (title: any) => {
        if (typeof title === 'string') return title;
        if (!title) return 'Pattern';
        return isKo ? (title.ko || title.en) : (title.en || title.ko);
    };

    const drawerContent = (
        <div className="fixed inset-0 z-[9999] overflow-hidden animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
                onClick={() => setIsOpen(false)}
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 h-full">
                <div className="w-screen max-w-md h-full bg-white shadow-2xl flex flex-col border-l border-stone-100 relative z-10">
                    {/* Header */}
                    <div className="p-6 bg-stone-50 border-b border-stone-100 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                                <ShoppingBag size={20} />
                            </div>
                            <div>
                                <h2 className="font-extrabold text-stone-800 text-lg">
                                    {isKo ? '장바구니' : 'Shopping Cart'}
                                </h2>
                                <p className="text-xs text-stone-400">
                                    {isKo ? `총 ${items.length}개의 상품` : `${items.length} items`}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                        {items.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-4">
                                    <ShoppingBag size={32} />
                                </div>
                                <h3 className="font-bold text-stone-700 text-base mb-1">
                                    {isKo ? '장바구니가 비어 있습니다' : 'Your cart is empty'}
                                </h3>
                                <p className="text-xs text-stone-400 max-w-xs mb-6">
                                    {isKo
                                        ? '마켓플레이스에서 마음에 드는 도안을 담아보세요!'
                                        : 'Discover and add your favorite patterns from the marketplace!'}
                                </p>
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        window.location.href = `/${locale}/marketplace`;
                                    }}
                                    className="px-5 py-2.5 rounded-full bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition-colors shadow-soft"
                                >
                                    {isKo ? '마켓플레이스 둘러보기' : 'Browse Marketplace'}
                                </button>
                            </div>
                        ) : (
                            items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-4 p-3 bg-stone-50/70 rounded-2xl border border-stone-100 group hover:border-orange-200 transition-all"
                                >
                                    {/* Product Image */}
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-200 shrink-0 relative">
                                        {item.image ? (
                                            <img
                                                src={optimizedImageUrl(item.image, 128)}
                                                alt={getTitleString(item.title)}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs font-bold">
                                                Pattern
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <a
                                            href={`/${locale}/marketplace/${item.id}`}
                                            onClick={() => setIsOpen(false)}
                                            className="font-bold text-stone-800 text-sm truncate block hover:text-orange-600 transition-colors"
                                        >
                                            {getTitleString(item.title)}
                                        </a>
                                        {item.designerName && (
                                            <p className="text-[11px] text-stone-400 truncate">
                                                {item.designerName}
                                            </p>
                                        )}
                                        <p className="font-extrabold text-stone-900 text-sm mt-1">
                                            ₩{item.priceKrw.toLocaleString()}
                                        </p>
                                    </div>

                                    {/* Remove Action */}
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="p-2 text-stone-300 hover:text-rose-500 transition-colors"
                                        title={isKo ? '삭제' : 'Remove'}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer / Summary */}
                    {items.length > 0 && (
                        <div className="p-6 bg-white border-t border-stone-100 shadow-lg space-y-4 shrink-0">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-stone-500">
                                    {isKo ? '총 결제 금액' : 'Total Amount'}
                                </span>
                                <span className="text-2xl font-black text-stone-900">
                                    ₩{totalPrice.toLocaleString()}
                                </span>
                            </div>

                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    if (items[0]) {
                                        window.location.href = `/${locale}/marketplace/${items[0].id}`;
                                    }
                                }}
                                className="w-full py-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-extrabold transition-all text-base flex items-center justify-center gap-2 shadow-md active:scale-[0.98]"
                            >
                                <ShieldCheck size={18} />
                                {isKo ? '상품 확인 및 결제하기' : 'Proceed to Checkout'}
                                <ArrowRight size={18} />
                            </button>

                            <button
                                onClick={clearCart}
                                className="w-full py-2 text-center text-xs text-stone-400 hover:text-stone-600 transition-colors"
                            >
                                {isKo ? '장바구니 비우기' : 'Clear Cart'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(drawerContent, document.body);
}
