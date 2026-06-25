'use server'

import { createClient, createAdminClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { addCredits } from "./credits";

export async function createPdfPattern(data: {
    title: string;
    price: number;
    category: string;
    subcategory?: string;
    difficulty: string;
    craftType: string;
    yarnWeight?: string;
    yardage?: string | number;
    yarnAmount?: string;
    needles: string;
    gaugeStitches?: string | number;
    gaugeRows?: string | number;
    gauge?: string;
    briefDescription: string;
    detailedDescription?: string;
    imageUrl: string;
    additionalImages: string[];
    usedColors: string[];
    pdfUrl: string;
    sizes?: string;
    measurements?: string;
    yarnParts?: any[];
    sizeParts?: any[];
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    // Translate metadata if needed
    const { translatePatternMetadata } = await import("./translate");
    const translatedMetadata = await translatePatternMetadata({
        title: data.title,
        briefDescription: data.briefDescription,
        detailedDescription: data.detailedDescription,
        sizes: data.sizes,
        measurements: data.measurements
    });

    const { data: pattern, error } = await supabase
        .from('patterns')
        .insert({
            title: translatedMetadata.title,
            description: translatedMetadata.description,
            price: data.price,
            price_usd: data.price,
            images: [data.imageUrl, ...(data.additionalImages || [])].filter(Boolean),
            category: data.category,
            difficulty: data.difficulty,
            designer_id: user.id,
            status: 'published',
            sizes: translatedMetadata.sizes,
            measurements: translatedMetadata.measurements,
            content: {
                type: 'pdf',
                pdf_url: data.pdfUrl,
                original_filename: data.title + '.pdf',
                metadata: {
                    craft_type: data.craftType,
                    subcategory: data.subcategory,
                    yarn_weight: data.yarnWeight,
                    needles: data.needles,
                    gauge: data.gauge || data.gaugeStitches || '',
                    yardage: data.yardage || data.yarnAmount || '',
                    yarnParts: data.yarnParts,
                    sizeParts: data.sizeParts
                }
            }
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating pattern:', error);
        throw new Error(error.message);
    }

    // Award credits for uploading a pattern
    try {
        await addCredits(user.id, 100, 'Pattern Upload Reward');
    } catch (creditError) {
        console.error('Failed to award credits:', creditError);
    }

    revalidatePath('/marketplace');
    revalidatePath(`/[locale]/marketplace/dashboard`, 'page');
    return pattern;
}

export async function updatePattern(data: {
    id: string;
    title: string;
    description: string;
    price: number;
    locale: string;
}) {
    const supabase = await createClient();
    const adminClient = await createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    // First get the current pattern to update its JSON title/description objects
    const { data: existing, error: fetchError } = await supabase
        .from('patterns')
        .select('*') // Select all to avoid column mismatch in select
        .eq('id', data.id)
        .single();

    if (fetchError || !existing) {
        throw new Error(fetchError?.message || 'Pattern not found');
    }

    // Check if the user is an admin
    const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    const isAdmin = profile?.role === 'admin';

    // Check ownership (support both designer_id and author_id for backward compatibility)
    const isOwner = existing.designer_id === user.id || (existing as any).author_id === user.id || isAdmin;
    if (!isOwner) {
        console.error('Ownership check failed:', { designer_id: existing.designer_id, author_id: (existing as any).author_id, user_id: user.id });
        throw new Error('You do not have permission to edit this pattern');
    }

    // Update the objects for the specific locale
    const updatedTitle = {
        ...(typeof existing.title === 'object' ? existing.title : {}),
        [data.locale]: data.title
    };
    const updatedDescription = {
        ...(typeof existing.description === 'object' ? existing.description : {}),
        [data.locale]: data.description
    };

    // Track price changes for the sale badge
    const priceChanged = existing.price_usd !== data.price;
    const updatePayload: any = {
        title: updatedTitle,
        description: updatedDescription,
        price_usd: data.price,
        price_krw: Math.round(data.price * 1450), // Standardize KRW price
        is_free: data.price === 0
    };

    if (priceChanged) {
        updatePayload.previous_price = existing.price_usd;
        updatePayload.price_updated_at = new Date().toISOString();
    }

    // If admin, use adminClient to bypass RLS
    const clientToUse = isAdmin ? adminClient : supabase;
    const { error: updateError, count } = await clientToUse
        .from('patterns')
        .update(updatePayload, { count: 'exact' })
        .eq('id', data.id);

    if (updateError || count === 0) {
        console.error('SERVER ACTION ERROR: updatePattern failed', {
            error: updateError,
            count,
            payload: updatePayload,
            patternId: data.id
        });
        throw new Error(updateError?.message || 'Update failed: Record not found or permission denied');
    }

    revalidatePath('/marketplace');
    revalidatePath(`/[locale]/marketplace/dashboard`, 'page');
    revalidatePath(`/profile/${user.id}`);
    return { success: true };
}

export async function incrementViewCount(patternId: string) {
    const supabase = await createClient();

    const { error } = await supabase.rpc('increment_pattern_view_count', { p_id: patternId });

    if (error) {
        console.error('Error incrementing view count:', error);
        return { success: false, error: error.message };
    }

    // Also track for analytics graph
    try {
        await supabase.from('pattern_views').insert({
            pattern_id: patternId,
            viewer_id: (await supabase.auth.getUser()).data.user?.id || null
        });
    } catch (e) {
        console.error('Failed to track analytics view:', e);
        // Don't fail the request just because analytics failed
    }

    return { success: true };
}

export async function incrementDownloadCount(patternId: string) {
    const supabase = await createClient();

    const { error } = await supabase.rpc('increment_pattern_download_count', { p_id: patternId });

    if (error) {
        console.error('Error incrementing download count:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function deletePattern(patternId: string) {
    const supabase = await createClient();
    const adminClient = await createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    // Check ownership
    const { data: pattern } = await supabase
        .from('patterns')
        .select('designer_id')
        .eq('id', patternId)
        .single();

    if (!pattern) return { success: false, error: 'Pattern not found' };

    // Check if the user is an admin
    const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
    const isAdmin = profile?.role === 'admin';

    if (pattern.designer_id !== user.id && !isAdmin) return { success: false, error: 'Unauthorized' };

    // If admin, use adminClient to bypass RLS
    const clientToUse = isAdmin ? adminClient : supabase;
    const { error } = await clientToUse
        .from('patterns')
        .update({ status: 'archived' })
        .eq('id', patternId);

    if (error) {
        console.error('Error deleting pattern:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/marketplace');
    revalidatePath(`/[locale]/marketplace/dashboard`, 'page');
    revalidatePath(`/profile/${user.id}`);

    return { success: true };
}

export async function getPatternStats(patternId: string) {
    const supabase = await createClient();

    // Get basic stats from pattern table
    const { data: pattern } = await supabase
        .from('patterns')
        .select('view_count, download_count')
        .eq('id', patternId)
        .single();

    // Get likes count
    const { count: likeCount } = await supabase
        .from('pattern_likes')
        .select('*', { count: 'exact', head: true })
        .eq('pattern_id', patternId);

    // Get reviews count
    const { count: reviewCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('pattern_id', patternId);

    return {
        views: pattern?.view_count || 0,
        downloads: pattern?.download_count || 0,
        likes: likeCount || 0,
        reviews: reviewCount || 0
    };
}

export async function getPatternReviews(patternId: string) {
    const supabase = await createClient();

    const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
            *,
            user:user_id (
                id,
                email,
                full_name,
                avatar_url
            )
        `)
        .eq('pattern_id', patternId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }

    return reviews;
}

export async function replyToReview(reviewId: string, reply: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    // Update the review with the reply
    const { error } = await supabase
        .from('reviews')
        .update({
            seller_reply: reply,
            seller_reply_at: new Date().toISOString()
        })
        .eq('id', reviewId);

    if (error) {
        console.error('Error replying to review:', error);
        return { success: false, error: error.message };
    }

    // Notify the user who wrote the review
    const { data: review } = await supabase.from('reviews').select('user_id, content').eq('id', reviewId).single();
    if (review) {
        // Dynamic import to avoid circular dependency
        const { createNotification } = await import('./notification');

        await createNotification({
            userId: review.user_id,
            senderId: user.id,
            type: 'reply',
            referenceId: reviewId,
            message: JSON.stringify({
                key: 'reply',
                params: {
                    content: reply.substring(0, 50) + (reply.length > 50 ? '...' : '')
                }
            })
        });
    }

    revalidatePath('/marketplace');
    revalidatePath(`/[locale]/marketplace/dashboard`, 'page');
    return { success: true };
}

export async function syncViewCounts() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Unauthorized' };

    // Get all patterns for the user
    const { data: patterns } = await supabase.from('patterns').select('id').eq('designer_id', user.id);

    if (!patterns) return { success: true };

    let updated = 0;
    for (const p of patterns) {
        // Get count from views table
        const { count: viewCount } = await supabase
            .from('pattern_views')
            .select('*', { count: 'exact', head: true })
            .eq('pattern_id', p.id);

        // Get count from downloads table (if we had one, but we use pattern table for now or rpc?
        // Wait, downloads are just a count column usually, unless we track individual downloads.
        // For now, just sync views.

        // Update pattern table
        await supabase
            .from('patterns')
            .update({ view_count: viewCount || 0 })
            .eq('id', p.id);
        updated++;
    }

    revalidatePath('/[locale]/marketplace/dashboard', 'page');
    return { success: true, updated };
}
