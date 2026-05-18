'use server';

import { createClient } from '@/utils/supabase/server';

export async function getNotifications() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('notifications')
        .select(`
            *,
            profiles:sender_id (display_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) console.error('Error fetching notifications:', error);
    return data || [];
}

export async function markAsRead(notificationId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);
}

export async function markAllAsRead() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id);
}

// Internal helper to create notification
export async function createNotification(data: {
    userId: string;
    senderId?: string;
    type: 'review' | 'purchase' | 'follow' | 'reply';
    referenceId: string;
    message: string;
}) {
    const supabase = await createClient();

    // Don't notify self
    if (data.senderId && data.userId === data.senderId) return;

    await supabase.from('notifications').insert({
        user_id: data.userId,
        sender_id: data.senderId,
        type: data.type,
        reference_id: data.referenceId,
        message: data.message
    });
}
