'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import { Package } from 'lucide-react';
import { confirmShopPayment } from '@/app/actions/shop';
import { SHOP_ORDER_STATUS } from '@/constants/shop';
import { useShopCartStore } from '@/stores/useShopCartStore';
import type { ShopOrder } from '@/types/shop';

export function ShopOrderList({ orders, locale }: { orders: ShopOrder[]; locale: string }) {
    const isKo = locale === 'ko';
    const router = useRouter();
    const searchParams = useSearchParams();
    const clearCart = useShopCartStore(state => state.clear);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
        searchParams.get('paid') === '1'
            ? { type: 'success', text: isKo ? '주문이 완료되었습니다.' : 'Your order has been placed.' }
            : null,
    );
    const handledRedirect = useRef(false);

    // 모바일 결제는 콜백 없이 m_redirect_url 로 돌아오므로 여기서 결제를 확정한다
    useEffect(() => {
        const orderId = searchParams.get('order');
        if (!orderId || handledRedirect.current) return;
        handledRedirect.current = true;

        const impUid = searchParams.get('imp_uid');
        if (searchParams.get('imp_success') !== 'true' || !impUid) {
            setMessage({
                type: 'error',
                text: searchParams.get('error_msg') || (isKo ? '결제가 완료되지 않았습니다.' : 'Payment was not completed.'),
            });
            router.replace('/shop/orders');
            return;
        }

        confirmShopPayment(orderId, impUid).then(result => {
            if (result.success) {
                clearCart();
                setMessage({ type: 'success', text: isKo ? '주문이 완료되었습니다.' : 'Your order has been placed.' });
            } else {
                setMessage({ type: 'error', text: result.error || (isKo ? '결제 확인에 실패했습니다.' : 'Payment verification failed.') });
            }
            router.replace('/shop/orders');
            router.refresh();
        });
    }, [searchParams, clearCart, isKo, router]);

    const dateFormat = new Intl.DateTimeFormat(isKo ? 'ko-KR' : 'en-US', { dateStyle: 'medium', timeZone: 'Asia/Seoul' });

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between gap-3 mb-6">
                <h1 className="text-2xl font-bold text-brown-700">{isKo ? '주문내역' : 'My Orders'}</h1>
                <Link href="/shop" className="text-sm text-brown-600 hover:text-rose-500">
                    {isKo ? '샵으로 돌아가기' : 'Back to shop'}
                </Link>
            </div>

            {message && (
                <p
                    role={message.type === 'error' ? 'alert' : 'status'}
                    className={`mb-4 p-4 rounded-2xl text-sm font-medium ${message.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}
                >
                    {message.text}
                </p>
            )}

            {orders.length === 0 ? (
                <div className="py-24 text-center text-brown-500">
                    <Package className="w-10 h-10 mx-auto mb-3 text-tan-300" />
                    <p>{isKo ? '주문 내역이 없어요.' : 'No orders yet.'}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => {
                        const status = SHOP_ORDER_STATUS[order.status];
                        return (
                            <article key={order.id} className="p-5 rounded-2xl bg-white border border-tan-100">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                                    <div>
                                        <p className="text-sm font-medium text-brown-700">{dateFormat.format(new Date(order.created_at))}</p>
                                        <p className="text-xs text-brown-500">{order.order_no}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${status?.className ?? ''}`}>
                                        {status ? (isKo ? status.ko : status.en) : order.status}
                                    </span>
                                </div>

                                <ul className="space-y-3">
                                    {order.shop_order_items.map(item => (
                                        <li key={item.id} className="flex items-center gap-3">
                                            <div className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-cream-100">
                                                {item.product_image && <Image src={item.product_image} alt="" fill sizes="56px" className="object-cover" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-brown-700 truncate">{item.product_name}</p>
                                                <p className="text-xs text-brown-500">
                                                    ₩{item.unit_price.toLocaleString()} × {item.quantity}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-4 pt-4 border-t border-tan-100 text-sm text-brown-600 space-y-1">
                                    <p>{order.recipient_name} · {order.address} {order.address_detail}</p>
                                    {order.tracking_number && (
                                        <p>{isKo ? '송장' : 'Tracking'}: {order.courier} {order.tracking_number}</p>
                                    )}
                                    {order.cancel_reason && (
                                        <p>{isKo ? '취소 사유' : 'Reason'}: {order.cancel_reason}</p>
                                    )}
                                    <p className="font-bold text-brown-700 text-right">₩{order.total_amount.toLocaleString()}</p>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
