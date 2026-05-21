'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function BlogPage() {
    const t = useTranslations('blog');

    const posts = [
        {
            id: 'launch-announcement',
            slug: 'launch-announcement',
            category: 'news',
            title: 'byKnit 정식 오픈! 모눈종이 없는 디지털 뜨개질의 시작',
            excerpt: '뜨개인들의 필수 플랫폼, byKnit이 드디어 런칭했습니다. 나만의 도안을 만들고, 색상을 입히고, 전 세계 니터들과 공유해 보세요.',
            date: '2026. 05. 21',
            imageUrl: '/blog/thumbnail-1.png'
        },
        {
            id: 'ai-translator-tips',
            slug: 'ai-translator-tips',
            category: 'tip',
            title: '복잡한 k2tog, ssk? AI로 영문 도안 완벽하게 번역하는 꿀팁',
            excerpt: '라벨리에서 산 예쁜 영문 도안, 기호가 너무 복잡해서 포기하셨나요? byKnit의 AI 번역기를 활용하여 10초 만에 한국어 도안으로 바꾸는 방법을 소개합니다.',
            date: '2026. 05. 20',
            imageUrl: '/blog/thumbnail-2.png'
        },
        {
            id: 'pet-colorwork',
            slug: 'pet-colorwork',
            category: 'tutorial',
            title: '내 반려동물 사진을 배색 차트로 바꾸는 마법 같은 방법',
            excerpt: '우리 집 강아지, 고양이 얼굴로 니트 스웨터를 떠보고 싶다면? 이미지 업로드 한 번으로 완벽한 인타르시아 배색 차트를 얻는 과정을 따라해 보세요.',
            date: '2026. 05. 18',
            imageUrl: '/blog/thumbnail-3.png'
        }
    ];

    return (
        <div className="min-h-screen bg-cream-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-brown-800 mb-4">{t('title')}</h1>
                    <p className="text-lg text-brown-600">{t('subtitle')}</p>
                </div>

                {/* Blog Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post) => (
                        <Link href={`./blog/${post.slug}`} key={post.id} className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-soft-md hover:shadow-soft-xl transition-all duration-300 border border-tan-100 hover:-translate-y-1">
                            {/* Thumbnail */}
                            <div className="w-full h-56 overflow-hidden bg-tan-100 relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={post.imageUrl} 
                                    alt={post.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-rose-500 text-xs font-bold rounded-full uppercase tracking-wider shadow-sm">
                                        {t(`categories.${post.category}`)}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Content */}
                            <div className="p-6 flex flex-col flex-grow">
                                <span className="text-sm text-brown-400 mb-2">{post.date}</span>
                                <h2 className="text-xl font-bold text-brown-800 mb-3 group-hover:text-rose-500 transition-colors line-clamp-2">
                                    {post.title}
                                </h2>
                                <p className="text-brown-600 line-clamp-3 mb-4 flex-grow">
                                    {post.excerpt}
                                </p>
                                <div className="text-rose-400 font-medium text-sm flex items-center mt-auto">
                                    {t('readMore')} <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {posts.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-brown-500 text-lg">{t('notFound')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
