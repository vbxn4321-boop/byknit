'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Search, SlidersHorizontal, X, ChevronDown, Download, Eye, Star, Heart, User as UserIcon, Sparkles, Clock, TrendingUp, Crown, Coins, ChevronRight, Package } from 'lucide-react';
import { CATEGORY_TAXONOMY, YARN_WEIGHTS } from '@/constants/taxonomy';
import type { Pattern, PatternFilters, YarnWeight, Technique, Difficulty } from '@/types';
import { PatternDetailClient } from './PatternDetailClient';
import { PublishPatternModal } from './PublishPatternModal';
import { getDesignerProfile } from '@/app/actions/social';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { DUMMY_PATTERNS } from '@/data/dummyData';

interface MarketplaceClientProps {
    locale: string;
}

type SortOption = 'recommended' | 'newest' | 'popular';

export function MarketplaceClient({ locale }: MarketplaceClientProps) {
    const t = useTranslations('marketplace');
    const tCommunity = useTranslations('community');
    const router = useRouter();
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [isCreditsExpanded, setIsCreditsExpanded] = useState(false);

    const handlePublishClick = () => {
        if (!currentUser) {
            router.push('/login');
        } else {
            setIsPublishModalOpen(true);
        }
    };
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState<PatternFilters>({});
    const [sort, setSort] = useState<SortOption>('recommended');
    const [patterns, setPatterns] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
    const [scopeFilter, setScopeFilter] = useState<'all' | 'official' | 'creators'>('all');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    // Stable random seed for the session (resets on refresh/navigation)
    const [randomSeed] = useState(() => Math.random());

    const supabase = createClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };
        checkUser();
    }, []);

    const fetchPatterns = useCallback(async () => {
        setIsLoading(true);
        try {
            // Using 'get_mk_patterns' with strict parameter matching
            const { data, error } = await supabase.rpc('get_mk_patterns', {
                p_user_id: currentUser?.id || null,
                p_limit: 50,
                p_offset: 0,
                p_category: filters.category || null,
                p_sort: sort,
                p_difficulty: filters.difficulty || null,
                p_yarn_weights: filters.yarnWeight && filters.yarnWeight.length > 0 ? filters.yarnWeight : null,
                p_techniques: filters.techniques && filters.techniques.length > 0 ? filters.techniques : null,
                p_format: null, // Explicitly passing missing parameter
                p_is_free: filters.freeOnly ? true : null,
                p_search_query: searchQuery || null,
                p_random_seed: randomSeed // Pass uniform seed for stable sorting
            });

            if (error) {
                console.error('Error fetching patterns (Details):', JSON.stringify(error, null, 2));
                console.error('Error message:', error.message);
                console.error('Error hint:', error.hint);
                console.error('Error code:', error.code);
                throw error;
            } else {
                setPatterns(data && data.length > 0 ? data : DUMMY_PATTERNS);
            }
        } catch (err) {
            console.error('Failed to fetch patterns via RPC, falling back to direct table query:', err);
            try {
                let query = supabase
                    .from('patterns')
                    .select(`
                        *,
                        designer:designer_id (
                            display_name,
                            avatar_url
                        ),
                        pattern_likes (
                            id,
                            user_id
                        ),
                        reviews (
                            id,
                            rating
                        )
                    `)
                    .eq('status', 'published');

                if (filters.category) {
                    query = query.eq('category', filters.category);
                }
                if (filters.difficulty) {
                    query = query.eq('difficulty', filters.difficulty);
                }
                if (filters.freeOnly) {
                    query = query.eq('price_usd', 0);
                }

                const { data: dbData, error: dbError } = await query;
                if (dbError) throw dbError;

                let processed = (dbData || []).map((p: any) => {
                    const likes = p.pattern_likes || [];
                    const reviews = p.reviews || [];
                    const avgRating = reviews.length > 0
                        ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length
                        : 0;

                    return {
                        ...p,
                        author_name: p.designer?.display_name || 'Designer',
                        author_avatar: p.designer?.avatar_url || null,
                        like_count: likes.length,
                        is_liked: currentUser ? likes.some((l: any) => l.user_id === currentUser.id) : false,
                        review_count: reviews.length,
                        average_rating: avgRating,
                        view_count: p.view_count || 0,
                        download_count: p.download_count || 0
                    };
                });

                const activeYarnWeights = filters.yarnWeight;
                if (activeYarnWeights && activeYarnWeights.length > 0) {
                    processed = processed.filter((p: any) => activeYarnWeights.includes(p.yarn_weight));
                }

                if (searchQuery) {
                    const queryLower = searchQuery.toLowerCase();
                    processed = processed.filter((p: any) => {
                        const titleKo = (typeof p.title === 'object' ? p.title?.ko : p.title)?.toLowerCase() || '';
                        const titleEn = (typeof p.title === 'object' ? p.title?.en : p.title)?.toLowerCase() || '';
                        const descKo = (typeof p.description === 'object' ? p.description?.ko : p.description)?.toLowerCase() || '';
                        const descEn = (typeof p.description === 'object' ? p.description?.en : p.description)?.toLowerCase() || '';
                        return titleKo.includes(queryLower) || titleEn.includes(queryLower) || descKo.includes(queryLower) || descEn.includes(queryLower);
                    });
                }

                if (sort === 'newest') {
                    processed.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                } else if (sort === 'popular') {
                    processed.sort((a: any, b: any) => {
                        const scoreA = (a.like_count * 10) + (a.view_count || 0) + (a.review_count * 20);
                        const scoreB = (b.like_count * 10) + (b.view_count || 0) + (b.review_count * 20);
                        return scoreB - scoreA;
                    });
                } else {
                    processed.sort((a: any, b: any) => {
                        const daysA = Math.max(0, 60 - (Date.now() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24));
                        const scoreA = (daysA / 60.0 * 40) + Math.log(1 + (a.view_count || 0) + (a.like_count * 5) + (a.review_count * 10)) * 10;
                        
                        const daysB = Math.max(0, 60 - (Date.now() - new Date(b.created_at).getTime()) / (1000 * 60 * 60 * 24));
                        const scoreB = (daysB / 60.0 * 40) + Math.log(1 + (b.view_count || 0) + (b.like_count * 5) + (b.review_count * 10)) * 10;
                        
                        return scoreB - scoreA;
                    });
                }

                setPatterns(processed.length > 0 ? processed : DUMMY_PATTERNS);
            } catch (fallbackErr) {
                console.error('Fallback query failed:', fallbackErr);
                setPatterns(DUMMY_PATTERNS);
            }
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, filters, sort, searchQuery, randomSeed]);

    useEffect(() => {
        // Debounce search/fetch
        const timer = setTimeout(() => {
            fetchPatterns();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchPatterns]);

    const yarnWeights: YarnWeight[] = ['lace', 'fingering', 'sport', 'dk', 'worsted', 'aran', 'bulky', 'super_bulky'];
    const techniques: Technique[] = ['stockinette', 'cable', 'colorwork', 'lace', 'brioche', 'mosaic'];
    const difficulties: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

    const toggleFilter = (type: 'yarnWeight' | 'techniques', value: string) => {
        setFilters(prev => {
            const current = prev[type] || [];
            const updated = current.includes(value as never)
                ? current.filter((v: string) => v !== value)
                : [...current, value];
            return { ...prev, [type]: updated as never };
        });
    };

    const sortOptions = [
        { id: 'recommended', label: t('sort.recommended'), icon: Sparkles },
        { id: 'newest', label: t('sort.newest'), icon: Clock },
        { id: 'popular', label: t('sort.popular'), icon: TrendingUp },
    ];

    return (
        <div className="min-h-screen bg-cream-50">
            {/* Header */}
            <div className="bg-gradient-to-b from-cream-100 to-cream-50 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <h1 className="text-3xl sm:text-4xl font-bold text-brown-700">{t('title')}</h1>
                        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                            <button
                                onClick={handlePublishClick}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-soft transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                            >
                                <Package className="w-4 h-4" />
                                <span>{locale === 'ko' ? '도안 판매 및 등록' : 'Sell & Publish'}</span>
                            </button>
                            <Link
                                href={`/${locale}/payments`}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-soft transition-all active:scale-95 whitespace-nowrap cursor-pointer"
                            >
                                <Coins className="w-4 h-4" />
                                <span>{locale === 'ko' ? '크레딧 충전하기' : 'Charge Credits'}</span>
                            </Link>
                        </div>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brown-600/50" />
                                <input
                                    type="text"
                                    placeholder={t('searchPlaceholder')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="input-cozy w-full pl-4 pr-12"
                                />
                            </div>

                            {/* Filter Button */}
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 transition-all font-medium whitespace-nowrap ${isFilterOpen
                                    ? 'bg-rose-300 border-rose-300 text-white'
                                    : 'bg-white border-tan-200 text-brown-600 hover:border-rose-300'
                                    }`}
                            >
                                <SlidersHorizontal className="w-5 h-5" />
                                <span>{t('filter')}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Sort Options (Only show "All Options" when searching, otherwise just indicate Recommended) */}
                        {searchQuery && (
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide animate-in fade-in slide-in-from-top-1">
                                {sortOptions.map((option) => {
                                    const Icon = option.icon;
                                    const isActive = sort === option.id;
                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => setSort(option.id as SortOption)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${isActive
                                                ? 'bg-brown-800 text-white border-brown-800'
                                                : 'bg-white text-brown-600 border-tan-200 hover:border-brown-400'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {!searchQuery && sort !== 'recommended' && (
                            /* Reset hint if user clears search but sort remains */
                            <div className="text-xs text-brown-500 cursor-pointer hover:underline" onClick={() => setSort('recommended')}>
                                {t('backToMarketplace')} ({t('sort.recommended')})
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters Panel */}
            {isFilterOpen && (
                <div className="border-b border-tan-200 bg-white shadow-soft animate-in slide-in-from-top-2 duration-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Category Filter (Dynamic) */}
                            <div className="col-span-2">
                                <h3 className="text-sm font-medium text-brown-700 mb-3">{t('filters.category')}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(CATEGORY_TAXONOMY).map(([key, val]) => (
                                        <button
                                            key={key}
                                            onClick={() => setFilters(prev => ({ ...prev, category: (prev.category === key ? undefined : key) as any }))}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filters.category === key
                                                ? 'bg-rose-400 text-white'
                                                : 'bg-white border border-tan-200 text-brown-600 hover:border-rose-300'
                                                }`}
                                        >
                                            {locale === 'ko' ? val.label.ko : val.label.en}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Difficulty */}
                            <div>
                                <h3 className="text-sm font-medium text-brown-700 mb-3">{t('filters.difficulty')}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {difficulties.map((diff) => (
                                        <button
                                            key={diff}
                                            onClick={() => setFilters(prev => ({ ...prev, difficulty: prev.difficulty === diff ? undefined : diff }))}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filters.difficulty === diff
                                                ? 'bg-sage-400 text-white'
                                                : 'bg-white border border-tan-200 text-brown-600 hover:border-sage-300'
                                                }`}
                                        >
                                            {t(`difficulty.${diff}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Free Only */}
                            <div>
                                <h3 className="text-sm font-medium text-brown-700 mb-3">{t('filters.priceRange')}</h3>
                                <button
                                    onClick={() => setFilters(prev => ({ ...prev, freeOnly: !prev.freeOnly }))}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filters.freeOnly
                                        ? 'bg-peach-400 text-white'
                                        : 'bg-white border border-tan-200 text-brown-600 hover:border-peach-300'
                                        }`}
                                >
                                    {t('filters.freeOnly')}
                                </button>
                            </div>
                        </div>

                        {/* Yarn Weight Filters (Expandable or separate row) */}
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-brown-700 mb-3">{t('filters.yarnWeight')}</h3>
                            <div className="flex flex-wrap gap-2">
                                {YARN_WEIGHTS.map((yw) => (
                                    <button
                                        key={yw.id}
                                        onClick={() => toggleFilter('yarnWeight', yw.id as any)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filters.yarnWeight?.includes(yw.id as any)
                                            ? 'bg-brown-600 text-white'
                                            : 'bg-white border border-tan-200 text-brown-600 hover:border-brown-400'
                                            }`}
                                    >
                                        {yw.label}
                                    </button>
                                ))}
                            </div>

                            {/* Active Filters */}
                            {(filters.difficulty || filters.yarnWeight?.length || filters.techniques?.length || filters.freeOnly) && (
                                <div className="mt-4 pt-4 border-t border-tan-200 flex items-center gap-2 flex-wrap">
                                    <span className="text-sm text-brown-600">Active:</span>
                                    {filters.difficulty && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-300/20 text-rose-400 text-sm font-medium">
                                            {t(`difficulty.${filters.difficulty}`)}
                                            <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, difficulty: undefined }))} />
                                        </span>
                                    )}
                                    {filters.freeOnly && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sage-300/20 text-sage-400 text-sm font-medium">
                                            {t('filters.freeOnly')}
                                            <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, freeOnly: false }))} />
                                        </span>
                                    )}
                                    <button
                                        onClick={() => setFilters({})}
                                        className="text-sm text-brown-600 hover:text-rose-400 underline"
                                    >
                                        Clear all
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Results */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid lg:grid-cols-[1fr_320px] gap-6">
                    {/* Main Results */}
                    <div>
                        {/* Scope Filter Tabs */}
                        <div className="flex border-b border-tan-200 mb-6 gap-6">
                            <button
                                onClick={() => setScopeFilter('all')}
                                className={`pb-3 font-bold text-sm relative transition-all ${
                                    scopeFilter === 'all' 
                                        ? 'text-brown-800' 
                                        : 'text-stone-400 hover:text-stone-600'
                                }`}
                            >
                                {locale === 'ko' ? '전체 상품' : 'All Items'}
                                {scopeFilter === 'all' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full animate-in fade-in duration-200" />
                                )}
                            </button>
                            <button
                                onClick={() => setScopeFilter('official')}
                                className={`pb-3 font-bold text-sm relative transition-all flex items-center gap-1.5 ${
                                    scopeFilter === 'official' 
                                        ? 'text-rose-600 font-extrabold' 
                                        : 'text-stone-400 hover:text-stone-600'
                                }`}
                            >
                                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                                {locale === 'ko' ? 'byKnit 공식' : 'byKnit Official'}
                                {scopeFilter === 'official' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full animate-in fade-in duration-200" />
                                )}
                            </button>
                            <button
                                onClick={() => setScopeFilter('creators')}
                                className={`pb-3 font-bold text-sm relative transition-all ${
                                    scopeFilter === 'creators' 
                                        ? 'text-brown-800' 
                                        : 'text-stone-400 hover:text-stone-600'
                                }`}
                            >
                                {locale === 'ko' ? '작가 도안' : 'Creator Patterns'}
                                {scopeFilter === 'creators' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full animate-in fade-in duration-200" />
                                )}
                            </button>
                        </div>

                        {/* Results Summary */}
                        {(() => {
                            const filteredPatterns = patterns.filter(pattern => {
                                if (scopeFilter === 'official') return pattern.is_official === true;
                                if (scopeFilter === 'creators') return !pattern.is_official;
                                return true;
                            });

                            return (
                                <>
                                    <div className="mb-4 text-sm text-brown-600 flex items-center justify-between">
                                        <span>{filteredPatterns.length} {t('itemsFound')}</span>
                                        {isLoading && <span className="text-brown-400 animate-pulse">Loading...</span>}
                                    </div>

                                    {isLoading && filteredPatterns.length === 0 ? (
                                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                                <div key={i} className="aspect-[3/4] bg-tan-100/50 rounded-2xl animate-pulse" />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                            {filteredPatterns.map((pattern) => (
                                                <div key={pattern.id} onClick={() => setSelectedPatternId(pattern.id)} className="cursor-pointer">
                                                    <PatternCard pattern={pattern} locale={locale} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-5">
                        {/* 추천 크리에이터 (팔로우 추천) */}
                        <div className="bg-white rounded-2xl border border-tan-200 shadow-soft p-5">
                            <h3 className="text-sm font-black text-stone-800 mb-4 flex items-center gap-2">
                                <Crown className="w-4 h-4 text-rose-400" />
                                {tCommunity('sidebar.recommendedDesigners')}
                            </h3>
                            <div className="py-6 text-center">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center mx-auto mb-3">
                                    <UserIcon className="w-5 h-5 text-rose-300" />
                                </div>
                                <p className="text-xs text-stone-400 font-bold whitespace-pre-line">{tCommunity('sidebar.emptyDesigners')}</p>
                            </div>
                        </div>

                        {/* 인기 태그 */}
                        <div className="bg-white rounded-2xl border border-tan-200 shadow-soft p-5">
                            <h3 className="text-sm font-black text-stone-800 mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                {tCommunity('sidebar.popularTags')}
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {['#여름니트', '#대바늘뜨기', '#입문자환영', '#니팅도안', '#KnitWithLove', '#byKnit'].map(tag => (
                                    <span key={tag} className="px-3 py-1.5 rounded-lg bg-stone-50 text-stone-600 text-[11px] font-bold border border-stone-100 hover:border-rose-200 hover:bg-rose-50 cursor-pointer transition-all">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* 크레딧 보상 안내 */}
                        <div id="credit-rewards" className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-2xl p-5 text-white relative overflow-hidden transition-all duration-300 shadow-soft">
                            <div className="relative z-10 text-left">
                                <div 
                                    onClick={() => setIsCreditsExpanded(!isCreditsExpanded)}
                                    className="flex items-center justify-between mb-3 cursor-pointer group/title select-none"
                                >
                                    <h3 className="font-black text-sm flex items-center gap-2 group-hover/title:text-amber-300 transition-colors">
                                        <Coins className="w-4 h-4 text-amber-400 animate-pulse" /> {tCommunity('sidebar.coinRewardInfo')}
                                    </h3>
                                    <button 
                                        type="button"
                                        className="text-stone-400 group-hover/title:text-white transition-all p-1 rounded-lg bg-white/5 hover:bg-white/10 active:scale-90"
                                        aria-label={isCreditsExpanded ? "접기" : "펼치기"}
                                    >
                                        <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isCreditsExpanded ? 'rotate-90 text-amber-300' : ''}`} />
                                    </button>
                                </div>
                                <div className="space-y-2 text-xs text-stone-300">
                                    <div className="flex items-center justify-between bg-white/5 rounded-lg p-2.5 hover:bg-white/10 transition-colors">
                                        <span>{locale === 'ko' ? '가입 축하 적립' : 'Sign Up Bonus'}</span>
                                        <span className="font-black text-amber-400">+1000</span>
                                    </div>
                                    
                                    {isCreditsExpanded && (
                                        <>
                                            <div className="flex items-center justify-between bg-white/5 rounded-lg p-2.5 hover:bg-white/10 transition-colors animate-in fade-in slide-in-from-top-1 duration-200">
                                                <span>{locale === 'ko' ? '추천인/가입자 보너스' : 'Referral Bonus'}</span>
                                                <span className="font-black text-amber-400">+100</span>
                                            </div>
                                            <div className="flex items-center justify-between bg-white/5 rounded-lg p-2.5 hover:bg-white/10 transition-colors animate-in fade-in slide-in-from-top-1 duration-200">
                                                <span>{locale === 'ko' ? '마켓플레이스 도안 다운로드' : 'Marketplace Download'}</span>
                                                <span className="font-black text-amber-400">+10</span>
                                            </div>
                                            <div className="flex items-center justify-between bg-white/5 rounded-lg p-2.5 hover:bg-white/10 transition-colors animate-in fade-in slide-in-from-top-1 duration-200">
                                                <span>{locale === 'ko' ? '마켓플레이스 도안 좋아요' : 'Marketplace Like'}</span>
                                                <span className="font-black text-amber-400">+1</span>
                                            </div>
                                            <div className="flex items-center justify-between bg-white/5 rounded-lg p-2.5 hover:bg-white/10 transition-colors animate-in fade-in slide-in-from-top-1 duration-200">
                                                <span>{locale === 'ko' ? '커뮤니티 인기게시물 선정' : 'Popular Community Post'}</span>
                                                <span className="font-black text-amber-400">+50</span>
                                            </div>
                                        </>
                                    )}

                                    <div className="flex items-center justify-between bg-white/5 rounded-lg p-2.5 hover:bg-white/10 transition-colors">
                                        <span>{locale === 'ko' ? '도안 업로드 보너스' : 'Pattern Upload Bonus'}</span>
                                        <span className="font-black text-amber-400">+100</span>
                                    </div>

                                    {isCreditsExpanded && (
                                        <>
                                            <div className="flex items-center justify-between bg-white/5 rounded-lg p-2.5 hover:bg-white/10 transition-colors animate-in fade-in slide-in-from-top-1 duration-200">
                                                <span>{locale === 'ko' ? '차트변환 파일 내보내기' : 'Chart Export'}</span>
                                                <span className="font-black text-rose-400">-50</span>
                                            </div>
                                            <div className="flex items-center justify-between bg-white/5 rounded-lg p-2.5 hover:bg-white/10 transition-colors animate-in fade-in slide-in-from-top-1 duration-200">
                                                <span>{locale === 'ko' ? '도안에디터 파일 내보내기' : 'Editor Export'}</span>
                                                <span className="font-black text-rose-400">-50</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <Package className="absolute -right-4 -bottom-4 w-20 h-20 text-white/5 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Pattern Detail Modal */}
            {selectedPatternId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-brown-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
                        <button
                            onClick={() => {
                                setSelectedPatternId(null);
                                fetchPatterns(); // Refresh stats on close
                            }}
                            className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-brown-600 shadow-md transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <div className="flex-1 overflow-y-auto">
                            <PatternDetailClient
                                patternId={selectedPatternId}
                                locale={locale}
                                user={currentUser}
                                isModal={true}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Publish Pattern Modal */}
            {isPublishModalOpen && (
                <PublishPatternModal
                    isOpen={isPublishModalOpen}
                    onClose={() => {
                        setIsPublishModalOpen(false);
                        fetchPatterns(); // Refresh patterns list
                    }}
                    locale={locale}
                />
            )}
        </div>
    );
}

function PatternCard({ pattern, locale }: { pattern: any; locale: string }) {
    const t = useTranslations('marketplace');
    const title = pattern.title && (typeof pattern.title === 'object' ? (locale === 'ko' ? pattern.title.ko : pattern.title.en) : pattern.title);

    return (
        <div className="group card-cozy overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300 bg-white rounded-2xl border border-tan-200/60 h-full flex flex-col relative will-change-transform">
            {/* Image Container */}
            <div className="aspect-square relative overflow-hidden bg-tan-100/30">
                <img
                    src={pattern.images?.[0] || 'https://picsum.photos/400/400'}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brown-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                    {pattern.is_official && (
                        <span className="bg-gradient-to-r from-rose-500 to-amber-500 text-white px-2 py-0.5 rounded shadow-sm font-black text-[9px] uppercase tracking-wider flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-300 fill-amber-300" />
                            {locale === 'ko' ? '공식' : 'Official'}
                        </span>
                    )}
                    <span className={`px-2 py-1 rounded shadow-sm font-bold text-[10px] ${
                        pattern.item_type === 'physical' 
                            ? 'bg-sage-600 text-white border border-sage-500'
                            : 'bg-brown-800 text-white border border-brown-700'
                    }`}>
                        {pattern.item_type === 'physical' ? t('physical') : t('digital')}
                    </span>
                    {pattern.is_on_sale && (
                        <span className="bg-rose-500 text-white px-2.5 py-0.5 rounded-full shadow-sm uppercase font-black text-[10px] animate-pulse">
                            Sale {pattern.discount_percentage}%
                        </span>
                    )}
                </div>

                {/* Price Tag - Floating Bottom Right */}
                <div className="absolute bottom-3 right-3 z-10">
                    {pattern.is_free || Number(pattern.price_usd) === 0 ? (
                        <span className="glass-premium px-3 py-1 rounded-full shadow-sm text-sage-600 font-bold text-xs backdrop-blur-md border border-white/50">
                            {t('free')}
                        </span>
                    ) : (
                        <span className="glass-premium px-3 py-1 rounded-full shadow-sm text-brown-800 font-bold text-xs backdrop-blur-md border border-white/50">
                            {(Number(pattern.price_usd) * 1000).toLocaleString()} {locale === 'ko' ? '크레딧' : 'Credits'}
                        </span>
                    )}
                </div>
            </div>

            {/* Content - Overlapping Avatar for Density */}
            <div className="p-4 pt-5 flex-1 flex flex-col justify-between relative">
                {/* Floating Avatar */}
                <div className="absolute -top-6 left-4 w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-soft z-20 bg-cream-100 flex items-center justify-center">
                    {pattern.is_official ? (
                        <div className="w-full h-full bg-gradient-to-br from-rose-400 to-amber-400 flex items-center justify-center text-white">
                            <Crown className="w-5 h-5 fill-amber-100" />
                        </div>
                    ) : pattern.author_avatar ? (
                        <img src={pattern.author_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon className="w-full h-full p-2 text-brown-400" />
                    )}
                </div>

                <div className="space-y-1 mt-1">
                    <div className="flex justify-end mb-1">
                        <span className="text-[10px] text-brown-400 font-medium">
                            {pattern.is_official ? (locale === 'ko' ? 'byKnit 공식' : 'byKnit Official') : (pattern.author_name || 'Designer')}
                        </span>
                    </div>
                    <h3 className="font-bold text-brown-800 text-lg leading-tight group-hover:text-rose-500 transition-colors line-clamp-1">
                        {title || 'Untitled Pattern'}
                    </h3>

                    {/* Replaced Designer Name logic with explicit layout above to save vertical space */}
                </div>

                {/* Stats Footer - Compact */}
                <div className="flex items-center justify-between text-xs text-brown-500/80 pt-3 mt-3 border-t border-tan-100/50">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-medium text-amber-500/90">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            {pattern.average_rating ? pattern.average_rating.toFixed(1) : '0.0'}
                        </span>
                        <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-brown-400" />
                            {pattern.view_count ? (pattern.view_count > 1000 ? `${(pattern.view_count / 1000).toFixed(1)}k` : pattern.view_count) : 0}
                        </span>
                        <span className="flex items-center gap-1">
                            <Download className="w-3.5 h-3.5 text-brown-400" />
                            {pattern.download_count ? (pattern.download_count > 1000 ? `${(pattern.download_count / 1000).toFixed(1)}k` : pattern.download_count) : 0}
                        </span>
                    </div>

                    <div className="flex items-center gap-1 group/like">
                        <Heart className={`w-4 h-4 transition-transform group-hover/like:scale-110 ${pattern.is_liked ? 'text-rose-500 fill-rose-500' : 'text-brown-300 group-hover:text-rose-400'}`} />
                        <span className="text-brown-400">{pattern.like_count || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
