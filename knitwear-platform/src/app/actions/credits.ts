'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

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

    return data.credits ?? 0;
}

export async function getCreditHistory(userId: string) {
    const supabase = await createClient();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
        .from('credit_history')
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
        if (credits >= 5) {
            return [{
                id: 'sign-up-bonus',
                amount: 5,
                description: 'signUpBonus', // Special key for localization
                created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Approximate
            }];
        }
    }

    return data;
}

export async function addCredits(userId: string, amount: number, description: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('credit_transactions')
        .insert({
            user_id: userId,
            amount: amount,
            type: 'earning',
            description: description
        });

    if (error) {
        console.error('Error adding credits:', error);
        throw new Error('Failed to add credits');
    }

    revalidatePath('/', 'layout');
}

export async function deductCredits(userId: string, amount: number, description: string) {
    const supabase = await createClient();
    
    // 1. Check current balance
    const currentCredits = await getUserCredits(userId);
    if (currentCredits < amount) {
        throw new Error('Insufficient credits');
    }

    // 2. Insert transaction (Trigger will update profile credits)
    const { error } = await supabase
        .from('credit_transactions')
        .insert({
            user_id: userId,
            amount: -amount,
            type: 'spending',
            description: description
        });

    if (error) {
        console.error('Error deducting credits:', error);
        throw new Error('Failed to deduct credits');
    }

    revalidatePath('/', 'layout');
}

