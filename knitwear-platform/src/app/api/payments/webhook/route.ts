import { NextRequest, NextResponse } from 'next/server';
import { fetchPortonePayment } from '@/utils/portone';
import { recordPatternPurchase, refundPatternPurchase } from '@/utils/patternPurchase';
import { settleShopCancellation, settleShopPayment, shopOrderIdFromCustomData } from '@/utils/shopPayment';

interface SettleResult {
    ok: boolean;
    code: string;
    message?: string;
    retryable?: boolean;
}

function toResponse(result: SettleResult) {
    if (result.retryable) {
        return NextResponse.json({ error: result.message }, { status: 500 });
    }
    return NextResponse.json({ status: result.ok ? 'success' : 'ignored', code: result.code });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const paymentId = body.imp_uid;
        if (typeof paymentId !== 'string' || !paymentId) {
            return NextResponse.json({ error: 'Missing imp_uid' }, { status: 400 });
        }

        // 웹훅 본문은 위조될 수 있으므로 결제 상태는 포트원에서 직접 조회한 값만 믿는다
        const payment = await fetchPortonePayment(paymentId);
        if (!payment) {
            return NextResponse.json({ error: 'Failed to verify payment with PortOne' }, { status: 500 });
        }

        const isShopOrder = !!shopOrderIdFromCustomData(payment.customData);
        const isPatternOrder = typeof payment.customData?.pattern_id === 'string';

        if (payment.status === 'PAID') {
            if (isShopOrder) return toResponse(await settleShopPayment(paymentId));
            if (isPatternOrder) return toResponse(await recordPatternPurchase(payment));
        }

        if (payment.status === 'CANCELLED') {
            if (isShopOrder) return toResponse(await settleShopCancellation(paymentId));
            if (isPatternOrder) return toResponse(await refundPatternPurchase(paymentId));
        }

        return NextResponse.json({ status: 'ignored' });
    } catch (err) {
        console.error('[Webhook] Server error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
