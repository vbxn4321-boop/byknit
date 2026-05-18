import { createClient } from '@/utils/supabase/server';
import { getTranslations } from 'next-intl/server';
import { MyPageClient } from '@/components/profile/MyPageClient';
import Link from 'next/link';

export default async function ProfilePage({
    params
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params;
    const t = await getTranslations('profile');
    const tCommon = await getTranslations('common');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold text-brown-700 mb-4">{t('title')}</h1>
                <p className="text-brown-500 mb-8">Please sign in to view your profile.</p>
                <Link href={`/${locale}/login`} className="btn-rose rounded-full px-8 py-3 font-bold shadow-soft">
                    {tCommon('signIn')}
                </Link>
            </div>
        );
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // 1. Fetch Order History
    const { data: orders } = await supabase
        .from('orders')
        .select(`
            *,
            patterns (id, title, thumbnail_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    // 2. Fetch Liked/Bookmarked Patterns (찜한 상품)
    const { data: likedPatterns } = await supabase
        .from('pattern_likes')
        .select(`
            id,
            patterns:pattern_id (id, title, thumbnail_url, price_usd, difficulty)
        `)
        .eq('user_id', user.id);

    // 3. Fetch User's Community Posts & Stats (커뮤니티 활동 내역)
    const { data: userPosts } = await supabase
        .from('posts')
        .select(`
            id,
            title,
            views,
            likes:post_likes(count),
            comments:comments(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return (
        <MyPageClient
            profile={profile}
            orders={orders || []}
            likedPatterns={likedPatterns || []}
            userPosts={userPosts || []}
            user={user}
            locale={locale}
            translations={{
                title: t('title'),
                deleteAccount: t('deleteAccount'),
                deleteConfirm: t('deleteConfirm'),
                ordersTab: t('tabs.orders'),
                commentsTab: t('tabs.comments'),
            }}
        />
    );
}
