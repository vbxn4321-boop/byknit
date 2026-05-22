
'use client';

import { useState, useEffect } from 'react';
import { 
    MessageSquare, Sparkles, Heart, Eye,
    Plus, User as UserIcon, Globe, LayoutGrid,
    Package, UserPlus, UserCheck, TrendingUp, Crown,
    Coins, PenTool, ChevronRight, Search, Bookmark, BookmarkCheck, X
} from 'lucide-react';
import { 
    toggleLike, toggleFollow, toggleBookmark, searchPosts, getMyBookmarks,
    getMyLikes, getMyFollowings, getMyActivityStats
} from '@/app/actions/community';
import { User } from '@supabase/supabase-js';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { DUMMY_COMMUNITY_POSTS } from '@/data/dummyData';

interface Post {
    id: string;
    title: string;
    content: string;
    created_at: string;
    locale: string;
    category: string;
    profiles: { id: string; display_name: string; email: string };
    likes: { count: number }[];
    comments: { count: number }[];
    views: number;
    images?: string[] | null;
    pattern: {
        id: string;
        title: any;
        thumbnail_url: string | null;
        images: string[] | null;
        price_usd: number;
        difficulty: string;
    } | null;
}

interface CommunityClientProps {
    initialPosts: Post[];
    popularPosts: Post[];
    user: User | null;
    locale: string;
}

export function CommunityClient({ initialPosts, popularPosts, user, locale }: CommunityClientProps) {
    const t = useTranslations('community');
    const tCommon = useTranslations('common');

    const [posts, setPosts] = useState<Post[]>(initialPosts && initialPosts.length > 0 ? initialPosts : DUMMY_COMMUNITY_POSTS as any);
    const [activeTab, setActiveTab] = useState(locale);
    const [listFilter, setListFilter] = useState<'latest' | 'popular' | 'my_activity'>('latest');
    const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<Post[] | null>(null);
    const [bookmarkSet, setBookmarkSet] = useState<Set<string>>(new Set());
    const [likedSet, setLikedSet] = useState<Set<string>>(new Set());
    const [myStats, setMyStats] = useState({ postCount: 0, likeCount: 0, followerCount: 0 });
    const [isCoinsExpanded, setIsCoinsExpanded] = useState(false);

    // Sync initialPosts to state when it changes
    useEffect(() => {
        setPosts(initialPosts && initialPosts.length > 0 ? initialPosts : DUMMY_COMMUNITY_POSTS as any);
    }, [initialPosts]);

    // 북마크, 좋아요, 팔로잉 목록 및 내 활동 통계 불러오기
    useEffect(() => {
        if (user) {
            getMyBookmarks().then(ids => setBookmarkSet(new Set(ids)));
            getMyLikes().then(ids => setLikedSet(new Set(ids)));
            getMyFollowings().then(ids => setFollowingSet(new Set(ids)));
            getMyActivityStats().then(stats => setMyStats(stats));
        }
    }, [user]);

    const displayPosts = searchResults !== null 
        ? searchResults 
        : (() => {
            if (listFilter === 'my_activity') {
                if (!user) return [];
                return posts.filter(p => 
                    p.profiles?.id === user.id || 
                    likedSet.has(p.id) || 
                    bookmarkSet.has(p.id)
                );
            }

            let filtered = [...posts];

            if (listFilter === 'popular') {
                // 🔒 좋아요가 1개 이상 달린 게시글만 노출
                filtered = filtered.filter(p => (p.likes?.[0]?.count || 0) > 0);
                
                filtered = [...filtered].sort((a, b) => {
                    const aLikes = a.likes?.[0]?.count || 0;
                    const bLikes = b.likes?.[0]?.count || 0;
                    return bLikes - aLikes;
                });
            }
            return filtered;
        })();

    const getPatternTitle = (title: any): string => {
        if (!title) return 'Untitled';
        if (typeof title === 'string') return title;
        return title[locale] || title.ko || title.en || 'Untitled';
    };

    const getPatternImage = (pattern: Post['pattern']): string | null => {
        if (!pattern) return null;
        return pattern.thumbnail_url || (pattern.images && pattern.images[0]) || null;
    };

    const handleFollow = async (targetUserId: string) => {
        if (!user) return;
        try {
            await toggleFollow(targetUserId);
            setFollowingSet(prev => {
                const next = new Set(prev);
                if (next.has(targetUserId)) next.delete(targetUserId);
                else next.add(targetUserId);
                return next;
            });
        } catch (error) {
            console.error('Follow error:', error);
        }
    };

    const handleLike = async (postId: string) => {
        if (!user) return;
        try {
            const isLiking = !likedSet.has(postId);
            
            // Optimistically update likedSet & stats
            setLikedSet(prev => {
                const next = new Set(prev);
                if (isLiking) {
                    next.add(postId);
                    setMyStats(s => ({ ...s, likeCount: s.likeCount + 1 }));
                } else {
                    next.delete(postId);
                    setMyStats(s => ({ ...s, likeCount: Math.max(0, s.likeCount - 1) }));
                }
                return next;
            });

            // Optimistically update local posts array
            setPosts(prevPosts => 
                prevPosts.map(p => {
                    if (p.id === postId) {
                        const currentLikes = p.likes?.[0]?.count || 0;
                        return {
                            ...p,
                            likes: [{ count: isLiking ? currentLikes + 1 : Math.max(0, currentLikes - 1) }]
                        };
                    }
                    return p;
                })
            );

            await toggleLike(postId);
        } catch (error) {
            console.error('Like error:', error);
        }
    };

    const getCategoryLabel = (cat: string) => {
        return t(`categories.${cat}`, { defaultValue: cat });
    };

    const getCategoryColor = (cat: string) => {
        const map: Record<string, string> = {
            general: 'bg-stone-100 text-stone-600',
            showcase: 'bg-rose-50 text-rose-600',
            qna: 'bg-sky-50 text-sky-600',
            tip: 'bg-amber-50 text-amber-600'
        };
        return map[cat] || 'bg-stone-100 text-stone-600';
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return t('time.justNow');
        if (mins < 60) return t('time.minutesAgo', { count: mins });
        const hours = Math.floor(mins / 60);
        if (hours < 24) return t('time.hoursAgo', { count: hours });
        const days = Math.floor(hours / 24);
        if (days < 7) return t('time.daysAgo', { count: days });
        return `${date.getMonth() + 1}.${date.getDate()}`;
    };

    return (
        <div className="min-h-screen bg-cream-50 pb-20">
            {/* Compact Header */}
            <div className="bg-white border-b border-tan-200 py-8 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-black text-stone-800">
                                {t('title')}
                            </h1>
                            <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-500 text-[10px] font-black uppercase tracking-wider border border-rose-100">
                                {t('postsCount', { count: displayPosts.length })}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {/* Write Button */}
                            <Link 
                                href="/community/write"
                                className="flex items-center gap-2 px-5 py-2.5 bg-stone-800 text-white font-bold text-sm rounded-xl hover:bg-rose-500 transition-all shadow-lg active:scale-95"
                            >
                                <PenTool className="w-4 h-4" />
                                <span>{t('writePost')}</span>
                                {!user && (
                                    <span className="text-rose-400 font-black text-xs -translate-y-1" title={locale === 'ko' ? '로그인 필요' : 'Requires Login'}>
                                        *
                                    </span>
                                )}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                <div className="grid lg:grid-cols-[1fr_320px] gap-6">
                    {/* ===== Main: Board-style List ===== */}
                    <div>
                        {/* 검색바 */}
                        <div className="mb-4 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter' && searchQuery.trim()) {
                                            setIsSearching(true);
                                            const results = await searchPosts(searchQuery.trim(), activeTab);
                                            setSearchResults(results as Post[]);
                                            setIsSearching(false);
                                        }
                                    }}
                                    placeholder={t('searchPlaceholder')}
                                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-tan-200 rounded-xl focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all text-stone-800 placeholder:text-stone-400"
                                />
                            </div>
                            {searchResults !== null && (
                                <button
                                    onClick={() => { setSearchResults(null); setSearchQuery(''); }}
                                    className="flex items-center gap-1.5 px-4 py-2.5 bg-stone-100 text-stone-600 font-bold text-xs rounded-xl hover:bg-stone-200 transition-all"
                                >
                                    <X className="w-3.5 h-3.5" /> {tCommon('reset')}
                                </button>
                            )}
                        </div>

                        {/* 게시판 필터 탭 */}
                        <div className="flex gap-1.5 mb-4 bg-white p-1 rounded-xl border border-tan-200 shadow-sm">
                            <button
                                onClick={() => setListFilter('latest')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs transition-all ${
                                    listFilter === 'latest'
                                        ? 'bg-stone-800 text-white shadow-md'
                                        : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
                                }`}
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>{t('filters.latest')}</span>
                            </button>
                            <button
                                onClick={() => setListFilter('popular')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs transition-all ${
                                    listFilter === 'popular'
                                        ? 'bg-stone-800 text-white shadow-md'
                                        : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
                                }`}
                            >
                                <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                                <span>{t('filters.popular')}</span>
                            </button>
                            {user && (
                                <button
                                    onClick={() => setListFilter('my_activity')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs transition-all ${
                                        listFilter === 'my_activity'
                                            ? 'bg-stone-800 text-white shadow-md'
                                            : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
                                    }`}
                                >
                                    <UserIcon className="w-3.5 h-3.5 text-sky-400" />
                                    <span>{t('filters.myActivity')}</span>
                                </button>
                            )}
                        </div>

                        {/* Board Table */}
                        <div className="bg-white rounded-2xl border border-tan-200 shadow-soft overflow-hidden">
                            {/* Table Header */}
                            <div className="grid grid-cols-[70px_1fr_90px_70px_50px_50px_50px_40px] items-center px-4 py-3 bg-stone-50 border-b border-stone-100 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                                <span className="text-center">{t('table.category')}</span>
                                <span>{t('table.title')}</span>
                                <span>{t('table.author')}</span>
                                <span className="text-center">{t('table.date')}</span>
                                <span className="text-center flex items-center justify-center gap-1"><Heart className="w-3.5 h-3.5" /></span>
                                <span className="text-center flex items-center justify-center gap-1"><MessageSquare className="w-3.5 h-3.5" /></span>
                                <span className="text-center flex items-center justify-center gap-1"><Eye className="w-3.5 h-3.5" /></span>
                                <span className="text-center"><Bookmark className="w-3.5 h-3.5 mx-auto" /></span>
                            </div>

                            {/* Post Rows */}
                            {displayPosts.length > 0 ? (
                                displayPosts.map((post, idx) => (
                                    <div 
                                        key={post.id} 
                                        className={`group grid grid-cols-[70px_1fr_90px_70px_50px_50px_50px_40px] items-center px-4 py-3.5 border-b border-stone-50 last:border-none hover:bg-cream-50/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-stone-50/30'}`}
                                    >
                                        {/* Category */}
                                        <div className="flex justify-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getCategoryColor(post.category)}`}>
                                                {getCategoryLabel(post.category)}
                                            </span>
                                        </div>

                                        {/* Title + Badges + Thumbnail */}
                                        <div className="flex items-center gap-3 min-w-0 pr-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <Link href={`/community/${post.id}`} className="font-bold text-stone-800 text-sm truncate group-hover:text-rose-500 transition-colors cursor-pointer">
                                                        {post.title}
                                                    </Link>
                                                    {/* Credit Badge */}
                                                    {post.pattern && (
                                                        <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-600 text-[9px] font-black">
                                                            <Coins className="w-2.5 h-2.5" /> +50
                                                        </span>
                                                    )}
                                                    {/* Comment count badge */}
                                                    {(post.comments?.[0]?.count || 0) > 0 && (
                                                        <span className="flex-shrink-0 text-[10px] font-bold text-rose-400">
                                                            [{post.comments[0].count}]
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Pattern name preview */}
                                                {post.pattern && (
                                                    <p className="text-[10px] text-stone-400 mt-0.5 truncate">
                                                        📎 {getPatternTitle(post.pattern.title)}
                                                    </p>
                                                )}
                                            </div>
                                            {/* Thumbnail */}
                                            {post.pattern && getPatternImage(post.pattern) && (
                                                <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-stone-100">
                                                    <img 
                                                        src={getPatternImage(post.pattern)!} 
                                                        alt="" 
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Author + Follow */}
                                        <div className="flex items-center gap-1 min-w-0">
                                            <span className="text-xs text-stone-500 truncate">
                                                {post.profiles?.display_name || 'Anonymous'}
                                            </span>
                                            {user && post.profiles?.id && user.id !== post.profiles.id && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleFollow(post.profiles.id); }}
                                                    className="flex-shrink-0"
                                                >
                                                    {followingSet.has(post.profiles.id) ? (
                                                        <UserCheck className="w-3 h-3 text-rose-400" />
                                                    ) : (
                                                        <UserPlus className="w-3 h-3 text-stone-300 hover:text-rose-400 transition-colors" />
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {/* Date */}
                                        <span className="text-[11px] text-stone-400 text-center">{formatDate(post.created_at)}</span>

                                        {/* Likes */}
                                        <div className="flex justify-center">
                                            <button 
                                                onClick={() => handleLike(post.id)}
                                                className={`flex items-center gap-1 transition-colors ${
                                                    likedSet.has(post.id) ? 'text-rose-500' : 'text-stone-400 hover:text-rose-500'
                                                }`}
                                            >
                                                <Heart className={`w-3.5 h-3.5 ${likedSet.has(post.id) ? 'fill-rose-500' : ''}`} />
                                                <span className="text-[11px] font-bold">{post.likes?.[0]?.count || 0}</span>
                                            </button>
                                        </div>

                                        {/* Comments */}
                                        <div className="flex items-center justify-center gap-1 text-stone-400">
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-bold">{post.comments?.[0]?.count || 0}</span>
                                        </div>

                                        {/* Views */}
                                        <div className="flex items-center justify-center gap-1 text-stone-400">
                                            <Eye className="w-3.5 h-3.5" />
                                            <span className="text-[11px] font-bold">{post.views || 0}</span>
                                        </div>

                                        {/* Bookmark */}
                                        <div className="flex justify-center">
                                            {user && (
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        await toggleBookmark(post.id);
                                                        setBookmarkSet(prev => {
                                                            const next = new Set(prev);
                                                            if (next.has(post.id)) next.delete(post.id);
                                                            else next.add(post.id);
                                                            return next;
                                                        });
                                                    }}
                                                    className="text-stone-300 hover:text-amber-500 transition-colors"
                                                >
                                                    {bookmarkSet.has(post.id) ? (
                                                        <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                                    ) : (
                                                        <Bookmark className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                /* Empty State */
                                <div className="py-20 text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-cream-100 flex items-center justify-center mx-auto mb-4">
                                        {listFilter === 'my_activity' ? (
                                            <UserIcon className="w-7 h-7 text-sky-300" />
                                        ) : listFilter === 'popular' ? (
                                            <TrendingUp className="w-7 h-7 text-rose-300" />
                                        ) : (
                                            <MessageSquare className="w-7 h-7 text-rose-300" />
                                        )}
                                    </div>
                                    <p className="font-bold text-stone-700 mb-1">
                                        {listFilter === 'my_activity' 
                                            ? (activeTab === 'ko' ? '아직 활동 내역이 없습니다' : 'No activity history yet') 
                                            : listFilter === 'popular' 
                                            ? (activeTab === 'ko' ? '인기 게시글이 없습니다' : 'No popular posts found') 
                                            : (activeTab === 'ko' ? '아직 게시글이 없습니다' : 'No posts found')
                                        }
                                    </p>
                                    <p className="text-sm text-stone-400 mb-6">
                                        {listFilter === 'my_activity'
                                            ? (activeTab === 'ko' ? '커뮤니티 글을 작성하거나, 좋아요/북마크를 남겨보세요!' : 'Write community posts or leave likes/bookmarks!')
                                            : (activeTab === 'ko' ? '첫 번째 이야기를 들려주세요!' : 'Be the first to share a story!')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ===== Sidebar ===== */}
                    <div className="space-y-5">
                        {/* 인기 게시글 (언어 통합) */}
                        {popularPosts.length > 0 && (
                            <div className="bg-white rounded-2xl border border-tan-200 shadow-soft p-5">
                                <h3 className="text-sm font-black text-stone-800 mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-rose-400" />
                                    {t('filters.popular')}
                                    <span className="ml-auto text-[9px] font-black text-stone-300 uppercase tracking-widest">All Languages</span>
                                </h3>
                                <div className="space-y-3">
                                    {popularPosts.slice(0, 5).map((post, idx) => (
                                        <div key={post.id} className="flex items-start gap-2.5 group cursor-pointer">
                                            <span className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-black ${
                                                idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-stone-100 text-stone-500' : 'bg-stone-50 text-stone-400'
                                            }`}>
                                                {idx + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-stone-700 truncate group-hover:text-rose-500 transition-colors">
                                                    {post.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-stone-400">{post.profiles?.display_name || '-'}</span>
                                                    <span className="flex items-center gap-0.5 text-[10px] text-rose-400 font-bold">
                                                        <Heart className="w-2.5 h-2.5" /> {post.likes?.[0]?.count || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 내 활동 */}
                        {user && (
                            <div className="bg-white rounded-2xl border border-tan-200 shadow-soft p-5">
                                <h3 className="text-sm font-black text-stone-800 mb-4 flex items-center gap-2">
                                    <UserIcon className="w-4 h-4 text-stone-400" />
                                    {t('sidebar.myStats')}
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    <div 
                                        onClick={() => setListFilter('my_activity')}
                                        className="text-center p-3 bg-stone-50 hover:bg-rose-50/50 rounded-xl cursor-pointer transition-colors"
                                    >
                                        <p className="text-lg font-black text-stone-800">{myStats.postCount}</p>
                                        <p className="text-[10px] text-stone-400 font-bold">{t('sidebar.posts')}</p>
                                    </div>
                                    <div 
                                        onClick={() => setListFilter('my_activity')}
                                        className="text-center p-3 bg-stone-50 hover:bg-rose-50/50 rounded-xl cursor-pointer transition-colors"
                                    >
                                        <p className="text-lg font-black text-stone-800">{myStats.likeCount}</p>
                                        <p className="text-[10px] text-stone-400 font-bold">{t('sidebar.likes')}</p>
                                    </div>
                                    <div className="text-center p-3 bg-stone-50 rounded-xl">
                                        <p className="text-lg font-black text-stone-800">{myStats.followerCount}</p>
                                        <p className="text-[10px] text-stone-400 font-bold">{t('sidebar.followers')}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 인기 태그 */}
                        <div className="bg-white rounded-2xl border border-tan-200 shadow-soft p-5">
                            <h3 className="text-sm font-black text-stone-800 mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                {t('sidebar.popularTags')}
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {['#여름니트', '#대바늘뜨기', '#입문자환영', '#니팅도안', '#KnitWithLove', '#byKnit'].map(tag => (
                                    <span key={tag} className="px-3 py-1.5 rounded-lg bg-stone-50 text-stone-600 text-[11px] font-bold border border-stone-100 hover:border-rose-200 hover:bg-rose-50 cursor-pointer transition-all">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* 추천 도아너 (팔로우 추천) */}
                        <div className="bg-white rounded-2xl border border-tan-200 shadow-soft p-5">
                            <h3 className="text-sm font-black text-stone-800 mb-4 flex items-center gap-2">
                                <Crown className="w-4 h-4 text-rose-400" />
                                {t('sidebar.recommendedDesigners')}
                            </h3>
                            <div className="py-6 text-center">
                                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center mx-auto mb-3">
                                    <UserIcon className="w-5 h-5 text-rose-300" />
                                </div>
                                <p className="text-xs text-stone-400 font-bold whitespace-pre-line">{t('sidebar.emptyDesigners')}</p>
                            </div>
                        </div>

                        {/* 코인 보상 안내 */}
                        <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-2xl p-5 text-white relative overflow-hidden transition-all duration-300 shadow-soft">
                            <div className="relative z-10">
                                <div 
                                    onClick={() => setIsCoinsExpanded(!isCoinsExpanded)}
                                    className="flex items-center justify-between mb-3 cursor-pointer group/title select-none"
                                >
                                    <h3 className="font-black text-sm flex items-center gap-2 group-hover/title:text-amber-300 transition-colors">
                                        <Coins className="w-4 h-4 text-amber-400 animate-pulse" /> {t('sidebar.coinRewardInfo')}
                                    </h3>
                                    <button 
                                        type="button"
                                        className="text-stone-400 group-hover/title:text-white transition-all p-1 rounded-lg bg-white/5 hover:bg-white/10 active:scale-90"
                                        aria-label={isCoinsExpanded ? "접기" : "펼치기"}
                                    >
                                        <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isCoinsExpanded ? 'rotate-90 text-amber-300' : ''}`} />
                                    </button>
                                </div>
                                <div className="space-y-2 text-xs text-stone-300">
                                    <div className="flex items-center justify-between bg-white/5 rounded-lg p-2.5 hover:bg-white/10 transition-colors">
                                        <span>{t('sidebar.rewards.patternShare')}</span>
                                        <span className="font-black text-amber-400">+50</span>
                                    </div>
                                    
                                    {isCoinsExpanded && (
                                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-2.5 hover:bg-white/10 transition-colors animate-in fade-in slide-in-from-top-1 duration-200">
                                            <span>{t('sidebar.rewards.signUpBonus')}</span>
                                            <span className="font-black text-amber-400">+5</span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between bg-white/5 rounded-lg p-2.5 hover:bg-white/10 transition-colors">
                                        <span>{t('sidebar.rewards.patternUploadBonus')}</span>
                                        <span className="font-black text-amber-400">+3</span>
                                    </div>

                                    {isCoinsExpanded && (
                                        <>
                                            <div className="flex items-center justify-between bg-white/5 rounded-lg p-2.5 hover:bg-white/10 transition-colors animate-in fade-in slide-in-from-top-1 duration-200">
                                                <span>{t('sidebar.rewards.aiAnalysis')}</span>
                                                <span className="font-black text-rose-400">-1</span>
                                            </div>
                                            <div className="flex items-center justify-between bg-white/5 rounded-lg p-2.5 hover:bg-white/10 transition-colors animate-in fade-in slide-in-from-top-1 duration-200">
                                                <span>{t('sidebar.rewards.aiEditor')}</span>
                                                <span className="font-black text-rose-400">-10</span>
                                            </div>
                                        </>
                                    )}

                                    <div className="flex items-center justify-between bg-white/5 rounded-lg p-2.5 hover:bg-white/10 transition-colors">
                                        <span>{t('sidebar.rewards.aiImage')}</span>
                                        <span className="font-black text-rose-400">-100</span>
                                    </div>

                                    {isCoinsExpanded && (
                                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-2.5 hover:bg-white/10 transition-colors animate-in fade-in slide-in-from-top-1 duration-200">
                                            <span>{t('sidebar.rewards.aiExport')}</span>
                                            <span className="font-black text-rose-400">-10</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Package className="absolute -right-4 -bottom-4 w-20 h-20 text-white/5 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
