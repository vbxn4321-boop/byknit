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
