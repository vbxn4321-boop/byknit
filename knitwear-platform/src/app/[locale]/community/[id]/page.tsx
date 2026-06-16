import { getPost, getComments, incrementPostViews } from '@/utils/community-queries';
import { createClient } from '@/utils/supabase/server';
import { PostDetailClient } from '@/components/community/PostDetailClient';
import { notFound } from 'next/navigation';

import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
    const { locale, id } = await params;
    const post = await getPost(id);

    if (!post) {
        return {
            title: 'Post Details - byKnit',
            description: 'View community post on byKnit',
        };
    }

    const titleStr = post.title || '커뮤니티 게시글';
    const descStr = post.content 
        ? (post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content)
        : '바이니트 커뮤니티에서 유익한 뜨개질 이야기를 확인해 보세요.';

    return {
        title: `${titleStr} - byKnit`,
        description: descStr,
        openGraph: {
            title: `${titleStr} - byKnit`,
            description: descStr,
            url: `https://byknit.com/${locale}/community/${id}`,
            images: [
                {
                    url: 'https://byknit.com/og-image.png',
                    width: 1200,
                    height: 630,
                    alt: titleStr,
                },
            ],
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${titleStr} - byKnit`,
            description: descStr,
            images: ['https://byknit.com/og-image.png'],
        },
    };
}

export default async function PostDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
    const { locale, id } = await params;
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userRole = 'knitter';
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        userRole = profile?.role || 'knitter';
    }

    // 📈 조회수 증가
    await incrementPostViews(id);
    
    const post = await getPost(id);

    if (!post) return notFound();

    const comments = await getComments(id);

    return (
        <PostDetailClient
            post={post as any}
            comments={comments as any}
            user={user}
            userRole={userRole}
            locale={locale}
        />
    );
}
