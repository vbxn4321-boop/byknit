'use client';

import { Heart, ShoppingCart, Share2 } from 'lucide-react';

interface StickyActionFooterProps {
    price: number;
    currency: string;
    isLiked: boolean;
    onLike: () => void;
    onCart: () => void;
    onShare: () => void;
    onBuy: () => void;
    canDownload: boolean;
    locale: string;
}

export function StickyActionFooter({
    price,
    currency,
    isLiked,
    onLike,
    onCart,
    onShare,
    onBuy,
    canDownload,
    locale
}: StickyActionFooterProps) {
    return (
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-tan-200 p-4 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
            <div className="max-w-2xl mx-auto flex items-center gap-3">
                {/* Like Button */}
                <button
                    onClick={onLike}
                    className="p-3 rounded-2xl bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-colors flex-shrink-0"
                >
                    <Heart
                        size={24}
                        className={`transition-colors ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-rose-400'}`}
                    />
                </button>

                {/* Cart Button (Only for paid items that aren't owned) */}
                {!canDownload && price > 0 && (
                    <button
                        onClick={onCart}
                        className="p-3 rounded-2xl bg-tan-50 border border-tan-200 hover:bg-tan-100 transition-colors flex-shrink-0"
                    >
                        <ShoppingCart size={24} className="text-brown-600" />
                    </button>
                )}

                {/* Share Button */}
                <button
                    onClick={onShare}
                    className="p-3 rounded-2xl bg-tan-50 border border-tan-200 hover:bg-tan-100 transition-colors flex-shrink-0"
                >
                    <Share2 size={24} className="text-brown-600" />
                </button>

                {/* Main Action Button */}
                <button
                    onClick={onBuy}
                    className="flex-1 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-orange-200 transform active:scale-95 transition-all text-lg"
                >
                    {canDownload ? (
                        locale === 'ko' ? '도안 다운로드' : 'Download Pattern'
                    ) : (
                        price === 0 ? (
                            locale === 'ko' ? '무료 다운로드' : 'Free Download'
                        ) : (
                            locale === 'ko' ? '구매하기' : 'Buy Now'
                        )
                    )}
                </button>
            </div>
        </div>
    );
}
