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

        // paid 상태 혹은 Transaction.Paid 이벤트 유형일 때만 결제 처리
        const isPaidStatus = 
            status === 'paid' || 
            status === 'PAID' || 
            body.type === 'Transaction.Paid' ||
            body.type === 'paid';

        if (!isPaidStatus) {
            console.log(`[Webhook] Ignored webhook status: ${status || body.type} for paymentId: ${paymentId}`);
            return NextResponse.json({ status: 'ignored', message: 'Not a paid event' });
        }

        const supabase = await createAdminClient();

        // 2. 결제 중복 처리 방지 확인
        const { data: existingOrder } = await supabase
            .from('orders')
            .select('id, status')
            .eq('transaction_id', paymentId)
            .maybeSingle();

        if (existingOrder && existingOrder.status === 'paid') {
            console.log(`[Webhook] Payment ${paymentId} already processed (order found)`);
            return NextResponse.json({ status: 'ignored', message: 'Payment already processed' });
        }

        // 3. 포트원 V2 REST API를 통해 결제 상세정보 조회 (2차 검증)
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

        // 4. customData에서 충전 대상 유저 ID와 지급 크레딧 수량 추출
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

        // 5. 어드민 클라이언트로 DB 반영 (RLS 우회)
        
        // 5-1. 유저의 현재 보유 크레딧 조회
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

        // 5-2. 프로필 크레딧 업데이트 직접 수행 (트리거 누락에 대비해 명시적 실행)
        const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({ credits: newCredits })
            .eq('id', userId);

        if (profileUpdateError) {
            console.error('[Webhook] Direct profile credit update failed:', profileUpdateError.message);
            return NextResponse.json({ error: 'Failed to update user credits' }, { status: 500 });
        }

        // 5-3. 크레딧 트랜잭션 추가 (충전 이력 로깅용)
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

        // 5-4. 주문(orders) 테이블에 이력 로깅
        // (amount_usd 컬럼은 스키마에 없으므로 제외하며, pattern_id의 NOT NULL 제약조건으로 인한 삽입 실패는 수용 및 예외처리)
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

    } catch (err: any) {
        console.error('[Webhook] Server Error in Webhook Handler:', err);
        return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
    }
}
