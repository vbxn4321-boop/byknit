'use server';

import { createClient } from '@/utils/supabase/server';
import { createNotification } from './notification';
import { revalidatePath } from 'next/cache';

// 무료 도안(가격 0원) 전용 주문 기록 - 유료 도안은 CheckoutModal의 포트원 결제 플로우
// (verifyAndRecordDirectPurchase, src/app/actions/payment.ts)를 거쳐야 한다.
export async function createOrder(data: {
    patternId: string;
    amount: number;
    paymentKey?: string; // 무료 다운로드 식별자 (e.g. `free_${Date.now()}`)
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Authentication required' };

    // 1. Fetch pattern first to get seller_id and confirm it's actually free
    const { data: pattern, error: patternError } = await supabase
        .from('patterns')
        .select('designer_id, title, price_usd, price_krw')
        .eq('id', data.patternId)
        .single();

    if (patternError || !pattern) return { error: 'Pattern not found' };

    const priceKrw = pattern.price_krw || Math.round((pattern.price_usd || 0) * 1450);
    if (priceKrw > 0) {
        return { error: '유료 도안은 결제를 통해 구매해야 합니다.' };
    }

    // 이미 받은 무료 도안이면 중복 주문을 만들지 않는다 (재다운로드 시 기록이 늘어나는 것 방지)
    const { data: existing } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .eq('pattern_id', data.patternId)
        .eq('status', 'paid')
        .limit(1);
    if (existing && existing.length > 0) return { success: true, existing: true };

    // 2. Insert Order
    const { data: order, error } = await supabase.from('orders').insert({
        user_id: user.id,
        pattern_id: data.patternId,
        seller_id: pattern.designer_id, // Important for analytics
        amount: 0,
        amount_usd: 0,
        currency: 'KRW',
        status: 'paid',
        payment_provider: 'free',
        transaction_id: data.paymentKey || `free_${Date.now()}`
    }).select().single();

    if (error) return { error: error.message };

    // 3. Notify Seller
    if (pattern) {
        const patternTitle = (pattern.title as any)?.en || 'your pattern';

        await createNotification({
            userId: pattern.designer_id,
            senderId: user.id,
            type: 'purchase',
            referenceId: order.id,
            message: JSON.stringify({
                key: 'purchase',
                params: {
                    title: patternTitle,
                    price: 0
                }
            })
        });
    }

    revalidatePath(`/marketplace/${data.patternId}`);
    return { success: true };
}

