'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Trash2, Edit3, ShoppingBag, Clock, Grid } from 'lucide-react';
import { deleteGridProject } from '@/app/actions/editor';
import { useRouter } from 'next/navigation';

interface Project {
    id: string;
    title: string;
    updated_at: string;
    width: number;
    height: number;
    thumbnail_url?: string;
}

interface ProjectListProps {
    initialProjects: Project[];
    locale: string;
}

export function ProjectList({ initialProjects, locale }: ProjectListProps) {
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const router = useRouter();

    const handleDelete = async (id: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        setIsDeleting(id);
        const res = await deleteGridProject(id);
        if (res.success) {
            setProjects(prev => prev.filter(p => p.id !== id));
        } else {
            alert('삭제에 실패했습니다: ' + res.error);
        }
        setIsDeleting(null);
    };

    if (projects.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-tan-300">
                <h3 className="text-xl font-bold text-brown-800 mb-2">저장된 도안이 없습니다</h3>
                <p className="text-brown-600 mb-6">지금 새로운 도안을 만들어보세요!</p>
                <Link href={`/${locale}/editor`} className="btn-primary px-8 py-3 rounded-xl inline-block">
                    새 도안 만들기
                </Link>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
                <div key={project.id} className="bg-white rounded-3xl shadow-soft hover:shadow-lg transition-all border border-tan-200 overflow-hidden group">
                    {/* Thumbnail/Preview */}
                    <div className="aspect-[4/3] bg-cream-100 flex items-center justify-center relative group">
                        {project.thumbnail_url ? (
                            <img src={project.thumbnail_url} alt={project.title} className="w-full h-full object-cover" />
                        ) : (
                            <Grid className="text-tan-300" size={48} />
                        )}
                        <div className="absolute inset-0 bg-brown-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 group-active:opacity-100 touch-none md:touch-auto">
                            <Link href={`/${locale}/editor?id=${project.id}`} className="p-4 bg-white rounded-full text-brown-800 hover:scale-110 active:scale-95 transition-all shadow-lg" title="수정">
                                <Edit3 size={24} />
                            </Link>
                            <button
                                onClick={() => handleDelete(project.id)}
                                disabled={isDeleting === project.id}
                                className="p-4 bg-white rounded-full text-rose-500 hover:scale-110 active:scale-95 transition-all shadow-lg disabled:opacity-50"
                                title="삭제"
                            >
                                <Trash2 size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="p-6 relative">
                        <div className="flex justify-between items-start mb-2 pr-8">
                            <h3 className="font-bold text-brown-800 text-lg truncate flex-1">{project.title}</h3>
                            <span className="text-xs bg-sage-50 text-sage-600 px-2 py-1 rounded-md font-medium">
                                {project.width}x{project.height}
                            </span>
                        </div>

                        {/* Quick Delete for Mobile/Always Visible */}
                        <button
                            onClick={() => handleDelete(project.id)}
                            disabled={isDeleting === project.id}
                            className="absolute top-6 right-6 p-2 text-stone-300 hover:text-rose-500 transition-colors md:hidden"
                            title="삭제"
                        >
                            <Trash2 size={18} />
                        </button>

                        <div className="flex items-center text-brown-500 text-xs gap-4 mb-6">
                            <div className="flex items-center gap-1">
                                <Clock size={14} />
                                {new Date(project.updated_at).toLocaleDateString()}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Link href={`/${locale}/editor?id=${project.id}`} className="btn-secondary py-2 text-sm rounded-xl text-center">
                                수 정
                            </Link>
                            <button
                                onClick={() => router.push(`/${locale}/editor?id=${project.id}&publish=true`)}
                                className="btn-primary py-2 text-sm rounded-xl text-center flex items-center justify-center gap-2"
                            >
                                <ShoppingBag size={14} /> 출 시
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
