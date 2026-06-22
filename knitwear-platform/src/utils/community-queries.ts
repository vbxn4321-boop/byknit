import { createClient, createAdminClient } from '@/utils/supabase/server';

export async function getPosts(locale: string = 'ko') {
    const adminClient = await createAdminClient();
    const { data, error } = await adminClient
        .from('posts')
        .select(`
            *,
            profiles:user_id (id, display_name, email),
            likes:post_likes(count),
            comments:post_comments(count),
            pattern:patterns (id, title, thumbnail_url, images, price_usd, difficulty)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching posts:', error);
        return [];
    }

    return data || [];
}

export async function getPopularPosts(limit: number = 5) {
    const adminClient = await createAdminClient();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await adminClient
        .from('posts')
        .select(`
            *,
            profiles:user_id (id, display_name, email),
            likes:post_likes(count),
            comments:post_comments(count),
            pattern:pattern_id (id, title, thumbnail_url, images, price_usd)
        `)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching popular posts:', error);
        return [];
    }

    return (data || [])
        .filter((p: any) => (p.likes?.[0]?.count || 0) > 0)
        .sort((a: any, b: any) => {
            const aLikes = a.likes?.[0]?.count || 0;
            const bLikes = b.likes?.[0]?.count || 0;
            return bLikes - aLikes;
        })
        .slice(0, limit);
}

export async function getPost(postId: string) {
    const adminClient = await createAdminClient();
    const { data, error } = await adminClient
        .from('posts')
        .select(`
            *,
            profiles:user_id (id, display_name, email),
            likes:post_likes(count),
            comments:post_comments(count),
            pattern:patterns (id, title, thumbnail_url, images, price_usd, difficulty)
        `)
        .eq('id', postId)
        .single();

    if (error) {
        console.error('Error fetching post:', error);
        return null;
    }

    return data;
}

export async function getComments(postId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('post_comments')
        .select(`
            *,
            profiles:user_id (id, display_name, email)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching comments:', error);
        return [];
    }

    return data || [];
}

export async function incrementPostViews(postId: string) {
    try {
        const supabase = await createAdminClient();
        const { error } = await supabase.rpc('increment_post_views', { post_id: postId });
        if (error) {
            const { data: post } = await supabase.from('posts').select('views').eq('id', postId).single();
            if (post) {
                await supabase.from('posts').update({ views: (post.views || 0) + 1 }).eq('id', postId);
            }
        }
    } catch (e) {
        console.error('Error incrementing post views:', e);
    }
}
