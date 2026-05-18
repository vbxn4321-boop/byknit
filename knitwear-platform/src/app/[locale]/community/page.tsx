
import { getPosts, getPopularPosts } from '@/app/actions/community';
import { CommunityClient } from '@/components/community/CommunityClient';
import { createClient } from '@/utils/supabase/server';

export default async function CommunityPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const [posts, popularPosts] = await Promise.all([
        getPosts(locale),
        getPopularPosts(5)
    ]);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <CommunityClient 
            initialPosts={posts as any} 
            popularPosts={popularPosts as any}
            user={user} 
            locale={locale} 
        />
    );
}
