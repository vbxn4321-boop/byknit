import { createClient } from '@/utils/supabase/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }) {
    const { locale, id } = await params;
    const supabase = await createClient();
    const { data: pattern } = await supabase
        .from('patterns')
        .select('title, description, thumbnail_url')
        .eq('id', id)
        .single();

    if (!pattern) {
        return {
            title: 'Pattern Details - byKnit',
            description: 'View and download knitting pattern',
        };
    }

    const titleStr = typeof pattern.title === 'string'
        ? pattern.title
        : (locale === 'ko'
            ? (pattern.title?.ko || pattern.title?.en)
            : (pattern.title?.en || pattern.title?.ko)) || '뜨개 도안';

    const descStr = typeof pattern.description === 'string'
        ? pattern.description
        : (locale === 'ko'
            ? (pattern.description?.ko || pattern.description?.en)
            : (pattern.description?.en || pattern.description?.ko)) || '바이니트에서 뜨개 도안을 확인해 보세요.';

    const ogImage = pattern.thumbnail_url || 'https://byknit.com/og-image.png';

    return {
        title: `${titleStr} - byKnit`,
        description: descStr,
        openGraph: {
            title: `${titleStr} - byKnit`,
            description: descStr,
            url: `https://byknit.com/${locale}/marketplace/${id}`,
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                    alt: titleStr,
                },
            ],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${titleStr} - byKnit`,
            description: descStr,
            images: [ogImage],
        },
    };
}

import { PatternDetailClient } from '@/components/marketplace/PatternDetailClient';

export default async function PatternDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
    const { locale, id } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return <PatternDetailClient patternId={id} locale={locale} user={user} />;
}
