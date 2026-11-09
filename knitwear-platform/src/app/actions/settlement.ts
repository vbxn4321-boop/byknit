'use server';

import { createClient } from '@/utils/supabase/server';

export async function getSellerBalance(userId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('seller_balance_krw')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching seller balance:', error);
        return 0;
    }

    return data.seller_balance_krw ?? 0;
}

export async function getSettlementHistory(userId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('settlement_transactions')
        .select('*')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching settlement history:', error);
        return [];
    }

    return data;
}
