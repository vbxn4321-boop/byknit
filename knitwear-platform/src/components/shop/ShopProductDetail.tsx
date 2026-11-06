'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Link, useRouter } from '@/i18n/navigation';
import { ChevronLeft, Minus, Plus } from 'lucide-react';
import { calcShippingFee, SHOP_FREE_SHIPPING_OVER, SHOP_MAX_QUANTITY, SHOP_SHIPPING_FEE, shopCategoryLabel } from '@/constants/shop';
import { useShopCartStore } from '@/stores/useShopCartStore';
import type { ShopProduct } from '@/types/shop';
import { ShopNav } from './ShopNav';

export function ShopProductDetail({ product, locale }: { product: ShopProduct; locale: string }) {
    const isKo = locale === 'ko';
    const router = useRouter();
    const addItem = useShopCartStore(state => state.addItem);
    const [imageIndex, setImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);

    const soldOut = product.stock === 0;
    const maxQuantity = Math.min(product.stock, SHOP_MAX_QUANTITY);
    const itemsAmount = product.price_krw * quantity;

    const handleAdd = () => {
        addItem(product.id, quantity);
        setAdded(true);
    };

    const handleBuyNow = () => {
        addItem(product.id, quantity);
        router.push('/shop/cart');
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between gap-3 mb-6">
                <Link href="/shop" className="flex items-center gap-1 text-sm text-brown-600 hover:text-rose-500">
                    <ChevronLeft className="w-4 h-4" />
                    {isKo ? '샵으로 돌아가기' : 'Back to shop'}
                </Link>
                <ShopNav locale={locale} />
            </div>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                <div>
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-cream-100 border border-tan-100">
                        {product.images[imageIndex] && (
                            <Image
                                src={product.images[imageIndex]}
                                alt={product.name}
                                fill
                                priority
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover"
                            />
                        )}
                    </div>
                    {product.images.length > 1 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto">
                            {product.images.map((src, index) => (
                                <button
                                    key={src}
                                    type="button"
                                    onClick={() => setImageIndex(index)}
                                    aria-label={`${product.name} ${index + 1}`}
                                    className={`relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 ${index === imageIndex ? 'border-rose-400' : 'border-transparent'}`}
                                >
                                    <Image src={src} alt="" fill sizes="64px" className="object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <p className="text-sm text-brown-500">{shopCategoryLabel(product.category, locale)}</p>
                    <h1 className="text-2xl font-bold text-brown-700 mt-1">{product.name}</h1>
                    {product.summary && <p className="text-brown-600 mt-3">{product.summary}</p>}
                    <p className="text-3xl font-bold text-brown-700 mt-5">₩{product.price_krw.toLocaleString()}</p>

                    <div className="mt-5 py-4 border-y border-tan-200 text-sm text-brown-600 space-y-1">
                        <p>
                            {isKo ? '배송비' : 'Shipping'} ₩{SHOP_SHIPPING_FEE.toLocaleString()}
                            {' · '}
                            {isKo
                                ? `₩${SHOP_FREE_SHIPPING_OVER.toLocaleString()} 이상 구매 시 무료`
                                : `Free over ₩${SHOP_FREE_SHIPPING_OVER.toLocaleString()}`}
                        </p>
                        {!soldOut && product.stock <= 5 && (
                            <p className="text-rose-500 font-medium">
                                {isKo ? `남은 수량 ${product.stock}개` : `Only ${product.stock} left`}
                            </p>
                        )}
                    </div>

                    {soldOut ? (
                        <button type="button" disabled className="w-full mt-6 py-4 rounded-2xl bg-stone-200 text-stone-500 font-bold cursor-not-allowed">
                            {isKo ? '품절' : 'Sold out'}
                        </button>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mt-6">
                                <div className="flex items-center border border-tan-200 rounded-xl">
                                    <button
                                        type="button"
                                        aria-label={isKo ? '수량 줄이기' : 'Decrease quantity'}
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        disabled={quantity <= 1}
                                        className="p-3 text-brown-600 disabled:text-stone-300"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-10 text-center font-medium text-brown-700">{quantity}</span>
                                    <button
                                        type="button"
                                        aria-label={isKo ? '수량 늘리기' : 'Increase quantity'}
                                        onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))}
                                        disabled={quantity >= maxQuantity}
                                        className="p-3 text-brown-600 disabled:text-stone-300"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-brown-700">₩{itemsAmount.toLocaleString()}</p>
                                    <p className="text-xs text-brown-500">
                                        {calcShippingFee(itemsAmount) === 0
                                            ? (isKo ? '무료배송' : 'Free shipping')
                                            : (isKo ? `배송비 ₩${calcShippingFee(itemsAmount).toLocaleString()} 별도` : `+ ₩${calcShippingFee(itemsAmount).toLocaleString()} shipping`)}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <button type="button" onClick={handleAdd} className="py-4 rounded-2xl border border-brown-700 text-brown-700 font-bold hover:bg-cream-100 transition-colors">
                                    {isKo ? '장바구니 담기' : 'Add to cart'}
                                </button>
                                <button type="button" onClick={handleBuyNow} className="py-4 rounded-2xl bg-brown-700 text-white font-bold hover:bg-brown-800 transition-colors">
                                    {isKo ? '바로 구매' : 'Buy now'}
                                </button>
                            </div>
                            {added && (
                                <p role="status" className="mt-3 text-sm text-center text-brown-600">
                                    {isKo ? '장바구니에 담았습니다. ' : 'Added to cart. '}
                                    <Link href="/shop/cart" className="underline font-medium">
                                        {isKo ? '장바구니 보기' : 'View cart'}
                                    </Link>
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>

            {product.description && (
                <section className="mt-12 pt-8 border-t border-tan-200">
                    <h2 className="text-lg font-bold text-brown-700 mb-4">{isKo ? '상품 설명' : 'Description'}</h2>
                    {/* 관리자만 작성할 수 있는 내용(adminSaveShopProduct)이다 */}
                    <div
                        className="text-brown-600 leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-bold [&_h1]:mt-6 [&_h2]:mt-6 [&_h3]:mt-4 [&_p]:my-2 [&_a]:text-rose-500 [&_a]:underline [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:border-collapse [&_table]:w-full [&_table]:my-4 [&_th]:border [&_th]:border-tan-200 [&_th]:bg-cream-100 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_td]:border [&_td]:border-tan-200 [&_td]:px-3 [&_td]:py-2 [&_td_p]:m-0 [&_th_p]:m-0 [&_img]:max-w-full [&_iframe]:max-w-full"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                </section>
            )}

            <section className="mt-12 p-6 rounded-2xl bg-cream-50 border border-tan-100 text-sm text-brown-600 leading-relaxed">
                <h2 className="font-bold text-brown-700 mb-2">{isKo ? '배송 및 교환·반품 안내' : 'Shipping & Returns'}</h2>
                {isKo ? (
                    <ul className="list-disc pl-5 space-y-1">
                        <li>국내 배송만 가능합니다. 결제 확인 후 순차적으로 발송됩니다.</li>
                        <li>상품을 받은 날부터 7일 이내에 교환·반품을 신청할 수 있습니다.</li>
                        <li>단순 변심에 의한 반품 배송비는 구매자가 부담합니다. 상품 불량이나 오배송은 판매자가 부담합니다.</li>
                        <li>사용했거나 훼손되어 상품 가치가 떨어진 경우 교환·반품이 어려울 수 있습니다.</li>
                    </ul>
                ) : (
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Domestic (South Korea) shipping only. Orders ship after payment is confirmed.</li>
                        <li>Exchanges and returns can be requested within 7 days of delivery.</li>
                        <li>Buyers cover return shipping for change of mind. The seller covers it for defective or incorrect items.</li>
                        <li>Used or damaged items may not be eligible for return.</li>
                    </ul>
                )}
            </section>
        </div>
    );
}
