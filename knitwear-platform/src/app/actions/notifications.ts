'use server';

import { createClient } from '@/utils/supabase/server';

// ============================================
// 알림 전송 (내부 헬퍼)
// ============================================
export async function sendNotification(
    userId: string,
    senderId: string,
    type: string,
    referenceId: string,
    message: string
) {
    // 본인에게 알림을 보내지 않음
    if (userId === senderId) return;

    const supabase = await createClient();
    await supabase.from('notifications').insert({
        user_id: userId,
        sender_id: senderId,
        type,
        reference_id: referenceId,
        message,
    });
}

// ============================================
// 내 알림 목록 조회
// ============================================
export async function getNotifications(limit = 20) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('notifications')
        .select(`
            *,
            sender:sender_id (id, display_name, email)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }

    return data || [];
}

// ============================================
// 읽지 않은 알림 개수
// ============================================
export async function getUnreadCount() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

    if (error) return 0;
    return count || 0;
}

// ============================================
// 알림 읽음 처리 (단건)
// ============================================
export async function markAsRead(notificationId: string) {
    const supabase = await createClient();
    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
}

// ============================================
// 알림 전체 읽음 처리
// ============================================
export async function markAllAsRead() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
}
