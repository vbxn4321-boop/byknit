// 서버 전용: 유료 도안 결제 확정/환불과 판매자 정산. 클라이언트 콜백과 웹훅이 함께 사용한다.
// 'use server' 파일이 아니므로 브라우저에서 직접 호출할 수 없다.
import { createAdminClient } from '@/utils/supabase/server';
import type { PortonePayment } from '@/utils/portone';

export interface PurchaseResult {
    ok: boolean;
    code: string;
    message?: string;
    /** true면 일시적 오류이므로 웹훅이 재시도해야 한다 */
    retryable?: boolean;
}

const fail = (code: string, message: string, retryable = false): PurchaseResult =>
    ({ ok: false, code, message, retryable });

const UNIQUE_VIOLATION = '23505';

export async function creditSellerSettlement(
    sellerId: string,
    amountKrw: number,
    orderId: string,
    description: string,
) {
    if (amountKrw <= 0) return;
    const supabase = await createAdminClient();
    const { error } = await supabase
        .from('settlement_transactions')
        .insert({ seller_id: sellerId, order_id: orderId, amount: amountKrw, type: 'sale', description });
    if (error) throw new Error(`Failed to credit seller settlement: ${error.message}`);
}

/**
 * 결제를 검증하고 도안 주문을 기록한다. 같은 결제로 여러 번 호출해도 한 번만 반영된다.
 * @param expected 지정하면 이 사용자/도안을 위한 결제인지까지 확인한다
 */
export async function recordPatternPurchase(
    payment: PortonePayment,
    expected?: { userId: string; patternId: string },
): Promise<PurchaseResult> {
    if (payment.status !== 'PAID') return fail('not_paid', '결제가 완료되지 않았습니다.');

    const userId = payment.customData?.user_id;
    const patternId = payment.customData?.pattern_id;
    if (typeof userId !== 'string' || typeof patternId !== 'string') {
        return fail('payment_not_for_pattern', '도안 결제 정보가 없습니다.');
    }
    if (expected && (expected.userId !== userId || expected.patternId !== patternId)) {
        return fail('payment_not_for_pattern', '이 도안의 결제가 아닙니다.');
    }

    const supabase = await createAdminClient();

    const { data: existing } = await supabase
        .from('orders')
        .select('status, user_id, pattern_id')
        .eq('transaction_id', payment.id)
        .limit(1)
        .maybeSingle();
    if (existing) {
        const sameOrder = existing.status === 'paid' && existing.user_id === userId && existing.pattern_id === patternId;
        return sameOrder ? { ok: true, code: 'already_recorded' } : fail('payment_reused', '이미 처리된 결제입니다.');
    }

    const { data: pattern, error: patternError } = await supabase
        .from('patterns')
        .select('designer_id, title, price_usd, price_krw')
        .eq('id', patternId)
        .single();
    if (patternError || !pattern) return fail('pattern_not_found', '도안을 찾을 수 없습니다.');

    const priceUsd = pattern.price_usd || 0;
    const expectedAmount = pattern.price_krw || Math.round(priceUsd * 1450);
    if (payment.amount !== expectedAmount) {
        return fail('amount_mismatch', '결제 금액이 도안 가격과 일치하지 않습니다.');
    }

    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            user_id: userId,
            pattern_id: patternId,
            seller_id: pattern.designer_id,
            amount: expectedAmount,
            amount_usd: priceUsd,
            currency: 'KRW',
            status: 'paid',
            payment_provider: 'portone',
            transaction_id: payment.id,
        })
        .select('id')
        .single();
    if (orderError) {
        // 콜백과 웹훅이 동시에 들어온 경우 먼저 들어온 쪽이 처리한다
        if (orderError.code === UNIQUE_VIOLATION) return { ok: true, code: 'already_recorded' };
        console.error('Failed to record pattern order:', orderError.message);
        return fail('order_failed', '주문 기록에 실패했습니다.', true);
    }

    if (pattern.designer_id && pattern.designer_id !== userId) {
        const title = pattern.title as { ko?: string; en?: string } | null;
        try {
            await creditSellerSettlement(pattern.designer_id, expectedAmount, order.id, `도안 판매 정산: ${title?.ko || title?.en || 'Pattern'}`);
        } catch (settlementError) {
            console.error('Failed to settle seller proceeds:', settlementError);
        }

        const { error: notificationError } = await supabase.from('notifications').insert({
            user_id: pattern.designer_id,
            sender_id: userId,
            type: 'purchase',
            reference_id: order.id,
            message: JSON.stringify({ key: 'purchase', params: { title: title?.en || 'your pattern', price: priceUsd } }),
            read: false,
        });
        if (notificationError) console.warn('Failed to notify seller:', notificationError.message);
    }

    return { ok: true, code: 'recorded' };
}

/** 취소된 도안 결제를 주문에 반영하고 판매자 정산을 되돌린다. 여러 번 호출해도 한 번만 반영된다. */
export async function refundPatternPurchase(paymentId: string): Promise<PurchaseResult> {
    const supabase = await createAdminClient();
    const { data: order, error } = await supabase
        .from('orders')
        .update({ status: 'refunded' })
        .eq('transaction_id', paymentId)
        .eq('status', 'paid')
        .select('id, user_id, seller_id, amount')
        .maybeSingle();
    if (error) {
        console.error('Failed to mark order refunded:', error.message);
        return fail('refund_failed', '환불 처리에 실패했습니다.', true);
    }
    if (!order) return { ok: true, code: 'already_refunded' };

    if (order.seller_id && order.seller_id !== order.user_id && order.amount > 0) {
        const { error: settlementError } = await supabase.from('settlement_transactions').insert({
            seller_id: order.seller_id,
            order_id: order.id,
            amount: -order.amount,
            type: 'adjustment',
            description: `도안 환불 정산 차감 (${paymentId})`,
        });
        if (settlementError) console.error('Failed to reverse seller settlement:', settlementError.message);
    }

    return { ok: true, code: 'refunded' };
}
