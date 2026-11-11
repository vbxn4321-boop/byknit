'use client';
import { isMaintenanceActive, maintenancePaymentMessage } from '@/utils/maintenance';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Link, useRouter } from '@/i18n/navigation';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { confirmShopPayment, createShopOrder, getShopProductsByIds } from '@/app/actions/shop';
import { calcShippingFee, SHOP_MAX_QUANTITY } from '@/constants/shop';
import { useShopCartStore } from '@/stores/useShopCartStore';
import type { ShopProduct, ShopShippingInput } from '@/types/shop';

const EMPTY_SHIPPING: ShopShippingInput = {
    recipientName: '',
    phone: '',
    postcode: '',
    address: '',
    addressDetail: '',
    memo: '',
};

const POSTCODE_SCRIPT = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

function loadPostcodeScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if ((window as any).daum?.Postcode) return resolve();
        const script = document.createElement('script');
        script.src = POSTCODE_SCRIPT;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('postcode script failed'));
        document.body.appendChild(script);
    });
}

interface ShopCheckoutProps {
    locale: string;
    user: { id: string; email: string | null } | null;
}

export function ShopCheckout({ locale, user }: ShopCheckoutProps) {
    const isKo = locale === 'ko';
    const router = useRouter();
    const { items, setQuantity, removeItem, clear } = useShopCartStore();

    const [mounted, setMounted] = useState(false);
    const [products, setProducts] = useState<ShopProduct[] | null>(null);
    const [shipping, setShipping] = useState<ShopShippingInput>(EMPTY_SHIPPING);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setMounted(true);
    }, []);

    // 장바구니에 담긴 상품 목록이 바뀔 때만 최신 가격과 재고를 다시 가져온다
    const idsKey = items.map(i => i.productId).join(',');
    useEffect(() => {
        if (!mounted) return;
        let cancelled = false;
        getShopProductsByIds(idsKey ? idsKey.split(',') : []).then(result => {
            if (!cancelled) setProducts(result);
        });
        return () => {
            cancelled = true;
        };
    }, [idsKey, mounted]);

    const lines = useMemo(
        () => items.flatMap(item => {
            const product = products?.find(p => p.id === item.productId);
            return product ? [{ product, quantity: item.quantity }] : [];
        }),
        [items, products],
    );

    const unavailableIds = products ? items.filter(i => !products.some(p => p.id === i.productId)).map(i => i.productId) : [];
    const hasStockProblem = lines.some(l => l.quantity > l.product.stock);
    const itemsAmount = lines.reduce((sum, l) => sum + l.product.price_krw * l.quantity, 0);
    const shippingFee = calcShippingFee(itemsAmount);
    const total = itemsAmount + shippingFee;

    const updateShipping = (field: keyof ShopShippingInput, value: string) => {
        setShipping(prev => ({ ...prev, [field]: value }));
    };

    const openPostcode = async () => {
        try {
            await loadPostcodeScript();
            new (window as any).daum.Postcode({
                oncomplete: (data: any) => {
                    setShipping(prev => ({
                        ...prev,
                        postcode: data.zonecode,
                        address: data.roadAddress || data.jibunAddress,
                    }));
                },
            }).open();
        } catch {
            setError(isKo ? '주소 검색을 불러오지 못했습니다. 직접 입력해 주세요.' : 'Address search failed to load. Please type your address.');
        }
    };

    const handlePay = async () => {
        setError('');
        if (isMaintenanceActive()) {
            setError(maintenancePaymentMessage(isKo));
            return;
        }
        const IMP = (window as any).IMP;
        if (!IMP) {
            setError(isKo ? '결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.' : 'Loading payment module. Please try again in a moment.');
            return;
        }

        setProcessing(true);
        const order = await createShopOrder(
            lines.map(l => ({ productId: l.product.id, quantity: l.quantity })),
            shipping,
        );
        if (order.error || !order.orderId) {
            setError(order.error || (isKo ? '주문을 만들지 못했습니다.' : 'Could not create the order.'));
            setProcessing(false);
            return;
        }

        const orderId = order.orderId;
        IMP.init('imp55247668');
        IMP.request_pay({
            pg: 'html5_inicis',
            pay_method: 'card',
            merchant_uid: order.orderNo,
            name: order.orderName,
            amount: order.amount,
            buyer_email: user?.email || '',
            buyer_name: shipping.recipientName,
            buyer_tel: shipping.phone,
            buyer_addr: `${shipping.address} ${shipping.addressDetail || ''}`.trim(),
            buyer_postcode: shipping.postcode,
            // 모바일은 결제 후 이 주소로 돌아오며, 주문내역 화면이 결제를 확정한다
            m_redirect_url: `${window.location.origin}/${locale}/shop/orders?order=${orderId}`,
            notice_url: `${window.location.origin}/api/payments/webhook`,
            custom_data: { user_id: user?.id, shop_order_id: orderId },
        }, async (response: any) => {
            if (!response.success) {
                setError(response.error_msg || (isKo ? '결제에 실패했습니다.' : 'Payment failed.'));
                setProcessing(false);
                return;
            }
            const result = await confirmShopPayment(orderId, response.imp_uid);
            if (result.success) {
                clear();
                router.push('/shop/orders?paid=1');
            } else {
                setError(result.error || (isKo ? '결제 확인에 실패했습니다.' : 'Payment verification failed.'));
                setProcessing(false);
                // 재고 부족 등으로 자동 환불되었을 수 있으니 최신 재고를 다시 보여준다
                getShopProductsByIds(items.map(i => i.productId)).then(setProducts);
            }
        });
    };

    if (!mounted || (items.length > 0 && products === null)) {
        return <div className="py-32 text-center text-brown-500">{isKo ? '불러오는 중...' : 'Loading...'}</div>;
    }

    if (items.length === 0) {
        return (
            <div className="max-w-md mx-auto py-32 px-4 text-center">
                <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-tan-300" />
                <p className="text-brown-600 mb-6">{isKo ? '장바구니가 비어 있어요.' : 'Your cart is empty.'}</p>
                <Link href="/shop" className="inline-block px-6 py-3 rounded-2xl bg-brown-700 text-white font-bold">
                    {isKo ? '샵 둘러보기' : 'Browse the shop'}
                </Link>
            </div>
        );
    }

    const inputClass = 'w-full px-4 py-3 rounded-xl border border-tan-200 text-sm text-brown-700 focus:outline-none focus:ring-2 focus:ring-rose-200';
    const canPay = lines.length > 0 && !hasStockProblem && unavailableIds.length === 0 && !processing;

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-brown-700 mb-6">{isKo ? '장바구니 · 주문' : 'Cart & Checkout'}</h1>

            <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
                <div className="space-y-8">
                    <section className="space-y-3">
                        {lines.map(({ product, quantity }) => {
                            const overStock = quantity > product.stock;
                            return (
                                <div key={product.id} className="flex gap-4 p-4 rounded-2xl bg-white border border-tan-100">
                                    <Link href={`/shop/${product.id}`} className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-cream-100">
                                        {product.images[0] && <Image src={product.images[0]} alt={product.name} fill sizes="80px" className="object-cover" />}
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between gap-2">
                                            <Link href={`/shop/${product.id}`} className="text-sm font-medium text-brown-700 line-clamp-2">{product.name}</Link>
                                            <button
                                                type="button"
                                                aria-label={isKo ? '삭제' : 'Remove'}
                                                onClick={() => removeItem(product.id)}
                                                className="text-stone-400 hover:text-rose-500 shrink-0"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between mt-3">
                                            <div className="flex items-center border border-tan-200 rounded-lg">
                                                <button
                                                    type="button"
                                                    aria-label={isKo ? '수량 줄이기' : 'Decrease quantity'}
                                                    onClick={() => setQuantity(product.id, quantity - 1)}
                                                    disabled={quantity <= 1}
                                                    className="p-1.5 text-brown-600 disabled:text-stone-300"
                                                >
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="w-8 text-center text-sm text-brown-700">{quantity}</span>
                                                <button
                                                    type="button"
                                                    aria-label={isKo ? '수량 늘리기' : 'Increase quantity'}
                                                    onClick={() => setQuantity(product.id, quantity + 1)}
                                                    disabled={quantity >= Math.min(product.stock, SHOP_MAX_QUANTITY)}
                                                    className="p-1.5 text-brown-600 disabled:text-stone-300"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <p className="font-bold text-brown-700">₩{(product.price_krw * quantity).toLocaleString()}</p>
                                        </div>
                                        {overStock && (
                                            <p className="mt-2 text-xs font-medium text-rose-500">
                                                {product.stock === 0
                                                    ? (isKo ? '품절되었습니다. 삭제해 주세요.' : 'Sold out. Please remove this item.')
                                                    : (isKo ? `남은 수량은 ${product.stock}개입니다. 수량을 줄여 주세요.` : `Only ${product.stock} left. Please reduce the quantity.`)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {unavailableIds.length > 0 && (
                            <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-rose-50 text-sm text-rose-600">
                                <span>{isKo ? `판매가 종료된 상품 ${unavailableIds.length}개가 있습니다.` : `${unavailableIds.length} item(s) are no longer available.`}</span>
                                <button type="button" onClick={() => unavailableIds.forEach(removeItem)} className="font-bold underline shrink-0">
                                    {isKo ? '삭제' : 'Remove'}
                                </button>
                            </div>
                        )}
                    </section>

                    {user && (
                        <section>
                            <h2 className="text-lg font-bold text-brown-700 mb-3">{isKo ? '배송지' : 'Shipping address'}</h2>
                            <div className="p-5 rounded-2xl bg-white border border-tan-100 space-y-3">
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <input
                                        aria-label={isKo ? '받는 분' : 'Recipient'}
                                        placeholder={isKo ? '받는 분' : 'Recipient'}
                                        autoComplete="name"
                                        value={shipping.recipientName}
                                        onChange={e => updateShipping('recipientName', e.target.value)}
                                        className={inputClass}
                                    />
                                    <input
                                        aria-label={isKo ? '연락처' : 'Phone'}
                                        placeholder={isKo ? '연락처 (010-0000-0000)' : 'Phone (010-0000-0000)'}
                                        type="tel"
                                        autoComplete="tel"
                                        value={shipping.phone}
                                        onChange={e => updateShipping('phone', e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        aria-label={isKo ? '우편번호' : 'Postal code'}
                                        placeholder={isKo ? '우편번호' : 'Postal code'}
                                        inputMode="numeric"
                                        autoComplete="postal-code"
                                        maxLength={5}
                                        value={shipping.postcode}
                                        onChange={e => updateShipping('postcode', e.target.value)}
                                        className={inputClass}
                                    />
                                    <button
                                        type="button"
                                        onClick={openPostcode}
                                        className="px-4 rounded-xl border border-brown-700 text-brown-700 text-sm font-bold whitespace-nowrap hover:bg-cream-100"
                                    >
                                        {isKo ? '주소 검색' : 'Search'}
                                    </button>
                                </div>
                                <input
                                    aria-label={isKo ? '주소' : 'Address'}
                                    placeholder={isKo ? '주소' : 'Address'}
                                    autoComplete="street-address"
                                    value={shipping.address}
                                    onChange={e => updateShipping('address', e.target.value)}
                                    className={inputClass}
                                />
                                <input
                                    aria-label={isKo ? '상세 주소' : 'Address details'}
                                    placeholder={isKo ? '상세 주소' : 'Address details'}
                                    value={shipping.addressDetail}
                                    onChange={e => updateShipping('addressDetail', e.target.value)}
                                    className={inputClass}
                                />
                                <input
                                    aria-label={isKo ? '배송 메모' : 'Delivery note'}
                                    placeholder={isKo ? '배송 메모 (선택)' : 'Delivery note (optional)'}
                                    value={shipping.memo}
                                    onChange={e => updateShipping('memo', e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                        </section>
                    )}
                </div>

                <aside className="p-5 rounded-2xl bg-white border border-tan-100 lg:sticky lg:top-24">
                    <h2 className="font-bold text-brown-700 mb-4">{isKo ? '결제 금액' : 'Order summary'}</h2>
                    <dl className="space-y-2 text-sm text-brown-600">
                        <div className="flex justify-between">
                            <dt>{isKo ? '상품 금액' : 'Items'}</dt>
                            <dd>₩{itemsAmount.toLocaleString()}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt>{isKo ? '배송비' : 'Shipping'}</dt>
                            <dd>{shippingFee === 0 ? (isKo ? '무료' : 'Free') : `₩${shippingFee.toLocaleString()}`}</dd>
                        </div>
                    </dl>
                    <div className="flex justify-between items-baseline mt-4 pt-4 border-t border-tan-200">
                        <span className="font-bold text-brown-700">{isKo ? '총 결제 금액' : 'Total'}</span>
                        <span className="text-xl font-bold text-brown-700">₩{total.toLocaleString()}</span>
                    </div>

                    {error && <p role="alert" className="mt-4 p-3 rounded-xl bg-rose-50 text-sm text-rose-600">{error}</p>}

                    {user ? (
                        <button
                            type="button"
                            onClick={handlePay}
                            disabled={!canPay}
                            className="w-full mt-4 py-4 rounded-2xl bg-brown-700 text-white font-bold hover:bg-brown-800 transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed"
                        >
                            {processing
                                ? (isKo ? '결제 진행 중...' : 'Processing...')
                                : (isKo ? `₩${total.toLocaleString()} 결제하기` : `Pay ₩${total.toLocaleString()}`)}
                        </button>
                    ) : (
                        <Link href="/login" className="block w-full mt-4 py-4 rounded-2xl bg-brown-700 text-white font-bold text-center">
                            {isKo ? '로그인하고 주문하기' : 'Log in to order'}
                        </Link>
                    )}
                </aside>
            </div>
        </div>
    );
}
