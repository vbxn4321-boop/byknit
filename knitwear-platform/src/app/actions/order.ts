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

    // 2. Insert Order
    const { data: order, error } = await supabase.from('orders').insert({
        user_id: user.id,
        pattern_id: data.patternId,
        seller_id: pattern.designer_id, // Important for analytics
        amount: data.amount,
        amount_usd: data.amount, // Ensure this column is populated if it exists/is used
        status: 'paid', // Assuming success for this mock/sandbox flow
        payment_provider: 'portone',
        transaction_id: data.paymentKey || `tx_${Date.now()}`
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
                    price: pattern.price_usd
                }
            })
        });
    }

    revalidatePath(`/marketplace/${data.patternId}`);
    return { success: true };
}
