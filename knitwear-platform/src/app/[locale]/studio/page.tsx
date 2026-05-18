import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { getMyProjects } from '@/app/actions/editor';
import { ProjectList } from '@/components/studio/ProjectList';
import { Plus } from 'lucide-react';

export default async function StudioPage() {
    const t = await getTranslations('Studio');
    const { projects, error } = await getMyProjects();

    return (
        <div className="min-h-screen bg-cream-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold text-brown-800 font-serif">byKnit Studio</h1>
                        <p className="text-xl text-brown-600 max-w-2xl">
                            당신만의 독특한 뜨개 도안을 만들고 관리하세요. AI 기술로 이미지를 도안으로 변환할 수도 있습니다.
                        </p>
                    </div>
                    <Link href="/editor" className="btn-primary px-8 py-4 rounded-2xl flex items-center gap-3 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                        <Plus size={24} />
                        <span className="text-lg font-bold">새 패턴 만들기</span>
                    </Link>
                </div>

                <div className="space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1.5 bg-sage-500 rounded-full" />
                        <h2 className="text-2xl font-bold text-brown-800">나의 패턴</h2>
                    </div>

                    <ProjectList initialProjects={projects || []} />
                </div>
            </div>
        </div>
    );
}
