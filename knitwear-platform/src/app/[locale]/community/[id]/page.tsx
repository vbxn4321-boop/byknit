import { getPost, getComments, incrementPostViews } from '@/app/actions/community';
import { createClient } from '@/utils/supabase/server';
import { PostDetailClient } from '@/components/community/PostDetailClient';
import { notFound } from 'next/navigation';

export default async function PostDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
    const { locale, id } = await params;
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center bg-cream-50 px-4">
                <div className="max-w-md w-full p-8 rounded-3xl bg-white border border-tan-200 shadow-soft text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto shadow-rose-sm">
                        <svg className="w-8 h-8 text-rose-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-extrabold text-brown-800">
                            {locale === 'ko' ? '🔒 로그인이 필요한 장치입니다' : '🔒 Login Required'}
                        </h2>
                        <p className="text-sm text-brown-600 leading-relaxed">
                            {locale === 'ko' 
                                ? '상세 게시글을 조회하시려면 먼저 로그인을 완료해 주세요.' 
                                : 'Please log in to your account to view the full post details.'}
                        </p>
                    </div>
                    <div className="pt-2">
                        <a
                            href={`/${locale}/login`}
                            className="inline-flex items-center justify-center w-full px-6 py-3 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold hover:shadow-rose-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-center"
                        >
                            {locale === 'ko' ? '로그인 하러 가기' : 'Go to Login'}
                        </a>
                    </div>
                </div>
            </div>
        );
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
            locale={locale}
        />
    );
}
