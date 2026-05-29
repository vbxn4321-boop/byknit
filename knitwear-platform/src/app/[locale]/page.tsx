import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, Sparkles, Palette, Bot, ShoppingBag, Zap, Globe, Heart, Languages, Calculator } from 'lucide-react';
import { EditorDemo } from '@/components/home/EditorDemo';
import HomeTutorials from '@/components/home/HomeTutorials';
import HomeBlogSection from '@/components/home/HomeBlogSection';
import { createClient } from '@/utils/supabase/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'home' });

    return {
        title: `byKnit - ${t('heroTitle')}`,
        description: t('heroSubtitle'),
    };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'home' });
    const tCommon = await getTranslations({ locale, namespace: 'common' });
    const tNav = await getTranslations({ locale, namespace: 'nav' });
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const features = [
        {
            icon: ShoppingBag,
            titleKey: 'marketplace',
            descKey: 'marketplaceDesc',
            color: 'bg-rose-300',
            href: 'marketplace',
        },
        {
            icon: Palette,
            titleKey: 'editor',
            descKey: 'editorDesc',
            color: 'bg-sage-300',
            href: 'editor',
        },
        {
            icon: Bot,
            titleKey: 'aiGenerator',
            descKey: 'aiDesc',
            color: 'bg-peach-200',
            href: 'ai',
        },
        {
            icon: Languages,
            titleKey: 'aiTranslator',
            descKey: 'translatorDesc',
            color: 'bg-indigo-300',
            href: 'translator',
        },
        {
            icon: Calculator,
            titleKey: 'smartCalculator',
            descKey: 'calculatorDesc',
            color: 'bg-teal-300',
            href: 'calculator',
        },
    ];

    const stats = [
        { value: '10K+', labelKey: 'patterns' },
        { value: '50K+', labelKey: 'creators' },
        { value: '100+', labelKey: 'countries' },
    ];

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden bg-gradient-to-b from-cream-50 to-cream-100">
                {/* Background Decorations */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-rose-300/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-sage-300/20 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-peach-200/15 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
                    <div className="text-center space-y-8">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-tan-200 shadow-soft">
                            <Sparkles className="w-4 h-4 text-rose-400" />
                            <span className="text-sm text-brown-600 font-medium">{t('aiBadge')}</span>
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-brown-700 leading-tight">
                            {t('heroTitle')}
                        </h1>

                        {/* Subtitle */}
                        <p className="max-w-4xl mx-auto text-lg sm:text-xl text-brown-600 leading-relaxed">
                            {t('heroSubtitle')}
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-4 sm:px-0">
                            <Link
                                href={`/${locale}/marketplace`}
                                className="group btn-primary flex justify-center items-center gap-2 text-lg px-8 py-4 w-full sm:w-auto"
                            >
                                {t('explorePatterns')}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href={`/${locale}/editor`}
                                className="btn-secondary flex justify-center items-center gap-2 text-lg px-8 py-4 w-full sm:w-auto"
                            >
                                {t('startCreating')}
                            </Link>
                        </div>

                        {/* Editor Preview Window (Static CSS Mockup) */}
                        <div className="mt-12 md:mt-20 mx-auto max-w-5xl relative px-4 md:px-0">
                            {/* Decorative glow behind the mockup */}
                            <div className="absolute -inset-2 md:-inset-4 bg-gradient-to-r from-rose-200 via-peach-200 to-sage-200 rounded-[2rem] md:rounded-[2.5rem] blur-xl md:blur-2xl opacity-40" />
                            
                            <div className="relative rounded-xl md:rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl md:shadow-2xl overflow-visible">
                                {/* Browser-like Header */}
                                <div className="h-8 md:h-12 border-b border-gray-100/50 bg-white/40 flex items-center px-4 md:px-6 gap-1.5 md:gap-2 rounded-t-xl md:rounded-t-2xl">
                                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-rose-400/80 shadow-sm" />
                                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-peach-400/80 shadow-sm" />
                                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-sage-400/80 shadow-sm" />
                                </div>
                                
                                {/* Content - Using actual app screenshot */}
                                <div className="aspect-[16/9] relative overflow-hidden flex items-center justify-center bg-cream-50 rounded-b-2xl">
                                    <img 
                                        src="/images/tutorials/editor.png" 
                                        alt="byKnit Editor Interface"
                                        className="w-full h-full object-cover object-top"
                                    />
                                </div>

                                {/* Floating Stat Card 1 (Left) */}
                                <div className="absolute -left-8 top-1/4 bg-white/95 backdrop-blur-md px-5 py-4 rounded-2xl shadow-xl border border-white/60 flex items-center gap-4 transform -rotate-3 z-10 transition-transform hover:rotate-0 hover:scale-105 duration-300 hidden md:flex">
                                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shadow-inner">
                                        <Heart className="w-5 h-5 text-rose-500" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Loved by</span>
                                        <span className="text-base font-black text-brown-800">50,000+ Knitters</span>
                                    </div>
                                </div>

                                {/* Floating Stat Card 2 (Right) */}
                                <div className="absolute -right-8 bottom-1/4 bg-white/95 backdrop-blur-md px-5 py-4 rounded-2xl shadow-xl border border-white/60 flex items-center gap-4 transform rotate-3 z-10 transition-transform hover:rotate-0 hover:scale-105 duration-300 hidden md:flex">
                                    <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center shadow-inner">
                                        <ShoppingBag className="w-5 h-5 text-sage-600" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Marketplace</span>
                                        <span className="text-base font-black text-brown-800">10,000+ Patterns</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Tutorials Section */}
            <HomeTutorials locale={locale} />

            {/* Features Section */}
            <section className="relative py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-brown-700 mb-4">
                            {t('features.title')}
                        </h2>
                        <p className="text-brown-600 max-w-2xl mx-auto">
                            {t('features.subtitle')}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {features.map((feature) => (
                            <Link
                                href={`/${locale}/${feature.href}`}
                                key={feature.titleKey}
                                className="group card-cozy p-6 text-center shadow-soft-hover hover:scale-102 hover:border-tan-300 transition-all duration-300 flex flex-col justify-between"
                            >
                                <div>
                                    <div className={`inline-flex p-4 rounded-2xl ${feature.color} mb-6 shadow-soft group-hover:scale-110 transition-transform duration-300`}>
                                        <feature.icon className="w-7 h-7 text-white" />
                                    </div>
                                    <h3 className="text-lg font-bold text-brown-700 mb-3 group-hover:text-rose-500 transition-colors">{tNav(feature.titleKey)}</h3>
                                    <p className="text-sm text-brown-600 leading-relaxed">{t(`features.${feature.descKey}`)}</p>
                                </div>
                                <div className="mt-6 text-xs text-rose-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center justify-center gap-1">
                                    <span>자세히 보기</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Choose Section */}
            <section className="py-20 bg-cream-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <h2 className="text-3xl sm:text-4xl font-bold text-brown-700">
                                {t('whyChoose.title')}
                            </h2>

                            <div className="space-y-10">
                                <div className="flex gap-5 items-start">
                                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-rose-300 flex items-center justify-center shadow-soft transform rotate-3 mt-1">
                                        <Zap className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-brown-800 mb-2">{t('whyChoose.ai.title')}</h3>
                                        <p className="text-brown-600 text-base whitespace-pre-line">{t('whyChoose.ai.desc')}</p>
                                    </div>
                                </div>

                                <div className="flex gap-5 items-start">
                                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-sage-300 flex items-center justify-center shadow-soft transform -rotate-2 mt-1">
                                        <Globe className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-brown-800 mb-2">{t('whyChoose.community.title')}</h3>
                                        <p className="text-brown-600 text-base whitespace-pre-line">{t('whyChoose.community.desc')}</p>
                                    </div>
                                </div>

                                <div className="flex gap-5 items-start">
                                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-peach-200 flex items-center justify-center shadow-soft transform rotate-2 mt-1">
                                        <Sparkles className="w-7 h-7 text-brown-700" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-brown-800 mb-2">{t('whyChoose.tools.title')}</h3>
                                        <p className="text-brown-600 text-base whitespace-pre-line">{t('whyChoose.tools.desc')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Editor Mockup Visual */}
                        <EditorDemo />
                    </div>
                </div>
            </section>

            {/* Blog Section */}
            <HomeBlogSection locale={locale} />

            {/* CTA Section - 로그인하지 않은 유저에게만 노출 */}
            {!user && (
            <section className="py-20 bg-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-300/20 via-peach-200/20 to-sage-300/20 border border-tan-200 p-12 text-center shadow-soft-lg">
                        <div className="relative space-y-6">
                            <div className="inline-flex p-4 rounded-full bg-white shadow-soft mb-4">
                                <Heart className="w-8 h-8 text-rose-400 fill-rose-400" />
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-bold text-brown-700">
                                {t('cta.title')}
                            </h2>
                            <p className="text-brown-600 max-w-xl mx-auto">
                                {t('cta.subtitle')}
                            </p>
                            <Link
                                href={`/${locale}/auth/signup`}
                                className="inline-flex items-center gap-2 btn-primary text-lg px-8 py-4"
                            >
                                <Sparkles className="w-5 h-5" />
                                {tCommon('signUp')}
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
            )}
        </div>
    );
}
