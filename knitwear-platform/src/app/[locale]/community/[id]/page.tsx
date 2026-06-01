import { getPost, getComments, incrementPostViews } from '@/app/actions/community';
import { createClient } from '@/utils/supabase/server';
import { PostDetailClient } from '@/components/community/PostDetailClient';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PostDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
    const { locale, id } = await params;
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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
            locale={locale}
        />
    );
}
