'use client';

import { Pattern } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Heart } from 'lucide-react';

interface ProductRecommendationRowProps {
    title: string;
    products: Pattern[];
    locale: string;
}

export function ProductRecommendationRow({ title, products, locale }: ProductRecommendationRowProps) {
    if (!products || products.length === 0) return null;

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-bold text-lg text-brown-800">{title}</h3>
                <button className="text-brown-400 hover:text-brown-600 transition-colors">
                    <ArrowRight size={20} />
                </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 px-1 no-scrollbar snap-x snap-mandatory">
                {products.map((product) => (
                    <Link
                        href={`/${locale}/marketplace/${product.id}`}
                        key={product.id}
                        className="flex-shrink-0 w-36 snap-start group"
                    >
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-stone-100 mb-2 shadow-sm border border-tan-100 group-hover:shadow-md transition-all">
                            {(product.preview_images?.[0] || product.thumbnail_url) ? (
                                <Image
                                    src={product.preview_images?.[0] || product.thumbnail_url || ''}
                                    alt={typeof product.title === 'string' ? product.title : (product.title?.en || '')}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-tan-50 text-tan-300">
                                    No Image
                                </div>
                            )}
                            {/* Mini Heart Overlay */}
                            <div className="absolute bottom-2 right-2 p-1.5 bg-white/80 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                <Heart size={12} className="text-rose-400" />
                            </div>
                        </div>

                        <h4 className="font-bold text-sm text-brown-800 truncate leading-tight">
                            {typeof product.title === 'string' ? product.title : (locale === 'ko' ? (product.title?.ko || product.title?.en) : (product.title?.en || product.title?.ko))}
                        </h4>
                        <p className="text-xs text-brown-500 truncate mt-0.5">
                            by {product.designer_id ? 'Designer' : 'Unknown'}
                        </p>
                        <p className="font-bold text-sm text-brown-900 mt-1">
                            {product.is_free ? (locale === 'ko' ? '무료' : 'Free') : `${product.price_usd} ${locale === 'ko' ? '크레딧' : 'Credits'}`}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
