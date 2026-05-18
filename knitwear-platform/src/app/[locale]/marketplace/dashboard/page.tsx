
import { createClient } from '@/utils/supabase/server';
import { getTranslations } from 'next-intl/server';
import { ShoppingBag, Star, Plus, Instagram, Edit3, Heart } from 'lucide-react';
import Link from 'next/link';
import { SellerStats } from '@/components/profile/SellerStats';
import { SellerProductGrid } from '@/components/profile/SellerProductGrid';
import { getSellerAnalytics } from '@/app/actions/analytics';

export default async function SellerDashboardPage({
    params
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params;
    const t = await getTranslations('seller');
    const tCommon = await getTranslations('common');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold text-brown-700 mb-4">{t('dashboard')}</h1>
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

    const { data: products } = await supabase
        .from('patterns')
        .select('*')
        .eq('designer_id', user.id)
        .neq('status', 'archived')
        .order('created_at', { ascending: false });

    const { data: reviews } = await supabase
        .from('reviews')
        .select(`
            *,
            patterns!inner(designer_id, title),
            profiles(display_name, avatar_url)
        `)
        .eq('patterns.designer_id', user.id)
        .order('created_at', { ascending: false });

    const avgRating = reviews && reviews.length > 0
        ? (reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    // Fetch real analytics data
    const analytics = await getSellerAnalytics(user.id);

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Instagram-Style Profile Header */}
            <div className="text-center mb-8">
                {/* Avatar Editor */}
                <AvatarEditor
                    currentAvatarUrl={profile?.avatar_url}
                    displayName={profile?.display_name}
                />

                {/* Display Name */}
                <h1 className="text-2xl font-black text-brown-800 mb-1">
                    {profile?.display_name || 'Designer'}
                </h1>

                {/* Rating Badge */}
                {avgRating && (
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 text-rose-500 text-sm font-bold mb-3">
                        <Star className="w-4 h-4 fill-rose-400" />
                        {avgRating}
                    </div>
                )}

                {/* Market Introduction (Editable) */}
                <MarketIntroEditor
                    initialBio={profile?.bio || ''}
                    initialInstagram={profile?.instagram_handle || ''}
                    locale={locale}
                    userId={user.id}
                />
            </div>

            {/* Stats Section (Sales, Views, Likes) - Real data from DB */}
            <div className="mb-10">
                <SellerStats
                    locale={locale}
                    totalSales={analytics.totalSales}
                    totalRevenue={analytics.totalRevenue}
                    totalViews={analytics.totalViews}
                    totalLikes={analytics.totalLikes}
                    totalFollowers={analytics.totalFollowers || 0}
                />
            </div>

            {/* Product Grid Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-brown-700 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-peach-500" />
                    {locale === 'ko' ? '내 작품' : 'My Patterns'}
                    <span className="text-brown-400 font-normal text-sm">({products?.length || 0})</span>
                </h2>
                <CreateProductButton locale={locale} />
            </div>

            {/* Instagram-Style Product Grid */}
            <SellerProductGrid products={products || []} locale={locale} />

            {/* Recent Reviews */}
            {reviews && reviews.length > 0 && (
                <div className="mt-12">
                    <h2 className="text-lg font-bold text-brown-700 flex items-center gap-2 mb-6">
                        <Star className="w-5 h-5 text-rose-400" />
                        {locale === 'ko' ? '최근 리뷰' : 'Recent Reviews'}
                    </h2>
                    <div className="space-y-4">
                        {reviews.slice(0, 3).map((review: any) => (
                            <div key={review.id} className="bg-white p-5 rounded-2xl shadow-soft border border-tan-100">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-peach-100 flex items-center justify-center overflow-hidden">
                                            {review.profiles?.avatar_url ? (
                                                <img src={review.profiles.avatar_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-peach-500 font-bold">{review.profiles?.display_name?.[0] || '?'}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-brown-700">{review.profiles?.display_name || 'Anonymous'}</p>
                                            <p className="text-xs text-brown-400">{review.patterns?.title?.ko || review.patterns?.title?.en}</p>
                                        </div>
                                    </div>
                                    <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                            <Heart key={i} className={`w-4 h-4 ${i < review.rating ? 'text-rose-400 fill-rose-400' : 'text-tan-200'}`} />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-sm text-brown-600">{review.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Client Component for Market Intro Editor
// Client Component for Market Intro Editor
import { MarketIntroEditor } from '@/components/profile/MarketIntroEditor';
import { CreateProductButton } from '@/components/marketplace/CreateProductButton';
import { AvatarEditor } from '@/components/profile/AvatarEditor';
