'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function BlogPage() {
    const t = useTranslations('blog');
    const params = useParams();
    const locale = (params?.locale as string) || 'en';

    const posts = [
        {
            id: 'launch-announcement',
            slug: 'launch-announcement',
            category: 'news',
            title: locale === 'ko'
                ? 'byKnit 정식 오픈! 모눈종이 없는 디지털 뜨개질의 시작'
                : 'Official Launch of byKnit! The End of Graph Paper, The Start of Digital Knitting',
            excerpt: locale === 'ko'
                ? '뜨개인들의 필수 플랫폼, byKnit이 드디어 런칭했습니다. 나만의 도안을 만들고, 색상을 입히고, 전 세계 니터들과 공유해 보세요.'
                : 'The essential platform for knitters, byKnit, is finally here! Design your own patterns, customize colors, and share them with knitters worldwide.',
            date: '2026. 05. 21',
            imageUrl: '/blog/thumbnail-1.png'
        },
        {
            id: 'ai-translator-tips',
            slug: 'ai-translator-tips',
            category: 'tip',
            title: locale === 'ko'
                ? '복잡한 k2tog, ssk? AI로 영문 도안 완벽하게 번역하는 꿀팁'
                : 'Struggling with k2tog and ssk? Tips to Perfectly Translate Knitting Patterns with AI',
            excerpt: locale === 'ko'
                ? '라벨리에서 산 예쁜 영문 도안, 기호가 너무 복잡해서 포기하셨나요? byKnit의 AI 번역기를 활용하여 10초 만에 한국어 도안으로 바꾸는 방법을 소개합니다.'
                : "Bought a beautiful pattern but gave up because of complex abbreviations? Here is how to use byKnit's AI Translator to convert it into your language in 10 seconds.",
            date: '2026. 05. 20',
            imageUrl: '/blog/thumbnail-2.png'
        },
        {
            id: 'pet-colorwork',
            slug: 'pet-colorwork',
            category: 'tutorial',
            title: locale === 'ko'
                ? '내 반려동물 사진을 배색 차트로 바꾸는 마법 같은 방법'
                : "A Magical Way to Turn Your Pet's Photo Into a Knitting Colorwork Chart",
            excerpt: locale === 'ko'
                ? '우리 집 강아지, 고양이 얼굴로 니트 스웨터를 떠보고 싶다면? 이미지 업로드 한 번으로 완벽한 인타르시아 배색 차트를 얻는 과정을 따라해 보세요.'
                : "Want to knit a paper sweater or cushion with your dog's or cat's face on it? Follow this guide to get a perfect intarsia colorwork chart in one click.",
            date: '2026. 05. 18',
            imageUrl: '/blog/thumbnail-3.png'
        },
        {
            id: 'summer-yarn-guide',
            slug: 'summer-yarn-guide',
            category: 'tip',
            title: locale === 'ko'
                ? '여름 뜨개실의 모든 것: 린넨, 라피아, 코튼 비교 가이드'
                : 'All About Summer Yarn: Comparing Linen, Raffia, and Cotton',
            excerpt: locale === 'ko'
                ? '여름 뜨개질을 준비하는 니터들을 위한 필수 가이드! 시원하고 가벼운 린넨, 여름 모자의 정석 라피아, 그리고 부드러운 코튼 실의 특징과 세탁법을 완벽 비교합니다.'
                : 'Essential guide for knitters preparing summer projects! We compare cool linen, classic raffia for hats, and soft cotton yarn including washing tips.',
            date: '2026. 07. 01',
            imageUrl: 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=600&auto=format&fit=crop'
        },
        {
            id: 'knitting-symbols-guide',
            slug: 'knitting-symbols-guide',
            category: 'tutorial',
            title: locale === 'ko'
                ? '초보 니터를 위한 대바늘 기호 완벽 가이드: 겉뜨기부터 되돌아뜨기까지'
                : 'A Complete Guide to Knitting Symbols for Beginners: From Knit to Short Rows',
            excerpt: locale === 'ko'
                ? '도안 속 외계어 같은 겉뜨기, 안뜨기, 기호들 때문에 머리가 아프신가요? 가장 자주 사용되는 대바늘 기호의 의미와 뜨는 법을 동영상 설명과 함께 쉽게 정리해 드립니다.'
                : 'Confused by knitting charts and symbols? We explain the most common knitting symbols and abbreviations with easy explanations.',
            date: '2026. 06. 30',
            imageUrl: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&auto=format&fit=crop'
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
