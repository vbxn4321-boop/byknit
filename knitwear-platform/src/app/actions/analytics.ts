'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// Track a pattern view
export async function trackPatternView(patternId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('pattern_views').insert({
        pattern_id: patternId,
        viewer_id: user?.id || null
    });
}

// Toggle like on a pattern
export async function togglePatternLike(patternId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    // Check if already liked
    const { data: existing } = await supabase
        .from('pattern_likes')
        .select('id')
        .eq('pattern_id', patternId)
        .eq('user_id', user.id)
        .single();

    if (existing) {
        // Unlike
        await supabase.from('pattern_likes').delete().eq('id', existing.id);
        return { liked: false };
    } else {
        // Like
        await supabase.from('pattern_likes').insert({
            pattern_id: patternId,
            user_id: user.id
        });

        // 🔔 Reward the designer (+1)
        try {
            const { data: pattern } = await supabase.from('patterns').select('designer_id').eq('id', patternId).single();
            if (pattern && pattern.designer_id !== user.id) {
                // Import addCredits at top of file or use dynamic import if needed.
                // It's probably better to use dynamic import to avoid circular dependencies if any, or just import it.
                const { addCredits } = await import('./credits');
                await addCredits(pattern.designer_id, 1, `Marketplace Like Reward (${patternId})`);
            }
        } catch (e) {
            console.error('Failed to reward pattern like:', e);
        }

        return { liked: true };
    }
}

// Check if user has liked a pattern
export async function hasUserLikedPattern(patternId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const { data } = await supabase
        .from('pattern_likes')
        .select('id')
        .eq('pattern_id', patternId)
        .eq('user_id', user.id)
        .single();

    return !!data;
}

// Get seller analytics (last 3 months)
export async function getSellerAnalytics(sellerId: string) {
    const supabase = await createClient();

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Get seller's pattern IDs
    const { data: patterns } = await supabase
        .from('patterns')
        .select('id')
        .eq('designer_id', sellerId);

    const patternIds = patterns?.map(p => p.id) || [];

    if (patternIds.length === 0) {
        return {
            totalSales: 0,
            totalRevenue: 0,
            totalViews: 0,
            totalLikes: 0,
            monthlySales: [0, 0, 0],
            monthlyViews: [0, 0, 0],
            monthlyLikes: [0, 0, 0]
        };
    }

    // Get views count (all time)
    const { count: viewsCount } = await supabase
        .from('pattern_views')
        .select('*', { count: 'exact', head: true })
        .in('pattern_id', patternIds);

    // Get likes count (all time)
    const { count: likesCount } = await supabase
        .from('pattern_likes')
        .select('*', { count: 'exact', head: true })
        .in('pattern_id', patternIds);

    // Get orders (all time)
    const { data: orders } = await supabase
        .from('orders')
        .select('amount_usd, created_at')
        .eq('seller_id', sellerId)
        .eq('status', 'completed');

    const totalSales = orders?.length || 0;
    const totalRevenue = orders?.reduce((sum, o) => sum + (o.amount_usd || 0), 0) || 0;

    const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', sellerId);

    return {
        totalSales,
        totalRevenue,
        totalViews: viewsCount || 0,
        totalLikes: likesCount || 0,
        totalFollowers: followersCount || 0
    };
}

// Get daily stats for a specific month (Legacy/internal use if needed, but keeping for compatibility)
export async function getDailyStats(sellerId: string, monthOffset: number = 0, statType: 'views' | 'likes' | 'sales') {
    const supabase = await createClient();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0);

    // Get seller's pattern IDs
    const { data: patterns } = await supabase
        .from('patterns')
        .select('id')
        .eq('designer_id', sellerId);

    const patternIds = patterns?.map(p => p.id) || [];

    if (patternIds.length === 0) {
        return Array(endOfMonth.getDate()).fill(0);
    }

    let data: any[] = [];
    const dateColumn = statType === 'views' ? 'viewed_at' : 'created_at';

    if (statType === 'views') {
        const { data: views } = await supabase
            .from('pattern_views')
            .select('viewed_at')
            .in('pattern_id', patternIds)
            .gte('viewed_at', startOfMonth.toISOString())
            .lte('viewed_at', endOfMonth.toISOString());
        data = views || [];
    } else if (statType === 'likes') {
        const { data: likes } = await supabase
            .from('pattern_likes')
            .select('created_at')
            .in('pattern_id', patternIds)
            .gte('created_at', startOfMonth.toISOString())
            .lte('created_at', endOfMonth.toISOString());
        data = likes || [];
    } else if (statType === 'sales') {
        const { data: orders } = await supabase
            .from('orders')
            .select('created_at')
            .eq('seller_id', sellerId)
            .eq('status', 'completed')
            .gte('created_at', startOfMonth.toISOString())
            .lte('created_at', endOfMonth.toISOString());
        data = orders || [];
    }

    // Aggregate by day
    const dailyCounts = Array(endOfMonth.getDate()).fill(0);
    data.forEach((item: any) => {
        const date = new Date(item[dateColumn]);
        const day = date.getDate() - 1; // 0-indexed
        if (day >= 0 && day < dailyCounts.length) {
            dailyCounts[day]++;
        }
    });

    return dailyCounts;
}

// Get analytics data for a specific date range
export async function getAnalyticsData(
    sellerId: string,
    startDate: string,
    endDate: string,
    type: 'views' | 'likes' | 'sales' | 'followers'
) {
    const supabase = await createClient();
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Adjust end date to include the full day
    const endQuery = new Date(endDate);
    endQuery.setHours(23, 59, 59, 999);

    let patternIds: string[] = [];

    if (type !== 'followers') {
        // Get seller's pattern IDs
        const { data: patterns } = await supabase
            .from('patterns')
            .select('id')
            .eq('designer_id', sellerId);

        patternIds = patterns?.map(p => p.id) || [];

        if (patternIds.length === 0) {
            // Return zeros if no patterns (and not followers mode)
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return Array(days).fill(0);
        }
    }

    let rawData: any[] = [];
    // For followers, created_at is the timestamp.
    const dateColumn = (type === 'views') ? 'viewed_at' : 'created_at';

    if (type === 'views') {
        const { data } = await supabase
            .from('pattern_views')
            .select('viewed_at')
            .in('pattern_id', patternIds)
            .gte('viewed_at', start.toISOString())
            .lte('viewed_at', endQuery.toISOString());
        rawData = data || [];
    } else if (type === 'likes') {
        const { data } = await supabase
            .from('pattern_likes')
            .select('created_at')
            .in('pattern_id', patternIds)
            .gte('created_at', start.toISOString())
            .lte('created_at', endQuery.toISOString());
        rawData = data || [];
    } else if (type === 'sales') {
        const { data } = await supabase
            .from('orders')
            .select('created_at')
            .eq('seller_id', sellerId)
            .eq('status', 'completed')
            .gte('created_at', start.toISOString())
            .lte('created_at', endQuery.toISOString());
        rawData = data || [];
    } else if (type === 'followers') {
        const { data } = await supabase
            .from('follows')
            .select('created_at')
            .eq('following_id', sellerId)
            .gte('created_at', start.toISOString())
            .lte('created_at', endQuery.toISOString());
        rawData = data || [];
    }

    // Aggregate by day
    // Map: "YYYY-MM-DD" -> count
    const dailyMap = new Map<string, number>();
    rawData.forEach(item => {
        // Parse date safely (handle timezone if needed, but for now UTC date string part is okay)
        const dateStr = new Date(item[dateColumn]).toISOString().split('T')[0];
        dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + 1);
    });

    // Fill the result array
    const result: number[] = [];
    const current = new Date(start);
    // Normalize time to avoid infinite loops if timezones differ
    current.setHours(0, 0, 0, 0);
    const endTime = new Date(endDate);
    endTime.setHours(0, 0, 0, 0);

    while (current <= endTime) {
        const dateStr = current.toISOString().split('T')[0];
        result.push(dailyMap.get(dateStr) || 0);
        current.setDate(current.getDate() + 1);
    }

    return result;
}
