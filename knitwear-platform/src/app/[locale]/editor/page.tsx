import { getTranslations } from 'next-intl/server';
import GridEditor from '@/components/studio/GridEditor';
import EditorTour from '@/components/studio/EditorTour';
import { createClient } from '@/utils/supabase/server';
import { getGridProject } from '@/app/actions/editor';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'editor' });

    return {
        title: `${t('title')} - byKnit`,
        description: 'Create your own knitting patterns with our grid-based pattern editor',
    };
}


export default async function EditorPage({
    params,
    searchParams
}: {
    params: Promise<{ locale: string }>,
    searchParams: Promise<{ id?: string, publish?: string }>
}) {
    const { locale } = await params;
    const { id, publish } = await searchParams;

    // Auth Check
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
                                ? '이 도구(도안 에디터)를 사용하시려면 먼저 로그인을 완료해 주세요.' 
                                : 'Please log in to your account to unlock and use the Pattern Editor.'}
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

    let initialProject = null;
    if (id) {
        const { project } = await getGridProject(id);
        initialProject = project;
    }

    return (
        <>
            <GridEditor
                user={user}
                initialProject={initialProject}
                autoPublish={publish === 'true'}
            />
            <EditorTour />
        </>
    );
}
