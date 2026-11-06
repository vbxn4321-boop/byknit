'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    adminListShopOrders,
    adminMarkDelivered,
    adminMarkPreparing,
    adminMarkShipped,
    adminRefundShopOrder,
} from '@/app/actions/shopAdmin';
import { SHOP_ORDER_STATUS } from '@/constants/shop';
import type { ShopOrder } from '@/types/shop';

const FILTERS = ['all', 'refund_required', 'paid', 'preparing', 'shipped', 'delivered', 'refunded', 'cancelled'];
const REFUNDABLE = ['paid', 'preparing', 'shipped', 'delivered', 'refund_required'];

const dateFormat = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Seoul' });

export function ShopOrdersAdmin() {
    const [orders, setOrders] = useState<ShopOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState<string | null>(null);
    const [tracking, setTracking] = useState<Record<string, { courier: string; number: string }>>({});

    const load = useCallback(async () => {
        const result = await adminListShopOrders();
        setOrders(result.orders);
        setError(result.error ?? '');
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const run = async (orderId: string, action: () => Promise<{ error?: string }>) => {
        setBusyId(orderId);
        setError('');
        const result = await action();
        if (result.error) {
            setError(result.error);
        } else {
            await load();
        }
        setBusyId(null);
    };

    const handleRefund = (order: ShopOrder) => {
        const reason = window.prompt(`${order.order_no} 주문의 ₩${order.total_amount.toLocaleString()}을 전액 환불합니다.\n환불 사유를 입력해 주세요.`);
        if (reason === null) return;
        run(order.id, () => adminRefundShopOrder(order.id, reason));
    };

    const visible = filter === 'all' ? orders : orders.filter(o => o.status === filter);
    const buttonClass = 'px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-50';
    const inputClass = 'px-3 py-2 rounded-lg border border-stone-200 text-xs text-stone-800 w-32 focus:outline-none focus:ring-2 focus:ring-rose-200';

    return (
        <div>
            <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
                {FILTERS.map(id => {
                    const count = id === 'all' ? orders.length : orders.filter(o => o.status === id).length;
                    return (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setFilter(id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${filter === id ? 'bg-rose-50 text-rose-700' : 'bg-white text-stone-500 border border-stone-200'}`}
                        >
                            {id === 'all' ? '전체' : SHOP_ORDER_STATUS[id].ko} {count}
                        </button>
                    );
                })}
            </div>

            {error && <p role="alert" className="mb-4 p-3 rounded-xl bg-rose-50 text-sm text-rose-600">{error}</p>}

            {loading ? (
                <p className="py-16 text-center text-sm text-stone-400">불러오는 중...</p>
            ) : visible.length === 0 ? (
                <p className="py-16 text-center text-sm text-stone-400 bg-white rounded-2xl border border-stone-200">해당하는 주문이 없습니다.</p>
            ) : (
                <div className="space-y-3">
                    {visible.map(order => {
                        const status = SHOP_ORDER_STATUS[order.status];
                        const busy = busyId === order.id;
                        const input = tracking[order.id] ?? { courier: order.courier ?? '', number: order.tracking_number ?? '' };
                        const canShip = ['paid', 'preparing', 'shipped'].includes(order.status);
                        const setInput = (next: Partial<typeof input>) =>
                            setTracking(prev => ({ ...prev, [order.id]: { ...input, ...next } }));

                        return (
                            <article key={order.id} className="bg-white rounded-2xl border border-stone-200 p-5">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${status?.className ?? ''}`}>{status?.ko ?? order.status}</span>
                                        <span className="text-sm font-bold text-stone-800">{order.order_no}</span>
                                    </div>
                                    <span className="text-xs text-stone-500">{dateFormat.format(new Date(order.created_at))}</span>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    <ul className="space-y-1 text-stone-700">
                                        {order.shop_order_items.map(item => (
                                            <li key={item.id}>{item.product_name} × {item.quantity}</li>
                                        ))}
                                        <li className="pt-1 font-bold text-stone-900">
                                            ₩{order.total_amount.toLocaleString()}
                                            <span className="font-normal text-xs text-stone-500"> (배송비 ₩{order.shipping_fee.toLocaleString()} 포함)</span>
                                        </li>
                                    </ul>
                                    <div className="text-stone-600 space-y-0.5">
                                        <p className="font-medium text-stone-800">{order.recipient_name} · {order.recipient_phone}</p>
                                        <p>({order.postcode}) {order.address} {order.address_detail}</p>
                                        {order.delivery_memo && <p className="text-stone-500">메모: {order.delivery_memo}</p>}
                                        {order.cancel_reason && <p className="text-rose-500">사유: {order.cancel_reason}</p>}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-end gap-2 mt-4 pt-4 border-t border-stone-100">
                                    {order.status === 'paid' && (
                                        <button type="button" disabled={busy} onClick={() => run(order.id, () => adminMarkPreparing(order.id))} className={`${buttonClass} bg-amber-50 text-amber-700`}>
                                            배송 준비중으로 변경
                                        </button>
                                    )}
                                    {canShip && (
                                        <>
                                            <input aria-label="택배사" placeholder="택배사" value={input.courier} onChange={e => setInput({ courier: e.target.value })} className={inputClass} />
                                            <input aria-label="송장번호" placeholder="송장번호" value={input.number} onChange={e => setInput({ number: e.target.value })} className={inputClass} />
                                            <button type="button" disabled={busy} onClick={() => run(order.id, () => adminMarkShipped(order.id, input.courier, input.number))} className={`${buttonClass} bg-indigo-50 text-indigo-700`}>
                                                {order.status === 'shipped' ? '송장 수정' : '발송 처리'}
                                            </button>
                                        </>
                                    )}
                                    {order.status === 'shipped' && (
                                        <button type="button" disabled={busy} onClick={() => run(order.id, () => adminMarkDelivered(order.id))} className={`${buttonClass} bg-emerald-50 text-emerald-700`}>
                                            배송 완료
                                        </button>
                                    )}
                                    {REFUNDABLE.includes(order.status) && (
                                        <button type="button" disabled={busy} onClick={() => handleRefund(order)} className={`${buttonClass} bg-rose-50 text-rose-600`}>
                                            환불
                                        </button>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
