'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Added Link import
import { useTranslations } from 'next-intl';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';

// Icons
import { ArrowLeft, Share2, ShoppingCart, Heart, ChevronRight, Play, Star, Eye, Download, Trash2 } from 'lucide-react';

// Types and Actions
import type { Pattern } from '@/types';
import { getPatternById } from '@/lib/patterns';
import {
    getReviews, toggleFollow, getFollowStatus, getDesignerProfile,
    toggleLike, getLikeStatus, deleteReview
} from '@/app/actions/social';
import { createOrder } from '@/app/actions/order';
import { incrementViewCount, incrementDownloadCount } from '@/app/actions/pattern';
import { PatternPDFGenerator } from '@/utils/PatternPDFGenerator';

// New Sub-Components
import { ProductImageGallery } from './detail/ProductImageGallery';
import { ProductInfoTable } from './detail/ProductInfoTable';
import { ProductRecommendationRow } from './detail/ProductRecommendationRow';
import { DownloadOptionModal } from './detail/DownloadOptionModal';

// Review Components (Keep existing or refactor later, for now import usually or inline)


interface PatternDetailClientProps {
    patternId: string;
    locale: string;
    user: User | null;
    isModal?: boolean;
}

import { ProductDetailTabs } from './detail/ProductDetailTabs';
import { ProductReviews } from './detail/ProductReviews';
import { ProductInquiries } from './detail/ProductInquiries';

// ... (previous imports remain, ensure imports are there)

export function PatternDetailClient({ patternId, locale, user, isModal }: PatternDetailClientProps) {
    // ... (existing state and useEffects remain unchanged) ...
    // Note: Copying previous checks and component logic, replacing just the render mostly.

    const router = useRouter();
    const t = useTranslations('marketplace');
    const tCommon = useTranslations('common');

    // ... (insert existing State / Effects here - usually preserved by replace_file_content if I target range correctly, 
    // but since I'm rewriting the render heavily, I might need to carefully target the Return statement or similar)
    // To play safe with tool limits, I will rely on the fact I'm replacing lines 303-430 (Render part). 
    // And ensure imports are added.  Wait, I need to add imports first or replacing file content might miss them if I don't select top.

    // ... [Previous state code assumed handling by "unchanged"] ...

    const [authUser, setAuthUser] = useState<User | null>(user);
    const [isAdmin, setIsAdmin] = useState(false);

    const [pattern, setPattern] = useState<Pattern | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null); // Added profile state

    // Social & Action State
    const [isLiked, setIsLiked] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [canDownload, setCanDownload] = useState(false);
    const [reviewCount, setReviewCount] = useState(0);

    // Related Products
    const [similarProducts, setSimilarProducts] = useState<Pattern[]>([]);
    const [boughtTogether, setBoughtTogether] = useState<Pattern[]>([]);
    const [designerOtherWorks, setDesignerOtherWorks] = useState<Pattern[]>([]);

    const [isWatchingAd, setIsWatchingAd] = useState(false);
    const [adProgress, setAdProgress] = useState(0);
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [showDownloadOptions, setShowDownloadOptions] = useState(false); // New inline state
    const [tempAgreed, setTempAgreed] = useState(false); // New agreement state
    const [isAdCompleted, setIsAdCompleted] = useState(false); // New ad completion state

    // Mock tags since DB might not have them yet, or use keywords
    const tags = ['Pattern', 'Knitting', 'DIY', ...(pattern?.category ? [pattern.category] : [])];

    // ... [UseEffects ...]

    useEffect(() => {
        const fetchPatternData = async () => {
            setIsLoading(true);
            try {
                // 1. Fetch Pattern
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('patterns')
                    .select('*')
                    .eq('id', patternId)
                    .single();

                if (error || !data) {
                    console.error('Error fetching pattern:', error);
                    return;
                }

                // Transform to Pattern type (simplified for brevity, matching previous logic)
                const dbPattern: Pattern = {
                    ...data,
                    // Parse necessary fields if stringified JSON or legacy formats
                    // (Assuming data shape matches or simple casting for this step)
                    preview_images: data.images || [],
                    title: typeof data.title === 'string' ? { en: data.title, ko: data.title } : data.title,
                    is_free: data.price_usd === 0 || data.is_free, // Force free if price is 0
                };
                setPattern(dbPattern);

                if (data.status === 'archived') {
                    setIsLoading(false);
                    return;
                }

                // Fetch Designer Profile
                const targetId = data.designer_id || data.creator_id;
                if (targetId) {
                    const { profile } = await getDesignerProfile(targetId);
                    if (profile) {
                        setProfile(profile);
                    } else {
                        // Fallback mechanism or attempt to fetch public user info if profile table is missing entry
                        console.warn('Profile not found for ID:', targetId);
                    }
                }

                // 2. Fetch Client User session (handles client-side auth refresh/caching issues)
                const { data: { user: clientUser } } = await supabase.auth.getUser();
                let activeUser = clientUser || user;
                if (clientUser) {
                    setAuthUser(clientUser);
                    // Check if admin
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', clientUser.id)
                        .single();
                    if (profileData?.role === 'admin') {
                        setIsAdmin(true);
                    }
                }

                // 3. Fetch Social Status (User dependent)
                if (activeUser) {
                    const [likeRes, followRes, orderRes] = await Promise.all([
                        getLikeStatus(patternId),
                        getFollowStatus(data.designer_id),
                        supabase.from('orders').select('*').eq('user_id', activeUser.id).eq('pattern_id', patternId).eq('status', 'paid').maybeSingle()
                    ]);
                    setIsLiked(likeRes.isLiked);
                    setIsFollowing(followRes.isFollowing);
                    if (orderRes.data || dbPattern.is_free || data.designer_id === activeUser.id) {
                        setCanDownload(true);
                    }
                }

                // 3. Fetch Public Data (Reviews)
                const reviewRes = await getReviews(patternId);
                if (reviewRes.reviews) setReviewCount(reviewRes.reviews.length);

                incrementViewCount(patternId);

                // Helper to map DB result to Pattern type
                const mapToPattern = (p: any): Pattern => ({
                    ...p,
                    preview_images: p.images || [],
                    title: typeof p.title === 'string' ? { en: p.title, ko: p.title } : p.title,
                });

                // 3. Fetch Related Products
                const designerId = data.designer_id;
                const { data: similar } = await supabase
                    .from('patterns')
                    .select('*')
                    .eq('category', data.category)
                    .neq('id', data.id)
                    .limit(10);
                if (similar) setSimilarProducts(similar.map(mapToPattern));

                // "Bought Together" - Mocking with popular items in same category for now
                const { data: popular } = await supabase
                    .from('patterns')
                    .select('*')
                    .eq('category', data.category)
                    .neq('id', data.id)
                    .order('view_count', { ascending: false })
                    .limit(10);
                if (popular) setBoughtTogether(popular.map(mapToPattern));

                if (designerId) {
                    const { data: works } = await supabase
                        .from('patterns')
                        .select('*')
                        .eq('designer_id', designerId)
                        .neq('id', data.id)
                        .limit(10);
                    if (works) setDesignerOtherWorks(works.map(mapToPattern));
                }

            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPatternData();
    }, [patternId, user]);

    // Ad Progress Timer
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isWatchingAd && adProgress < 100) {
            timer = setTimeout(() => {
                setAdProgress(prev => Math.min(prev + 20, 100)); // 5 seconds approx
            }, 1000);
        }
        return () => clearTimeout(timer);
    }, [isWatchingAd, adProgress]);

    // Ad Completion Handler
    useEffect(() => {
        if (isWatchingAd && adProgress >= 100) {
            const completeAd = async () => {
                try {
                    // Record "purchase" of free item
                    await createOrder({
                        patternId,
                        amount: 0,
                        paymentKey: `free_${Date.now()}`
                    });

                    setIsWatchingAd(false);
                    setIsAdCompleted(true); // Don't auto-download, just show buttons
                } catch (err) {
                    console.error('Error recording download:', err);
                    setIsWatchingAd(false);
                }
            };
            completeAd();
        }
    }, [isWatchingAd, adProgress, patternId]);

    // Handlers
    const handleLike = async () => {
        if (!authUser) return router.push(`/${locale}/login`);

        // Optimistic update
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setPattern(prev => prev ? {
            ...prev,
            like_count: (prev.like_count || 0) + (newIsLiked ? 1 : -1)
        } : null);

        await toggleLike(patternId);
    };

    const handleFollow = async () => {
        if (!authUser || !pattern) return router.push(`/${locale}/login`);
        setIsFollowing(!isFollowing); // Optimistic
        await toggleFollow(pattern.designer_id);
    };

    const handleBuy = async () => {
        if (!authUser) return router.push(`/${locale}/login`);

        // If already purchased/downloadable OR Free, show inline options
        if (canDownload || pattern?.is_free) {
            setShowDownloadOptions(!showDownloadOptions);
            // Scroll to action box? Optional.
            return;
        }

        // If paid, start purchase flow
        try {
            setIsLoading(true);
            const res = await createOrder({
                patternId,
                amount: pattern?.price_usd || 0
            });
            if (res.error) {
                if (res.error.includes('크레딧이 부족합니다') || res.error.includes('Credits') || res.error.includes('credits')) {
                    const confirmCharge = window.confirm(
                        locale === 'ko' 
                            ? '보유하신 크레딧이 부족합니다. 크레딧 충전 페이지로 이동하시겠습니까?' 
                            : 'Insufficient credits. Would you like to go to the credit charging page?'
                    );
                    if (confirmCharge) {
                        router.push(`/${locale}/payments`);
                    }
                } else {
                    alert(res.error);
                }
            } else {
                alert(locale === 'ko' ? '도안 구매가 완료되었습니다!' : 'Pattern purchased successfully!');
                setCanDownload(true);
                setShowDownloadOptions(true);
            }
        } catch (e: any) {
            alert(e.message || 'Error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleActualDownload = async (lang: 'ko' | 'en') => {
        if (!pattern) return;
        setShowDownloadModal(false);

        // Optimistic update
        setPattern(prev => prev ? {
            ...prev,
            download_count: (prev.download_count || 0) + 1
        } : null);

        const pdfGenerator = new PatternPDFGenerator({
            pattern: pattern!,
            user: authUser,
            targetLocale: lang, // Use selected language
            designerProfile: profile
        });
        await pdfGenerator.generate();
        await incrementDownloadCount(patternId);

        // 🔔 Reward the designer (+10) for download
        if (pattern.designer_id && pattern.designer_id !== authUser?.id) {
            try {
                const { addCredits } = await import('@/app/actions/credits');
                await addCredits(pattern.designer_id, 10, `Marketplace Download Reward (${patternId})`);
            } catch (e) {
                console.error('Failed to reward pattern download:', e);
            }
        }
    };

    if (isLoading || !pattern) {
        return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;
    }

    if (pattern.status === 'archived') {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-4">
                    <Trash2 size={32} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    {locale === 'ko' ? '삭제된 도안입니다.' : 'This pattern has been deleted.'}
                </h1>
                <p className="text-gray-500 mb-6 max-w-sm">
                    {locale === 'ko' 
                        ? '이 도안은 마켓플레이스에서 삭제되었거나 판매 중지되었습니다.' 
                        : 'This pattern has been deleted or is no longer available in the marketplace.'}
                </p>
                <button
                    onClick={() => router.push(`/${locale}/marketplace`)}
                    className="px-6 py-2.5 rounded-full bg-stone-900 text-white font-bold hover:bg-stone-800 transition-colors shadow-soft"
                >
                    {locale === 'ko' ? '마켓플레이스로 이동' : 'Go to Marketplace'}
                </button>
            </div>
        );
    }

    const titleStr = typeof pattern.title === 'string' ? pattern.title : (locale === 'ko' ? (pattern.title?.ko || pattern.title?.en) : (pattern.title?.en || pattern.title?.ko));
    const descStr = typeof pattern.description === 'string' ? pattern.description : (locale === 'ko' ? (pattern.description?.ko || pattern.description?.en) : (pattern.description?.en || pattern.description?.ko));
    const priceStr = pattern.is_free ? (locale === 'ko' ? '무료' : 'Free') : (locale === 'ko' ? `${pattern.price_usd} 크레딧` : `${pattern.price_usd} Credits`);

    return (
        <div className="bg-white min-h-screen relative pt-12">
            {/* Download Modal */}
            <DownloadOptionModal
                isOpen={showDownloadModal}
                onClose={() => setShowDownloadModal(false)}
                onDownload={handleActualDownload}
                locale={locale}
            />
            {/* Header (Back Button) - Mobile Only/Sticky */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-100 md:hidden">
                <button onClick={() => router.push(`/${locale}/marketplace`)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-gray-800" />
                </button>
                <div className="font-bold text-gray-800 truncate max-w-[200px]">{titleStr}</div>
                <div className="w-10"></div> {/* Spacer for balance */}
            </div>



            <div className="max-w-6xl mx-auto md:grid md:grid-cols-12 md:gap-12 md:px-6 mb-12">

                {/* LEFT COLUMN (Images) - Span 7 */}
                <div className="md:col-span-7">
                    <ProductImageGallery
                        images={pattern.preview_images || []}
                        title={titleStr || ''}
                    />
                </div>

                {/* RIGHT COLUMN (Info) - Span 5 - Sticky on Desktop */}
                <div className="px-5 py-6 md:px-0 md:py-0 md:col-span-5 md:sticky md:top-24 md:h-fit">

                    {/* Header Info */}
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mb-8 items-center">
                        {pattern.is_free && (
                            <span className="px-2 py-0.5 rounded-sm bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-wider">
                                FREE
                            </span>
                        )}
                        <div className="flex flex-wrap gap-2">
                            {tags.map((tag, i) => {
                                // Ensure we only have one # even if the tag itself starts with it
                                const cleanTag = tag.startsWith('#') ? tag.slice(1) : tag;
                                return (
                                    <span key={i} className="text-stone-400 text-xs font-medium">
                                        #{cleanTag.toLowerCase()}
                                    </span>
                                );
                            })}
                        </div>
                    </div>

                    {/* Designer - Moved Up */}
                    {/* Designer - Moved Up */}
                    <div className="flex items-center gap-3 mb-6 w-fit">
                        <Link href={`/${locale}/profile/${pattern.designer_id}`} className="flex items-center gap-2 group">
                            <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-bold text-xs uppercase overflow-hidden">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    (profile?.display_name || profile?.username || 'D')?.[0]
                                )}
                            </div>
                            <span className="text-sm font-semibold text-stone-500 group-hover:text-stone-800 transition-colors">
                                {profile?.display_name || profile?.username || `Designer ${pattern.designer_id?.slice(0, 4) || ''}`}
                            </span>
                        </Link>
                        {authUser && authUser.id !== pattern.designer_id && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleFollow();
                                }}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${isFollowing
                                    ? 'bg-white border-stone-300 text-stone-500 hover:border-red-200 hover:text-red-500'
                                    : 'bg-stone-800 border-stone-800 text-white hover:bg-stone-700'
                                    }`}
                            >
                                {isFollowing ? (locale === 'ko' ? '팔로잉' : 'Following') : (locale === 'ko' ? '팔로우' : 'Follow')}
                            </button>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-6 tracking-tight">
                        {titleStr}
                    </h1>

                    {/* Price & Share */}
                    <div className="flex items-center justify-between w-full border-b border-gray-100 pb-6 mb-6">
                        <div className="text-3xl font-black text-orange-600 tracking-tight">
                            {priceStr}
                        </div>
                        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                            <Share2 size={20} />
                        </button>
                    </div>

                    {/* Stats Row (Instagram Style) */}
                    <div className="flex items-center gap-6 mb-8 py-4 border-y border-gray-100/50">
                        {/* Rating */}
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1 text-amber-500 font-bold">
                                <Star size={18} className="fill-amber-500" />
                                <span>{pattern.average_rating ? pattern.average_rating.toFixed(1) : '0.0'}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium mt-0.5">{locale === 'ko' ? '별점' : 'Rating'}</span>
                        </div>
                        <div className="w-px h-8 bg-gray-100"></div>

                        {/* Views */}
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1 text-gray-600 font-bold">
                                <Eye size={18} />
                                <span>{pattern.view_count ? (pattern.view_count > 1000 ? `${(pattern.view_count / 1000).toFixed(1)}k` : pattern.view_count) : 0}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium mt-0.5">{locale === 'ko' ? '조회수' : 'Views'}</span>
                        </div>
                        <div className="w-px h-8 bg-gray-100"></div>

                        {/* Downloads */}
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1 text-gray-600 font-bold">
                                <Download size={18} />
                                <span>{pattern.download_count ? (pattern.download_count > 1000 ? `${(pattern.download_count / 1000).toFixed(1)}k` : pattern.download_count) : 0}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium mt-0.5">{locale === 'ko' ? '다운로드' : 'Downloads'}</span>
                        </div>
                        <div className="w-px h-8 bg-gray-100"></div>

                        {/* Likes */}
                        <div className="flex flex-col items-center">
                            <div className={`flex items-center gap-1 font-bold ${isLiked ? 'text-rose-500' : 'text-gray-600'}`}>
                                <Heart size={18} className={isLiked ? 'fill-rose-500' : ''} />
                                <span>{pattern.like_count || 0}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium mt-0.5">{locale === 'ko' ? '좋아요' : 'Likes'}</span>
                        </div>
                    </div>

                    {/* ACTION BOX (Moved inside info column and made always visible) */}
                    <div className="flex flex-col gap-3 mb-8 bg-white p-6 rounded-3xl border border-tan-100 shadow-xl shadow-tan-100/50 relative overflow-hidden group">
                        {/* Subtle bg decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-50/50 to-rose-50/30 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-700 pointer-events-none"></div>

                        <div className="flex gap-3 relative z-10 w-full">
                            {/* Like Button */}
                            <button
                                onClick={handleLike}
                                className="flex-1 py-3 rounded-xl bg-orange-50 border-2 border-orange-200 hover:bg-rose-50 hover:border-rose-200 text-rose-500 font-bold flex items-center justify-center gap-2 transition-all"
                            >
                                <Heart size={20} className={isLiked ? 'fill-rose-500' : ''} />
                                {isLiked ? (locale === 'ko' ? '찜함' : 'Liked') : (locale === 'ko' ? '찜하기' : 'Like')}
                            </button>
                            {/* Cart Button - Only show if PAID and NOT owned */}
                            {!pattern.is_free && !canDownload && (
                                <button
                                    onClick={() => alert('Add to cart')}
                                    className="flex-1 py-3 rounded-xl bg-white border-2 border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-stone-600 font-bold flex items-center justify-center gap-2 transition-all"
                                >
                                    <ShoppingCart size={20} />
                                    {locale === 'ko' ? '장바구니' : 'Cart'}
                                </button>
                            )}
                        </div>

                        {/* Inline Expandable Download Section */}
                        {showDownloadOptions ? (
                            <div className="mt-2 p-4 bg-gray-50 rounded-xl border border-gray-100 animate-in slide-in-from-top-2 fade-in relative z-10">
                                {/* Copyright Agreement - Visible ONLY after ad completion for free items, or immediately for paid/owned */}
                                {(!pattern.is_free || isAdCompleted) && (
                                    <div className="flex items-start gap-3 mb-4">
                                        <input
                                            type="checkbox"
                                            id="copyright-check"
                                            className="mt-1 w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                            checked={tempAgreed}
                                            onChange={(e) => setTempAgreed(e.target.checked)}
                                        />
                                        <label htmlFor="copyright-check" className="text-sm text-gray-600 leading-snug cursor-pointer select-none">
                                            {locale === 'ko'
                                                ? '본 도안의 저작권은 디자이너에게 있으며, 무단 배포 및 공유를 금지합니다. 이에 동의합니까?'
                                                : 'I agree that this pattern is copyrighted by the designer and cannot be distributed without permission.'}
                                        </label>
                                    </div>
                                )}

                                {pattern.is_free && !isAdCompleted ? (
                                    <button
                                        disabled={isWatchingAd}
                                        onClick={() => {
                                            setAdProgress(0);
                                            setIsWatchingAd(true);
                                        }}
                                        className="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 relative overflow-hidden"
                                    >
                                        {isWatchingAd ? (
                                            <>
                                                {/* Inline Progress Background */}
                                                <div
                                                    className="absolute inset-0 bg-orange-600 transition-all duration-1000 ease-linear opacity-20"
                                                    style={{ width: `${adProgress}%` }}
                                                />
                                                <span className="relative z-10">{adProgress}%</span>
                                            </>
                                        ) : (
                                            <>
                                                <Play size={18} className="fill-white" />
                                                {locale === 'ko' ? '광고 보고 무료 다운로드' : 'Watch Ad & Download Free'}
                                            </>
                                        )}
                                    </button>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <button
                                            disabled={!tempAgreed}
                                            onClick={() => handleActualDownload('ko')}
                                            className={`w-full font-bold py-3 rounded-xl shadow-sm transition-all text-sm flex items-center justify-center gap-2 ${tempAgreed ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                        >
                                            {locale === 'ko' ? '한국어 도안 다운로드' : 'Download Korean Pattern'}
                                        </button>
                                        <button
                                            disabled={!tempAgreed}
                                            onClick={() => handleActualDownload('en')}
                                            className={`w-full font-bold py-3 rounded-xl shadow-sm transition-all text-sm flex items-center justify-center gap-2 ${tempAgreed ? 'bg-stone-800 text-white hover:bg-stone-900 border border-stone-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                        >
                                            {locale === 'ko' ? '영어 도안 다운로드' : 'Download English Pattern'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    if (pattern.is_free || canDownload) {
                                        setShowDownloadOptions(true);
                                    } else {
                                        handleBuy(); // Go to payment logic if not owned/free
                                    }
                                }}
                                className="w-full bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-100 transform active:scale-[0.98] transition-all text-lg relative z-10"
                            >
                                {pattern.is_free ? (
                                    locale === 'ko' ? '무료 다운로드' : 'Free Download'
                                ) : (
                                    canDownload ? (
                                        locale === 'ko' ? '도안 다운로드' : 'Download Pattern'
                                    ) : (
                                        locale === 'ko' ? '구매하기' : 'Buy Now'
                                    )
                                )}
                            </button>
                        )}

                        {authUser && (authUser.id === pattern.designer_id || isAdmin) && (
                            <button
                                onClick={async () => {
                                    const confirmDelete = window.confirm(
                                        locale === 'ko'
                                            ? '정말로 이 도안을 마켓플레이스에서 삭제하시겠습니까?'
                                            : 'Are you sure you want to delete this pattern from the marketplace?'
                                    );
                                    if (!confirmDelete) return;

                                    try {
                                        setIsLoading(true);
                                        const { deletePattern } = await import('@/app/actions/pattern');
                                        const res = await deletePattern(patternId);
                                        if (res.success) {
                                            alert(locale === 'ko' ? '도안이 삭제되었습니다.' : 'Pattern deleted successfully.');
                                            router.push(`/${locale}/marketplace`);
                                        } else {
                                            alert(res.error || 'Failed to delete pattern');
                                        }
                                    } catch (e: any) {
                                        alert(e.message || 'Error occurred');
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }}
                                className="w-full mt-2 py-3.5 rounded-xl bg-rose-50 border-2 border-rose-200 hover:bg-rose-100 hover:border-rose-300 text-rose-600 font-bold flex items-center justify-center gap-2 transition-all text-sm relative z-10"
                            >
                                {locale === 'ko' ? '도안 삭제하기' : 'Delete Pattern'}
                            </button>
                        )}
                    </div>
                </div>

            </div>

            {/* TAB SECTION (Bottom) */}
            <div className="max-w-6xl mx-auto px-5 md:px-6">
                <ProductDetailTabs
                    locale={locale}
                    reviewCount={reviewCount}
                    qnaCount={0}
                    detailContent={
                        <div className="max-w-3xl mx-auto">
                            {/* Product Info Table */}
                            <div className="mb-10">
                                <h3 className="font-bold text-lg text-brown-800 mb-4">{locale === 'ko' ? '상품 필수 정보' : 'Product Details'}</h3>
                                <ProductInfoTable pattern={pattern} locale={locale} />
                            </div>

                            {/* Description */}
                            <div className="prose prose-stone max-w-none text-gray-600 mb-12 whitespace-pre-line text-base leading-relaxed">
                                {descStr}
                            </div>

                            {/* Refund Policy (Static) */}
                            <div className="bg-gray-50 p-6 rounded-xl text-sm text-gray-500 leading-relaxed mb-10 border border-gray-100">
                                <h4 className="font-bold text-gray-700 mb-2">
                                    {locale === 'ko' ? '교환/환불 안내' : 'Refund Policy'}
                                </h4>
                                {locale === 'ko'
                                    ? '본 상품은 PDF 디지털 파일로, 교환 및 환불이 불가합니다. 도안에 오류나 수정사항이 있는 경우 구매 내역에서 업데이트된 파일을 다운로드받으실 수 있으며, 기재해주신 메일로 안내가 발송됩니다.'
                                    : 'This product is a digital PDF file and is non-refundable. If there are errors or updates, you can download the updated file from your purchase history.'}
                            </div>
                        </div>
                    }
                    reviewContent={
                        <ProductReviews patternId={patternId} locale={locale} user={authUser} />
                    }
                    qnaContent={
                        <ProductInquiries patternId={patternId} locale={locale} />
                    }
                />
            </div>

            {/* 6. Recommendations (Full Width Bottom) */}
            <div className="max-w-6xl mx-auto px-5 md:px-6 space-y-8 border-t border-gray-100 pt-12 mt-16">
                {/* Similar Category */}
                <ProductRecommendationRow
                    title={locale === 'ko' ? '취향이 비슷한 털실들 PICK' : 'Similar Picks'}
                    products={similarProducts}
                    locale={locale}
                />

                {/* Bought Together */}
                <ProductRecommendationRow
                    title={locale === 'ko' ? '함께 구매하는 상품' : 'Frequently Bought Together'}
                    products={boughtTogether}
                    locale={locale}
                />

                {/* Designer's Other */}
                <ProductRecommendationRow
                    title={locale === 'ko' ? '해당 작가의 다른 작품' : 'More from this Designer'}
                    products={designerOtherWorks}
                    locale={locale}
                />
            </div>

        </div >
    );
}
