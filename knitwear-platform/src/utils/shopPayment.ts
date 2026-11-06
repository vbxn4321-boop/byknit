// 서버 전용: 샵 결제 검증/확정/환불. 클라이언트 콜백(actions/shop)과 웹훅이 함께 사용한다.
// 'use server' 파일이 아니므로 브라우저에서 직접 호출할 수 없다.
import { createAdminClient } from '@/utils/supabase/server';

export interface ShopSettleResult {
    ok: boolean;
    code: string;
    message?: string;
    /** true면 일시적 오류이므로 웹훅이 재시도해야 한다 */
    retryable?: boolean;
}

const fail = (code: string, message: string, retryable = false): ShopSettleResult =>
    ({ ok: false, code, message, retryable });

async function fetchPayment(paymentId: string): Promise<any | null> {
    const secret = process.env.PORTONE_API_SECRET;
    if (!secret) {
        console.error('[Shop] PORTONE_API_SECRET is not configured');
        return null;
    }
    const response = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}`, {
        headers: { Authorization: `PortOne ${secret}`, 'Content-Type': 'application/json' },
        cache: 'no-store',
    });
    if (!response.ok) {
        console.error(`[Shop] PortOne lookup failed: ${response.status} ${await response.text()}`);
        return null;
    }
    return response.json();
}

function parseCustomData(payment: any): any {
    const raw = payment?.customData;
    if (!raw) return null;
    if (typeof raw !== 'string') return raw;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

const paidAmountOf = (payment: any): number => payment?.amount?.total ?? payment?.amount?.paid ?? 0;

/** 결제 데이터에 담긴 샵 주문 ID. 샵 결제가 아니면 null */
export function shopOrderIdFromCustomData(customData: any): string | null {
    return typeof customData?.shop_order_id === 'string' ? customData.shop_order_id : null;
}

/** PortOne에 전액 취소를 요청한다. 이미 취소된 결제도 성공으로 본다. */
export async function cancelPortonePayment(paymentId: string, reason: string): Promise<boolean> {
    const secret = process.env.PORTONE_API_SECRET;
    if (!secret) return false;

    const payment = await fetchPayment(paymentId);
    if (!payment) return false;
    if (payment.status === 'CANCELLED') return true;

    const response = await fetch(`https://api.portone.io/payments/${encodeURIComponent(paymentId)}/cancel`, {
        method: 'POST',
        headers: { Authorization: `PortOne ${secret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, amount: paidAmountOf(payment) }),
    });
    if (!response.ok) {
        console.error(`[Shop] PortOne cancel failed: ${response.status} ${await response.text()}`);
        return false;
    }
    return true;
}

/**
 * 결제를 검증하고 주문을 확정한다. 여러 번 호출해도 한 번만 반영된다.
 * @param expectedOrderId 지정하면 결제가 이 주문을 위한 것인지까지 확인한다
 */
export async function settleShopPayment(paymentId: string, expectedOrderId?: string): Promise<ShopSettleResult> {
    const payment = await fetchPayment(paymentId);
    if (!payment) return fail('lookup_failed', '결제 내역을 조회하지 못했습니다.', true);

    const customData = parseCustomData(payment);
    const orderId = shopOrderIdFromCustomData(customData);

    // 다른 용도의 결제(크레딧 충전 등)를 샵 주문 결제로 재사용하지 못하게 한다
    if (!orderId || (expectedOrderId && orderId !== expectedOrderId)) {
        return fail('payment_not_for_order', '이 주문의 결제가 아닙니다.');
    }
    if (payment.status !== 'PAID') {
        return fail('not_paid', '결제가 완료되지 않았습니다.');
    }

    const supabase = await createAdminClient();
    const { data: result, error } = await supabase.rpc('finalize_shop_order', {
        p_order_id: orderId,
        p_payment_id: paymentId,
        p_paid_amount: paidAmountOf(payment),
    });

    if (error) {
        console.error('[Shop] finalize_shop_order failed:', error.message);
        return fail('finalize_failed', '주문 확정 중 오류가 발생했습니다.', true);
    }

    switch (result) {
        case 'paid':
        case 'already_paid':
            return { ok: true, code: result };
        case 'out_of_stock':
            return refundUnfulfillable(orderId, paymentId, '재고 부족으로 자동 환불', '재고가 부족해 결제를 자동 취소했습니다.');
        case 'amount_mismatch':
            return refundUnfulfillable(orderId, paymentId, '결제 금액 불일치로 자동 환불', '결제 금액이 주문 금액과 달라 결제를 자동 취소했습니다.');
        case 'not_found':
            return fail('order_not_found', '주문을 찾을 수 없습니다.');
        case 'payment_reused':
            return fail('payment_reused', '이미 다른 주문에 사용된 결제입니다.');
        default:
            return fail(String(result), '처리할 수 없는 주문 상태입니다.');
    }
}

async function refundUnfulfillable(
    orderId: string,
    paymentId: string,
    reason: string,
    message: string,
): Promise<ShopSettleResult> {
    const supabase = await createAdminClient();
    const refunded = await cancelPortonePayment(paymentId, reason);

    if (refunded) {
        await supabase
            .from('shop_orders')
            .update({ status: 'cancelled', transaction_id: paymentId, cancel_reason: reason, updated_at: new Date().toISOString() })
            .eq('id', orderId)
            .eq('status', 'pending');
        return fail('auto_refunded', message);
    }

    // 돈은 빠져나갔는데 환불에 실패한 경우: 관리자 주문 목록에 드러나도록 남긴다
    await supabase
        .from('shop_orders')
        .update({ status: 'refund_required', transaction_id: paymentId, cancel_reason: reason, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('status', 'pending');
    return fail('refund_failed', '결제를 자동으로 취소하지 못했습니다. 고객센터로 문의해 주세요.');
}

/** PortOne에서 취소된 결제를 주문에 반영한다 (웹훅, 포트원 콘솔에서 직접 취소한 경우 포함) */
export async function settleShopCancellation(paymentId: string): Promise<ShopSettleResult> {
    const payment = await fetchPayment(paymentId);
    if (!payment) return fail('lookup_failed', '결제 내역을 조회하지 못했습니다.', true);
    if (payment.status !== 'CANCELLED') return fail('not_cancelled', '취소된 결제가 아닙니다.');

    const orderId = shopOrderIdFromCustomData(parseCustomData(payment));
    if (!orderId) return fail('payment_not_for_order', '샵 결제가 아닙니다.');

    const supabase = await createAdminClient();
    const { data: order } = await supabase
        .from('shop_orders')
        .select('id, transaction_id')
        .eq('id', orderId)
        .maybeSingle();

    // 주문에 연결된 결제가 취소된 경우에만 반영한다
    if (!order || order.transaction_id !== paymentId) {
        return { ok: true, code: 'ignored' };
    }

    const { data: result, error } = await supabase.rpc('cancel_shop_order', {
        p_order_id: orderId,
        p_reason: '결제 취소',
    });
    if (error) {
        console.error('[Shop] cancel_shop_order failed:', error.message);
        return fail('cancel_failed', '주문 취소 반영 중 오류가 발생했습니다.', true);
    }
    return { ok: true, code: String(result) };
}
