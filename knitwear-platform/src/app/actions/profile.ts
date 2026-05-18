
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: {
    display_name?: string;
    phone?: string;
    bio?: string;
    instagram_handle?: string;
    avatar_url?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user.id);

    if (error) return { error: error.message };

    revalidatePath('/[locale]/profile', 'page');
    revalidatePath('/[locale]/marketplace/dashboard', 'page');
    return { success: true };
}

export async function deleteAccount() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    // In a real app, this would be a more complex process (soft delete, GDPR, etc.)
    // For this demo, we'll try to delete from public tables first
    await supabase.from('profiles').delete().eq('id', user.id);
    const { error } = await supabase.auth.admin.deleteUser(user.id);

    if (error) throw error;
}

export async function getMyComments() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('reviews')
        .select(`
            *,
            patterns (title)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function updateReview(reviewId: string, rating: number, content: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('reviews')
        .update({ rating, content })
        .eq('id', reviewId)
        .eq('user_id', user.id);

    if (error) throw error;
}

export async function deleteReview(reviewId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id);

    if (error) throw error;
}
