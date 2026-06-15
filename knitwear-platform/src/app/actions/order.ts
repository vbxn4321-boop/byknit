'use server';

import { createClient } from '@/utils/supabase/server';
import { createNotification } from './notification';
import { revalidatePath } from 'next/cache';

export async function createOrder(data: {
    patternId: string;
    amount: number;
    paymentKey?: string; // PortOne payment ID
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Authentication required' };

    // 1. Fetch pattern first to get seller_id
    const { data: pattern, error: patternError } = await supabase
        .from('patterns')
        .select('designer_id, title, price_usd')
        .eq('id', data.patternId)
        .single();

    if (patternError || !pattern) return { error: 'Pattern not found' };

    // 2. Process Credit Payment if paid pattern
    const price = pattern.price_usd || 0;
    if (price > 0) {
        const { getUserCredits, deductCredits, addCredits } = await import('./credits');
        const buyerCredits = await getUserCredits(user.id);
        if (buyerCredits < price) {
            return { error: `크레딧이 부족합니다. (필요: ${price} 크레딧, 보유: ${buyerCredits} 크레딧)` };
        }

        try {
            const patternTitle = (pattern.title as any)?.ko || (pattern.title as any)?.en || 'Pattern';
            // Deduct from buyer
            await deductCredits(user.id, price, `도안 구매: ${patternTitle}`);
            
            // Add to seller (designer)
            if (pattern.designer_id && pattern.designer_id !== user.id) {
                await addCredits(pattern.designer_id, price, `도안 판매 수익: ${patternTitle}`);
            }
        } catch (creditError: any) {
            console.error('Credit Transaction Error:', creditError);
            return { error: '크레딧 결제 처리 중 오류가 발생했습니다: ' + creditError.message };
        }
    }

    // 3. Insert Order
    const { data: order, error } = await supabase.from('orders').insert({
        user_id: user.id,
        pattern_id: data.patternId,
        seller_id: pattern.designer_id, // Important for analytics
        amount: price,
        amount_usd: price, // Ensure this column is populated if it exists/is used
        status: 'paid', // Assuming success for this mock/sandbox flow
        payment_provider: price > 0 ? 'credit' : 'free',
        transaction_id: data.paymentKey || `${price > 0 ? 'credit' : 'free'}_${Date.now()}`
    }).select().single();

    if (error) return { error: error.message };

    // 4. Notify Seller
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
                    price: price
                }
            })
        });
    }

    revalidatePath(`/marketplace/${data.patternId}`);
    return { success: true };
}

