
'use server';

import { createClient, createAdminClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { addCredits } from './credits';
import { sendNotification } from './notifications';

// ============================================
// Helper: Map image_url column to images array for frontend compatibility
// ============================================
function mapPostImages(post: any) {
    if (!post) return post;
    return {
        ...post,
        images: post.image_url ? [post.image_url] : []
    };
}

// ============================================
// 게시글 조회 (언어별 필터링 + 도안 정보 JOIN)
// ============================================
export async function getPosts(locale: string = 'ko') {
    const supabase = await createClient();
    const { data, error } = await supabase
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

    return (data || []).map(mapPostImages);
}

// ============================================
// 인기 게시글 조회 (언어 무관, 좋아요 1개 이상 필수)
// ============================================
export async function getPopularPosts(limit: number = 5) {
    const supabase = await createClient();

    // 최근 30일 내 게시글 중 조회
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
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
        .limit(100); // 넉넉하게 100개 조회하여 필터링 범위 확보

    if (error) {
        console.error('Error fetching popular posts:', error);
        return [];
    }

    // 🔒 좋아요가 1개 이상인 게시글만 필터링 후 좋아요순 정렬하여 상위 N개 반환
    return (data || [])
        .filter((p: any) => (p.likes?.[0]?.count || 0) > 0)
        .sort((a: any, b: any) => {
            const aLikes = a.likes?.[0]?.count || 0;
            const bLikes = b.likes?.[0]?.count || 0;
            return bLikes - aLikes;
        })
        .slice(0, limit)
        .map(mapPostImages);
}

// ============================================
// 글 작성 (도안 첨부 시 +50 크레딧 보상)
// ============================================
export async function createPost(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const locale = formData.get('locale') as string || 'ko';
    const category = formData.get('category') as string || 'general';
    const patternId = formData.get('pattern_id') as string || null;
    const imageFile = formData.get('image') as File | null;

    const insertData: any = {
        user_id: user.id,
        title,
        content,
        locale,
        category
    };

    // 도안 첨부가 있는 경우에만 pattern_id 추가
    if (patternId) {
        insertData.pattern_id = patternId;
    }

    // 커버 이미지 업로드 처리
    if (imageFile && typeof imageFile === 'object' && 'size' in imageFile && imageFile.size > 0) {
        try {
            const fileExt = imageFile.name.split('.').pop() || 'png';
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;
            const filePath = `post_${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('community-images')
                .upload(filePath, imageFile, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) {
                console.error('Storage upload error:', uploadError);
            } else {
                const { data: { publicUrl } } = supabase.storage
                    .from('community-images')
                    .getPublicUrl(filePath);

                // posts 테이블은 images text[]가 아니라 image_url text 컬럼을 사용합니다.
                insertData.image_url = publicUrl;
            }
        } catch (uploadException) {
            console.error('Failed to handle image upload:', uploadException);
        }
    }

    const { error } = await supabase
        .from('posts')
        .insert(insertData);

    if (error) {
        console.error('Error creating post:', error);
        throw new Error('Failed to create post');
    }

    // 도안을 첨부한 게시글이면 +50 크레딧 보상 (서버 사이드에서만 처리)
    if (patternId) {
        try {
            await addCredits(user.id, 100, 'Pattern Upload Bonus');
        } catch (creditError) {
            console.error('Failed to award pattern share credits:', creditError);
            // 크레딧 지급 실패해도 게시글은 정상 등록
        }
    }

    // 🔔 팔로워들에게 새 글 알림
    try {
        const { data: followers } = await supabase
            .from('follows')
            .select('follower_id')
            .eq('following_id', user.id);
        if (followers) {
            const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
            const senderName = profile?.display_name || '누군가';
            for (const f of followers) {
                await sendNotification(f.follower_id, user.id, 'new_post', user.id, `${senderName}님이 새 글을 작성했습니다: "${title}"`);
            }
        }
    } catch (e) { /* 알림 실패해도 무시 */ }

    revalidatePath('/', 'layout');
}

// ============================================
// 좋아요 토글
// ============================================
export async function toggleLike(postId: string) {
    const supabase = await createClient();
    const adminClient = await createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

    if (existingLike) {
        await supabase
            .from('post_likes')
            .delete()
            .eq('id', existingLike.id);
    } else {
        await supabase
            .from('post_likes')
            .insert({ post_id: postId, user_id: user.id });

        // 🔔 게시글 작성자에게 좋아요 알림
        try {
            const { data: post } = await adminClient.from('posts').select('user_id, title').eq('id', postId).single();
            if (post && post.user_id !== user.id) {
                const { data: profile } = await adminClient.from('profiles').select('display_name').eq('id', user.id).single();
                const senderName = profile?.display_name || '누군가';
                await sendNotification(post.user_id, user.id, 'like', postId, `${senderName}님이 "${post.title}" 글을 좋아합니다 ♥`);
                
                // 인기 게시물 보상 (+50)
                const { count } = await adminClient.from('post_likes').select('id', { count: 'exact', head: true }).eq('post_id', postId);
                if (count === 10) {
                    const { data: existingReward } = await adminClient.from('credit_transactions')
                        .select('id').eq('user_id', post.user_id).like('description', `%Popular Post%${postId}%`).maybeSingle();
                    
                    if (!existingReward) {
                        await addCredits(post.user_id, 50, `Popular Post Reward (${postId})`);
                    }
                }
            }
        } catch (e) { /* 알림 실패 무시 */ }
    }

    revalidatePath('/', 'layout');
}

// ============================================
// 팔로우 / 언팔로우 토글
// ============================================
export async function toggleFollow(targetUserId: string) {
    const supabase = await createClient();
    const adminClient = await createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');
    if (user.id === targetUserId) throw new Error('Cannot follow yourself');

    const { data: existingFollow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();

    if (existingFollow) {
        // 이미 팔로우 중이면 → 언팔로우
        await supabase
            .from('follows')
            .delete()
            .eq('id', existingFollow.id);
    } else {
        // 팔로우하지 않았으면 → 팔로우
        await supabase
            .from('follows')
            .insert({
                follower_id: user.id,
                following_id: targetUserId
            });

        // 🔔 팔로우 알림
        try {
            const { data: profile } = await adminClient.from('profiles').select('display_name').eq('id', user.id).single();
            const senderName = profile?.display_name || '누군가';
            await sendNotification(targetUserId, user.id, 'follow', user.id, `${senderName}님이 회원님을 팔로우합니다`);
        } catch (e) { /* 알림 실패 무시 */ }
    }

    revalidatePath('/', 'layout');
}

// ============================================
// 팔로우 상태 및 수 조회
// ============================================
export async function getFollowStatus(targetUserId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 팔로워 수 (이 사람을 팔로우하는 사람 수)
    const { count: followerCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId);

    // 팔로잉 수 (이 사람이 팔로우하는 사람 수)
    const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', targetUserId);

    // 내가 이 사람을 팔로우하고 있는지 여부
    let isFollowing = false;
    if (user) {
        const { data: follow } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', targetUserId)
            .single();

        isFollowing = !!follow;
    }

    return {
        followerCount: followerCount || 0,
        followingCount: followingCount || 0,
        isFollowing
    };
}

// ============================================
// 내 도안 목록 조회 (글쓰기 시 도안 선택용)
// ============================================
export async function getMyPatterns() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('patterns')
        .select('id, title, thumbnail_url, images, difficulty, price_usd')
        .eq('designer_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching user patterns:', error);
        return [];
    }

    return data || [];
}

// ============================================
// 게시글 단건 조회 (상세 페이지용)
// ============================================
export async function getPost(postId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
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

    return mapPostImages(data);
}

// ============================================
// 댓글 목록 조회 (답글 포함, 트리 구조)
// ============================================
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

// ============================================
// ============================================
// 댓글 작성 (답글도 동일 함수 사용)
// ============================================
export async function createComment(postId: string, content: string, parentId?: string) {
    const supabase = await createClient();
    const adminClient = await createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const insertData: any = {
        post_id: postId,
        user_id: user.id,
        content
    };

    if (parentId) {
        insertData.parent_id = parentId;
    }

    const { error } = await supabase
        .from('post_comments')
        .insert(insertData);

    if (error) {
        console.error('Error creating comment:', error);
        throw new Error('Failed to create comment');
    }

    // 🔔 댓글/답글 알림
    try {
        const { data: profile } = await adminClient.from('profiles').select('display_name').eq('id', user.id).single();
        const senderName = profile?.display_name || '누군가';

        if (parentId) {
            // 답글 → 원댓글 작성자에게 알림
            const { data: parentComment } = await adminClient.from('post_comments').select('user_id').eq('id', parentId).single();
            if (parentComment && parentComment.user_id !== user.id) {
                await sendNotification(parentComment.user_id, user.id, 'reply', postId, `${senderName}님이 답글을 달았습니다: "${content.slice(0, 30)}"`);
            }
        } else {
            // 댓글 → 게시글 작성자에게 알림
            const { data: post } = await adminClient.from('posts').select('user_id, title').eq('id', postId).single();
            if (post && post.user_id !== user.id) {
                await sendNotification(post.user_id, user.id, 'comment', postId, `${senderName}님이 "${post.title}" 글에 댓글을 달았습니다`);
            }
        }
    } catch (e) { /* 알림 실패 무시 */ }

    revalidatePath(`/community/${postId}`);
    revalidatePath('/', 'layout');
}

// ============================================
// 댓글 삭제 (본인 댓글만)
// ============================================
export async function deleteComment(commentId: string) {
    const supabase = await createClient();
    const adminClient = await createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // Fetch comment to get post_id and user_id for validation
    const { data: comment } = await supabase
        .from('post_comments')
        .select('post_id, user_id')
        .eq('id', commentId)
        .single();

    if (!comment) throw new Error('Comment not found');

    const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const isAdmin = profile?.role === 'admin';

    if (comment.user_id !== user.id && !isAdmin) {
        throw new Error('Unauthorized: 본인의 댓글만 삭제할 수 있습니다.');
    }

    // 관리자라면 adminClient(service_role)를 사용하여 RLS 우회 삭제
    const clientToUse = isAdmin ? adminClient : supabase;
    const deleteQuery = clientToUse
        .from('post_comments')
        .delete()
        .eq('id', commentId);

    if (!isAdmin) {
        deleteQuery.eq('user_id', user.id);
    }

    const { error } = await deleteQuery;

    if (error) {
        console.error('Error deleting comment:', error);
        throw new Error('Failed to delete comment');
    }

    if (comment?.post_id) {
        revalidatePath(`/community/${comment.post_id}`);
    }
    revalidatePath('/', 'layout');
}

// ============================================
// 🔖 북마크 토글
// ============================================
export async function toggleBookmark(postId: string) {
    const supabase = await createClient();
    const adminClient = await createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: existing } = await supabase
        .from('post_bookmarks')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

    if (existing) {
        await adminClient.from('post_bookmarks').delete().eq('id', existing.id);
        return { bookmarked: false };
    } else {
        await adminClient.from('post_bookmarks').insert({ post_id: postId, user_id: user.id });
        return { bookmarked: true };
    }
}

// ============================================
// 🔖 내 북마크 목록 조회
// ============================================
export async function getMyBookmarks() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('post_bookmarks')
        .select('post_id')
        .eq('user_id', user.id);

    if (error) return [];
    return (data || []).map(b => b.post_id);
}

// ============================================
// ❤️ 내가 좋아요 누른 게시글 ID 목록 조회
// ============================================
export async function getMyLikes() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id);

    if (error) {
        console.error('Error fetching liked post IDs:', error);
        return [];
    }
    return (data || []).map(b => b.post_id);
}

// ============================================
// 👥 내가 팔로우한 사용자 ID 목록 조회
// ============================================
export async function getMyFollowings() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

    if (error) {
        console.error('Error fetching followed user IDs:', error);
        return [];
    }
    return (data || []).map(f => f.following_id);
}

// ============================================
// 📊 내 활동 통계 조회 (글 수, 내가 누른 좋아요 수, 내 팔로워 수)
// ============================================
export async function getMyActivityStats() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { postCount: 0, likeCount: 0, followerCount: 0 };
    }

    const [postsRes, likesRes, followersRes] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('post_likes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id)
    ]);

    return {
        postCount: postsRes.count || 0,
        likeCount: likesRes.count || 0,
        followerCount: followersRes.count || 0
    };
}

// ============================================
// 🔍 게시글 검색
// ============================================
export async function searchPosts(query: string, locale: string) {
    const supabase = await createClient();
    const searchTerm = `%${query}%`;

    const { data, error } = await supabase
        .from('posts')
        .select(`
            *,
            profiles:user_id (id, display_name, email),
            likes:post_likes(count),
            comments:post_comments(count),
            pattern:patterns (id, title, thumbnail_url, images, price_usd, difficulty)
        `)
        .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error searching posts:', error);
        return [];
    }

    return (data || []).map(mapPostImages);
}

// ============================================
// ✏️ 게시글 수정
// ============================================
export async function updatePost(postId: string, formData: FormData) {
    const supabase = await createClient();
    const adminClient = await createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // 🔒 권한 검증: 본인 글만 수정 가능
    const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

    if (!post || post.user_id !== user.id) {
        throw new Error('Unauthorized: 본인의 게시글만 수정할 수 있습니다.');
    }

    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const category = formData.get('category') as string;

    const { error } = await supabase
        .from('posts')
        .update({ title, content, category })
        .eq('id', postId);

    if (error) {
        console.error('Error updating post:', error);
        throw new Error('Failed to update post');
    }

    revalidatePath('/', 'layout');
}

// ============================================
// 🗑️ 게시글 삭제
// ============================================
export async function deletePost(postId: string) {
    const supabase = await createClient();
    const adminClient = await createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // 🔒 권한 검증: 본인 글 또는 관리자만 삭제 가능
    const { data: post } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

    if (!post) throw new Error('Post not found');

    const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const isAdmin = profile?.role === 'admin';

    if (post.user_id !== user.id && !isAdmin) {
        throw new Error('Unauthorized: 본인의 게시글만 삭제할 수 있습니다.');
    }

    // 관리자라면 adminClient(service_role)를 사용하여 RLS 우회 삭제
    const clientToUse = isAdmin ? adminClient : supabase;
    const { error } = await clientToUse
        .from('posts')
        .delete()
        .eq('id', postId);

    if (error) {
        console.error('Error deleting post:', error);
        throw new Error('Failed to delete post');
    }

    revalidatePath('/', 'layout');
}

// ============================================
// 📈 조회수 증가 (RPC 또는 직접 UPDATE 안전장치 포함)
// ============================================
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

