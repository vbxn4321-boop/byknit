'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { createNotification } from './notification';

export async function addReview(data: {
    patternId: string;
    rating: number;
    content: string;
    images?: string[];
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Authentication required' };
    if (data.content.length < 10) return { error: 'Review must be at least 10 characters long' };
    if (data.content.length > 1000) return { error: 'Review must be at most 1000 characters long' };

    // 1. Fetch pattern to check price
    const { data: pattern, error: patternError } = await supabase
        .from('patterns')
        .select('is_free, price_usd, designer_id, title')
        .eq('id', data.patternId)
        .single();

    if (patternError || !pattern) return { error: 'Pattern not found' };

    // 2. Check if user has purchased/downloaded the pattern
    const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .eq('pattern_id', data.patternId)
        .eq('status', 'paid')
        .limit(1);

    if (orderError || !orders || orders.length === 0) {
        return { error: 'You can only review patterns you have downloaded or purchased.' };
    }

    const { data: review, error } = await supabase.from('reviews').upsert({
        user_id: user.id,
        pattern_id: data.patternId,
        rating: data.rating,
        content: data.content,
        images: data.images || [],
    }, {
        onConflict: 'user_id, pattern_id'
    }).select().single();

    console.log('[addReview] User:', user.id);
    console.log('[addReview] Values:', { patternId: data.patternId, rating: data.rating });
    console.log('[addReview] Result:', { review, error });

    if (error) return { error: error.message };

    // 3. Notify Pattern Designer
    if (pattern) {
        const patternTitle = (pattern.title as any)?.en || 'your pattern';
        const photoSuffix = data.images && data.images.length > 0 ? ' [Photo]' : '';
        await createNotification({
            userId: pattern.designer_id,
            senderId: user.id,
            type: 'review',
            referenceId: review.id,
            message: JSON.stringify({
                key: 'review',
                params: {
                    title: patternTitle,
                    hasPhoto: !!(data.images && data.images.length > 0),
                    content: data.content.substring(0, 20)
                }
            })
        });
    }

    revalidatePath(`/marketplace/${data.patternId}`);
    return { success: true };
}

export async function getReviews(patternId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('reviews')
        .select(`
            *,
            profiles (
                display_name,
                avatar_url
            ),
            comments (
                id,
                content,
                created_at,
                profiles (
                   display_name,
                   avatar_url
                )
            )
        `)
        .eq('pattern_id', patternId)
        .order('created_at', { ascending: false });

    // Sort comments by created_at ascending
    const processedData = data?.map(review => ({
        ...review,
        comments: review.comments?.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    }));

    console.log(`[getReviews] Pattern: ${patternId}, Found: ${processedData?.length}, Error: ${error?.message}`);

    if (error) return { error: error.message };
    return { reviews: processedData };
}

export async function deleteReview(reviewId: string, patternId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Authentication required' };

    const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id);

    if (error) return { error: error.message };

    revalidatePath(`/marketplace/${patternId}`);
    return { success: true };
}

export async function addComment(data: {
    reviewId: string;
    content: string;
    patternId: string; // Needed for revalidation
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Authentication required' };
    if (!data.content.trim()) return { error: 'Comment cannot be empty' };

    const { error } = await supabase.from('comments').insert({
        user_id: user.id,
        review_id: data.reviewId,
        content: data.content
    });

    if (error) return { error: error.message };

    // Notify Review Author
    const { data: review } = await supabase
        .from('reviews')
        .select('user_id, content')
        .eq('id', data.reviewId)
        .single();

    if (review) {
        await createNotification({
            userId: review.user_id,
            senderId: user.id,
            type: 'reply',
            referenceId: data.reviewId,
            message: JSON.stringify({
                key: 'reply',
                params: {
                    content: data.content.substring(0, 20)
                }
            })
        });
    }

    revalidatePath(`/marketplace/${data.patternId}`);
    return { success: true };
}

export async function toggleFollow(followingId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Authentication required' };
    if (user.id === followingId) return { error: 'You cannot follow yourself' };

    // Check if already following
    const { data: existing } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', followingId)
        .single();

    if (existing) {
        const { error } = await supabase
            .from('follows')
            .delete()
            .eq('follower_id', user.id)
            .eq('following_id', followingId);

        if (error) return { error: error.message };
    } else {
        const { error } = await supabase
            .from('follows')
            .insert({
                follower_id: user.id,
                following_id: followingId
            });

        if (error) return { error: error.message };

        // Notify User being followed
        await createNotification({
            userId: followingId,
            senderId: user.id,
            type: 'follow',
            referenceId: user.id,
            message: JSON.stringify({
                key: 'follow',
                params: {}
            })
        });
    }

    revalidatePath(`/marketplace`); // Revalidate generally or specific pages
    return { success: true, isFollowing: !existing };
}

export async function getFollowStatus(followingId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { isFollowing: false };

    const { data } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', followingId)
        .single();

    return { isFollowing: !!data };
}

export async function getDesignerProfile(designerId: string) {
    const supabase = await createClient();
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', designerId)
        .single();

    if (error) return { error: error.message };

    // Get follower count
    const { count, error: countError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', designerId);

    return {
        profile: {
            ...profile,
            follower_count: count || 0
        }
    };
}

export async function toggleLike(patternId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Authentication required', isLiked: false };

    // Check if already liked
    const { data: existing } = await supabase
        .from('pattern_likes')
        .select('id')
        .eq('pattern_id', patternId)
        .eq('user_id', user.id)
        .single();

    if (existing) {
        // Unlike
        const { error } = await supabase
            .from('pattern_likes')
            .delete()
            .eq('id', existing.id);

        if (error) return { error: error.message, isLiked: true };
        return { success: true, isLiked: false };
    } else {
        // Like
        const { error } = await supabase
            .from('pattern_likes')
            .insert({
                pattern_id: patternId,
                user_id: user.id
            });

        if (error) return { error: error.message, isLiked: false };

        // Notify Designer (Optional)
        // ...

        return { success: true, isLiked: true };
    }
}

export async function getLikeStatus(patternId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { isLiked: false };

    const { data } = await supabase
        .from('pattern_likes')
        .select('id')
        .eq('pattern_id', patternId)
        .eq('user_id', user.id)
        .single();

    return { isLiked: !!data };
}
