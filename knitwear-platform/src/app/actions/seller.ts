
'use server';

import { createClient } from '@/utils/supabase/server';

export async function updateMarketSettings(formData: {
    bio?: string;
    instagram_handle?: string;
    website_url?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user.id);

    if (error) throw error;
}

export async function getSellerProducts() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('patterns')
        .select('*')
        .eq('designer_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function updateProductSale(patternId: string, isOnSale: boolean, discountPercentage: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('patterns')
        .update({
            is_on_sale: isOnSale,
            discount_percentage: discountPercentage
        })
        .eq('id', patternId)
        .eq('designer_id', user.id);

    if (error) throw error;
}

export async function getSellerReviews() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // Get reviews for all patterns owned by this seller
    const { data, error } = await supabase
        .from('reviews')
        .select(`
            *,
            patterns!inner(designer_id, title),
            profiles(display_name, avatar_url)
        `)
        .eq('patterns.designer_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}
