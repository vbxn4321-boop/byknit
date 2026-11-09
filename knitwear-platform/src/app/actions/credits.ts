'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { grantCredits, spendCredits } from '@/utils/creditsServer';

export async function getUserCredits(userId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching credits:', error);
        return 0;
    }

    // Auto-grant 1000 welcome credits if the signed-in user has 0 credits and no transactions yet
    const currentCredits = data.credits ?? 0;
    if (currentCredits === 0) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: txs, error: txError } = await supabase
                .from('credit_transactions')
                .select('id')
                .eq('user_id', userId)
                .limit(1);

            if (user?.id === userId && !txError && (!txs || txs.length === 0)) {
                await grantCredits(userId, 1000, 'signUpBonus');
                return 1000;
            }
        } catch (e: any) {
            console.error('[Credits] Welcome credit check failed:', e.message);
        }
    }

    return currentCredits;
}

export async function getCreditHistory(userId: string) {
    const supabase = await createClient();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .gt('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching credit history:', error);
        return [];
    }

    // If history is empty but user has credits, add a virtual sign-up bonus record
    // This handles users who were created before the history logging was implemented
    if (data && data.length === 0) {
        const credits = await getUserCredits(userId);
        if (credits >= 1000) {
            return [{
                id: 'sign-up-bonus',
                amount: 1000,
                description: 'signUpBonus', // Special key for localization
                created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Approximate
            }];
        }
    }

    return data;
}

export async function deductCredits(userId: string, amount: number, description: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) throw new Error('Unauthorized');

    await spendCredits(userId, amount, description);
    revalidatePath('/', 'layout');
}
