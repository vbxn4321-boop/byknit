import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
    try {
        // 1. Webhook 바디 파싱
        const body = await request.json();
        console.log('[Webhook] Received PortOne webhook:', JSON.stringify(body, null, 2));

        // 포트원 V1 SDK 결제 시 imp_uid, merchant_uid, status 필드가 전달됩니다.
        const paymentId = body.imp_uid || body.paymentId || body.data?.paymentId;
        const status = body.status || body.data?.status;

        if (!paymentId) {
            console.error('[Webhook] Missing paymentId / imp_uid in webhook body');
            return NextResponse.json({ error: 'Missing paymentId' }, { status: 400 });
        }

        // paid 상태 혹은 Transaction.Paid 이벤트 유형일 때 결제 완료 처리
        const isPaidStatus = 
            status === 'paid' || 
            status === 'PAID' || 
            body.type === 'Transaction.Paid' ||
            body.type === 'paid';

        // cancelled 상태 혹은 Transaction.Cancelled 이벤트 유형일 때 환불 처리
        const isCancelledStatus =
            status === 'cancelled' ||
            status === 'CANCELLED' ||
            body.type === 'Transaction.Cancelled' ||
            body.type === 'cancelled';

        if (!isPaidStatus && !isCancelledStatus) {
            console.log(`[Webhook] Ignored webhook status: ${status || body.type} for paymentId: ${paymentId}`);
            return NextResponse.json({ status: 'ignored', message: 'Not a paid or cancelled event' });
        }

        const supabase = await createAdminClient();

        // -------------------------------------------------------------
        // [CASE 1] 결제 완료 (paid) 처리
        // -------------------------------------------------------------
        if (isPaidStatus) {
            // 결제 중복 처리 방지 확인
            const { data: existingOrder } = await supabase
                .from('orders')
                .select('id, status')
                .eq('transaction_id', paymentId)
                .maybeSingle();

            if (existingOrder && existingOrder.status === 'paid') {
                console.log(`[Webhook] Payment ${paymentId} already processed (order found)`);
                return NextResponse.json({ status: 'ignored', message: 'Payment already processed' });
            }

            // 포트원 V2 REST API를 통해 결제 상세정보 조회 (2차 검증)
            const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET;
            if (!PORTONE_API_SECRET) {
                console.error('[Webhook] PORTONE_API_SECRET is not configured in environment variables');
                return NextResponse.json({ error: 'Webhook configuration error' }, { status: 500 });
            }

            console.log(`[Webhook] Verifying payment details with PortOne API for paymentId: ${paymentId}`);
            const response = await fetch(`https://api.portone.io/payments/${paymentId}`, {
                headers: {
                    'Authorization': `PortOne ${PORTONE_API_SECRET}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`[Webhook] PortOne API payment details fetch failed: Status ${response.status}, Body: ${errText}`);
                return NextResponse.json({ error: 'Failed to verify payment with PortOne' }, { status: 400 });
            }

            const paymentData = await response.json();
            console.log('[Webhook] PortOne payment data fetched:', JSON.stringify(paymentData, null, 2));

            // 결제 상태가 PAID(결제완료)인지 검증
            if (paymentData.status !== 'PAID') {
                console.error(`[Webhook] PortOne payment status is not PAID. Status: ${paymentData.status}`);
                return NextResponse.json({ error: 'Payment is not completed' }, { status: 400 });
            }

            // customData에서 충전 대상 유저 ID와 지급 크레딧 수량 추출
            let customDataObj: any = null;
            try {
                if (paymentData.customData) {
                    customDataObj = typeof paymentData.customData === 'string'
                        ? JSON.parse(paymentData.customData)
                        : paymentData.customData;
                }
            } catch (e: any) {
                console.error('[Webhook] Failed to parse customData:', e.message, paymentData.customData);
            }

            if (!customDataObj || !customDataObj.user_id || !customDataObj.credits) {
                console.error('[Webhook] Missing user_id or credits in custom_data of payment:', JSON.stringify(paymentData.customData));
                return NextResponse.json({ error: 'Missing user_id or credits in custom_data' }, { status: 400 });
            }

            const { user_id: userId, credits: creditAmount } = customDataObj;
            const amountVal = paymentData.amount?.total || paymentData.amount?.paid || 0;

            console.log(`[Webhook] Proceeding to charge. User: ${userId}, Credits: ${creditAmount}, Amount: ${amountVal}`);

            // 어드민 클라이언트로 DB 반영 (RLS 우회)
            const { data: profile, error: profileGetError } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', userId)
                .single();

            if (profileGetError) {
                console.error('[Webhook] Error fetching user profile:', profileGetError.message);
                return NextResponse.json({ error: 'User profile not found' }, { status: 400 });
            }

            const currentCredits = profile?.credits ?? 0;
            const newCredits = currentCredits + creditAmount;

            // 프로필 크레딧 업데이트 직접 수행
            const { error: profileUpdateError } = await supabase
                .from('profiles')
                .update({ credits: newCredits })
                .eq('id', userId);

            if (profileUpdateError) {
                console.error('[Webhook] Direct profile credit update failed:', profileUpdateError.message);
                return NextResponse.json({ error: 'Failed to update user credits' }, { status: 500 });
            }

            // 크레딧 트랜잭션 추가 (충전 이력 로깅용)
            const desc = `포트원 충전 (주문번호: ${paymentId})`;
            const { error: txError } = await supabase
                .from('credit_transactions')
                .insert({
                    user_id: userId,
                    amount: creditAmount,
                    type: 'earning',
                    description: desc
                });

            if (txError) {
                console.warn('[Webhook] Warning: Failed to insert credit transaction log:', txError.message);
            }

            // 주문(orders) 테이블에 이력 로깅
            const { error: orderError } = await supabase.from('orders').insert({
                user_id: userId,
                pattern_id: null as any,
                amount: amountVal,
                status: 'paid',
                payment_provider: 'portone',
                transaction_id: paymentId
            });

            if (orderError) {
                console.warn('[Webhook] Orders logging failed (skipping since credits are already charged):', orderError.message);
            } else {
                console.log('[Webhook] Order logged successfully in orders table');
            }

            console.log(`[Webhook] Success! Charged ${creditAmount} credits to user ${userId} for payment ${paymentId}`);
            return NextResponse.json({ status: 'success', message: 'Payment processed and credits charged' });
        }

        // -------------------------------------------------------------
        // [CASE 2] 결제 취소/환불 (cancelled) 처리
        // -------------------------------------------------------------
        if (isCancelledStatus) {
            // 이미 환불 완료 처리 되었는지 확인
            const { data: existingOrder } = await supabase
                .from('orders')
                .select('id, status')
                .eq('transaction_id', paymentId)
                .maybeSingle();

            if (existingOrder && existingOrder.status === 'refunded') {
                console.log(`[Webhook] Payment ${paymentId} already marked as refunded`);
                return NextResponse.json({ status: 'ignored', message: 'Payment already refunded' });
            }

            // 포트원 V2 REST API를 통해 결제 상세정보 조회 (2차 검증)
            const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET;
            if (!PORTONE_API_SECRET) {
                console.error('[Webhook] PORTONE_API_SECRET is not configured in environment variables');
                return NextResponse.json({ error: 'Webhook configuration error' }, { status: 500 });
            }

            console.log(`[Webhook] Verifying cancelled payment details with PortOne API for paymentId: ${paymentId}`);
            const response = await fetch(`https://api.portone.io/payments/${paymentId}`, {
                headers: {
                    'Authorization': `PortOne ${PORTONE_API_SECRET}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error(`[Webhook] PortOne API payment details fetch failed: Status ${response.status}, Body: ${errText}`);
                return NextResponse.json({ error: 'Failed to verify payment with PortOne' }, { status: 400 });
            }

            const paymentData = await response.json();
            console.log('[Webhook] PortOne payment data fetched (cancelled):', JSON.stringify(paymentData, null, 2));

            // 결제 상태가 CANCELLED(결제취소)인지 검증
            if (paymentData.status !== 'CANCELLED') {
                console.error(`[Webhook] PortOne payment status is not CANCELLED. Status: ${paymentData.status}`);
                return NextResponse.json({ error: 'Payment is not cancelled' }, { status: 400 });
            }

            // customData에서 환불 대상 유저 ID와 회수할 크레딧 수량 추출
            let customDataObj: any = null;
            try {
                if (paymentData.customData) {
                    customDataObj = typeof paymentData.customData === 'string'
                        ? JSON.parse(paymentData.customData)
                        : paymentData.customData;
                }
            } catch (e: any) {
                console.error('[Webhook] Failed to parse customData:', e.message);
            }

            if (!customDataObj || !customDataObj.user_id || !customDataObj.credits) {
                console.error('[Webhook] Missing user_id or credits in custom_data of payment:', JSON.stringify(paymentData.customData));
                return NextResponse.json({ error: 'Missing user_id or credits in custom_data' }, { status: 400 });
            }

            const { user_id: userId, credits: creditAmount } = customDataObj;
            const amountVal = paymentData.amount?.total || paymentData.amount?.paid || 0;

            console.log(`[Webhook] Proceeding to deduct credits for refund. User: ${userId}, Credits: ${creditAmount}, Amount: ${amountVal}`);

            // 어드민 클라이언트로 DB 반영 (RLS 우회)
            const { data: profile, error: profileGetError } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', userId)
                .single();

            if (profileGetError) {
                console.error('[Webhook] Error fetching user profile:', profileGetError.message);
                return NextResponse.json({ error: 'User profile not found' }, { status: 400 });
            }

            const currentCredits = profile?.credits ?? 0;
            // 회수할 크레딧 차감 (크레딧 보유량보다 많은 크레딧을 차감해야 할 경우 음수 대신 0으로 캡)
            const newCredits = Math.max(0, currentCredits - creditAmount);

            // 프로필 크레딧 업데이트 직접 수행
            const { error: profileUpdateError } = await supabase
                .from('profiles')
                .update({ credits: newCredits })
                .eq('id', userId);

            if (profileUpdateError) {
                console.error('[Webhook] Direct profile credit update failed during refund:', profileUpdateError.message);
                return NextResponse.json({ error: 'Failed to update user credits' }, { status: 500 });
            }

            // 크레딧 트랜잭션 추가 (환불 회수 이력 로깅용)
            const desc = `포트원 환불 회수 (주문번호: ${paymentId})`;
            const { error: txError } = await supabase
                .from('credit_transactions')
                .insert({
                    user_id: userId,
                    amount: -creditAmount,
                    type: 'refund',
                    description: desc
                });

            if (txError) {
                console.warn('[Webhook] Warning: Failed to insert refund transaction log:', txError.message);
            }

            // 주문(orders) 테이블 상태를 refunded로 업데이트
            const { error: orderError } = await supabase
                .from('orders')
                .update({ status: 'refunded' })
                .eq('transaction_id', paymentId);

            if (orderError) {
                console.warn('[Webhook] Failed to update order status to refunded:', orderError.message);
            } else {
                console.log('[Webhook] Order status set to refunded successfully');
            }

            console.log(`[Webhook] Success! Refunded and deducted ${creditAmount} credits from user ${userId} for payment ${paymentId}`);
            return NextResponse.json({ status: 'success', message: 'Refund processed and credits deducted' });
        }

        return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });

    } catch (err: any) {
        console.error('[Webhook] Server Error in Webhook Handler:', err);
        return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
    }
}
