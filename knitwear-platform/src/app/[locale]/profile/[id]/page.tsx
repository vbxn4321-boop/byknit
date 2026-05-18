
import { createClient } from '@/utils/supabase/server';
import { getDesignerProfile, getFollowStatus } from '@/app/actions/social';
import { PublicProfileClient } from '@/components/profile/PublicProfileClient';
import { redirect, notFound } from 'next/navigation';
import { Pattern } from '@/types';

export default async function PublicProfilePage({
    params
}: {
    params: Promise<{ locale: string; id: string }>
}) {
    const { locale, id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Redirection Check
    if (user && user.id === id) {
        redirect(`/${locale}/marketplace/dashboard`);
    }

    // 2. Fetch Data
    // We can run these in parallel
    const [profileRes, patternsRes, followRes] = await Promise.all([
        getDesignerProfile(id),
        supabase
            .from('patterns')
            .select('*, pattern_likes(count), reviews(count)')
            .eq('designer_id', id)
            .eq('status', 'published')
            .order('created_at', { ascending: false }),
        getFollowStatus(id)
    ]);

    if (profileRes.error || !profileRes.profile) {
        return notFound();
    }

    const profile = profileRes.profile;
    const patterns = (patternsRes.data || []).map((p: any) => ({
        ...p,
        like_count: p.pattern_likes?.[0]?.count || 0,
        review_count: p.reviews?.[0]?.count || 0
    })) as Pattern[];

    return (
        <div className="min-h-screen bg-white">
            <PublicProfileClient
                profile={profile}
                patterns={patterns}
                viewer={user}
                initialIsFollowing={followRes.isFollowing || false}
                locale={locale}
            />
        </div>
    );
}
