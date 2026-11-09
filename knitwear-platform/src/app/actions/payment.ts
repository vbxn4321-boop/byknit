'use server';

import { createClient, createAdminClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { fetchPortonePayment } from '@/utils/portone';
import { recordPatternPurchase } from '@/utils/patternPurchase';

interface PaymentVerificationResult {
    success: boolean;
    error?: string;
}

/**
 * 크레딧 유료 충전은 중단되었다. 예전 결제 완료 주소로 들어와도 크레딧을 지급하지 않는다.
 */
export async function verifyAndChargePayment(
    _paymentId: string,
    _amount: number,
    _creditAmount: number
): Promise<PaymentVerificationResult> {
    return { success: false, error: '크레딧 충전은 현재 제공되지 않습니다.' };
}

/**
 * 포트원 결제 자동 환불 요청 처리 (유저 직접)
 * @param paymentId 포트원 결제 ID (payment_id)
 * @param reason 환불 사유
 */
export async function requestCancelPayment(
    paymentId: string,
    reason: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Authentication required' };
    }

    try {
        const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET;
        if (!PORTONE_API_SECRET) {
            return { success: false, error: 'Payment secret not configured' };
        }

        // 1. 포트원 API를 통해 결제 상세 정보 조회
        console.log(`[CancelPayment] Fetching payment details from PortOne for paymentId: ${paymentId}`);
        const fetchResponse = await fetch(`https://api.portone.io/payments/${paymentId}`, {
            headers: {
                'Authorization': `PortOne ${PORTONE_API_SECRET}`,
                'Content-Type': 'application/json'
            }
        });

        if (!fetchResponse.ok) {
            const errText = await fetchResponse.text();
            console.error(`[CancelPayment] PortOne fetch failed: ${errText}`);
            return { success: false, error: '포트원 결제 내역 조회 실패' };
        }

        const paymentData = await fetchResponse.json();

        // 결제 완료(PAID) 상태인지 확인
        if (paymentData.status !== 'PAID') {
            return { success: false, error: '이미 취소되었거나 완료되지 않은 결제입니다.' };
        }

        // 2. customData 검증 및 환불 대상 정보 추출
        let customDataObj: any = null;
        try {
            if (paymentData.customData) {
                customDataObj = typeof paymentData.customData === 'string'
                    ? JSON.parse(paymentData.customData)
                    : paymentData.customData;
            }
        } catch (e: any) {
            console.error('[CancelPayment] Failed to parse customData:', e.message);
        }

        if (!customDataObj || customDataObj.user_id !== user.id || !customDataObj.credits) {
            return { success: false, error: '결제 정보의 소유주가 일치하지 않거나 누락되었습니다.' };
        }

        const creditAmount = customDataObj.credits;
        const amountVal = paymentData.amount?.total || paymentData.amount?.paid || 0;

        // 3. 유저의 현재 보유 크레딧 잔액 검증
        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single();

        if (profileErr || !profile) {
            return { success: false, error: '사용자 프로필 조회 실패' };
        }

        const currentCredits = profile.credits ?? 0;
        if (currentCredits < creditAmount) {
            return { 
                success: false, 
                error: `충전된 크레딧(${creditAmount} Credits) 중 일부를 이미 사용하여 자동 환불이 불가능합니다. 고객센터에 문의해 주세요.` 
            };
        }

        // 4. 포트원 결제 취소 API 호출
        console.log(`[CancelPayment] Requesting cancel to PortOne for paymentId: ${paymentId}`);
        const cancelResponse = await fetch(`https://api.portone.io/payments/${paymentId}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `PortOne ${PORTONE_API_SECRET}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reason: reason || '사용자 요청 환불',
                amount: amountVal
            })
        });

        if (!cancelResponse.ok) {
            const errText = await cancelResponse.text();
            console.error(`[CancelPayment] PortOne cancel call failed: ${errText}`);
            return { success: false, error: '포트원 실결제 취소 처리 실패' };
        }

        const cancelData = await cancelResponse.json();
        console.log('[CancelPayment] PortOne cancel response:', JSON.stringify(cancelData, null, 2));

        // 5. DB 반영 (크레딧 회수 및 상태 차감)
        const adminSupabase = await createAdminClient();

        const newCredits = Math.max(0, currentCredits - creditAmount);
        
        // 프로필 크레딧 업데이트
        const { error: profileUpdateError } = await adminSupabase
            .from('profiles')
            .update({ credits: newCredits })
            .eq('id', user.id);

        if (profileUpdateError) {
            console.error('[CancelPayment] Failed to deduct profile credits in DB:', profileUpdateError.message);
        }

        // 크레딧 트랜잭션 추가 (환불 회수 이력)
        const desc = `포트원 환불 회수 (주문번호: ${paymentId})`;
        const { error: txError } = await adminSupabase
            .from('credit_transactions')
            .insert({
                user_id: user.id,
                amount: -creditAmount,
                type: 'refund',
                description: desc
            });

        if (txError) {
            console.warn('[CancelPayment] Failed to insert refund transaction log:', txError.message);
        }

        // 주문(orders) 테이블 상태를 refunded로 업데이트
        const { error: orderError } = await adminSupabase
            .from('orders')
            .update({ status: 'refunded' })
            .eq('transaction_id', paymentId);

        if (orderError) {
            console.warn('[CancelPayment] Failed to update order status to refunded:', orderError.message);
        }

        revalidatePath('/', 'layout');
        return { success: true };

    } catch (err: any) {
        console.error('Cancel Payment Server Error:', err);
        return { success: false, error: err.message || 'Server refund execution failed' };
    }
}

/**
 * 포트원 직접 결제 검증 및 도안 구매(주문) 기록 처리
 * @param paymentId 포트원 imp_uid
 * @param _amount 클라이언트 금액은 신뢰하지 않고 도안 가격으로 검증한다
 * @param patternId 구매할 도안 ID
 */
export async function verifyAndRecordDirectPurchase(
    paymentId: string,
    _amount: number,
    patternId: string
): Promise<PaymentVerificationResult> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'Authentication required' };
    }

    try {
        const payment = await fetchPortonePayment(paymentId);
        if (!payment) {
            return { success: false, error: '포트원 결제 내역 조회 실패' };
        }

        const result = await recordPatternPurchase(payment, { userId: user.id, patternId });
        if (!result.ok) {
            return { success: false, error: result.message };
        }

        revalidatePath(`/marketplace/${patternId}`);
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (err: any) {
        console.error('Direct Purchase Verification Server Error:', err);
        return { success: false, error: err.message || 'Server verification failed' };
    }
}
