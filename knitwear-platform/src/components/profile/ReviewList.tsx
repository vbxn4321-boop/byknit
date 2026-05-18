
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Star, Edit2, Trash2, Check, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { updateReview, deleteReview } from '@/app/actions/profile';
import { User } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';

const PatternModal = dynamic(() => import('@/components/common/PatternModal').then(mod => mod.PatternModal), {
    loading: () => null
});

interface ReviewListProps {
    initialReviews: any[];
    locale: string;
    user: User | null;
}

export function ReviewList({ initialReviews, locale, user }: ReviewListProps) {
    const [reviews, setReviews] = useState(initialReviews);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [editRating, setEditRating] = useState(5);
    const [visibleCount, setVisibleCount] = useState(3);
    const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
    const tCommon = useTranslations('common');
    // const locale = (typeof window !== 'undefined' && window.location.pathname.startsWith('/ko')) ? 'ko' : 'en'; // Removed problematic line

    const handleDelete = async (reviewId: string) => {
        if (!confirm(locale === 'ko' ? '이 리뷰를 삭제하시겠습니까?' : 'Are you sure you want to delete this review?')) return;
        setLoadingId(reviewId);
        try {
            await deleteReview(reviewId);
            setReviews(reviews.filter(r => r.id !== reviewId));
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoadingId(null);
        }
    };

    const handleSave = async (reviewId: string) => {
        setLoadingId(reviewId);
        try {
            await updateReview(reviewId, editRating, editContent);
            setReviews(reviews.map(r => r.id === reviewId ? { ...r, rating: editRating, content: editContent } : r));
            setEditingId(null);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoadingId(null);
        }
    };

    const displayedReviews = reviews.slice(0, visibleCount);

    const handleShowMore = () => {
        setVisibleCount(prev => prev + 15);
    };

    const handleShowLess = () => {
        setVisibleCount(3);
    };

    return (
        <div className="space-y-6">
            {!reviews || reviews.length === 0 ? (
                <p className="text-center py-8 text-brown-400 font-medium">{tCommon('noComments')}</p>
            ) : (
                <>
                    <div className="space-y-6">
                        {displayedReviews.map((review: any) => (
                            <div
                                key={review.id}
                                // Only trigger modal if not editing
                                onClick={(e) => {
                                    if (editingId !== review.id && review.patterns?.id) {
                                        setSelectedPatternId(review.patterns.id);
                                    }
                                }}
                                className={`space-y-3 animate-in fade-in slide-in-from-bottom-2 group cursor-pointer p-2 rounded-xl border border-transparent hover:bg-cream-50/50 hover:border-tan-100 transition-all ${editingId === review.id ? '' : 'hover:shadow-sm'}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <button
                                                    key={i}
                                                    disabled={editingId !== review.id}
                                                    onClick={() => setEditRating(i + 1)}
                                                    className={`transition-all ${editingId === review.id ? 'hover:scale-110' : ''}`}
                                                >
                                                    <Star className={`w-3 h-3 ${i < (editingId === review.id ? editRating : review.rating) ? 'text-amber-400 fill-amber-400' : 'text-tan-200'}`} />
                                                </button>
                                            ))}
                                        </div>
                                        <span className="text-xs text-brown-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                                            {tCommon('on')} {locale === 'ko' ? (review.patterns?.title?.ko || review.patterns?.title?.en) : (review.patterns?.title?.en || review.patterns?.title?.ko)}
                                        </span>
                                    </div>

                                    {editingId === review.id ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent modal open
                                                    handleSave(review.id);
                                                }}
                                                disabled={loadingId === review.id}
                                                className="text-[10px] font-bold text-sage-500 hover:text-sage-600 uppercase tracking-wider flex items-center gap-1"
                                            >
                                                {loadingId === review.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                                {tCommon('save')}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingId(null);
                                                }}
                                                className="text-[10px] font-bold text-brown-400 hover:text-brown-600 uppercase tracking-wider flex items-center gap-1"
                                            >
                                                <X className="w-3 h-3" />
                                                {tCommon('cancel')}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingId(review.id);
                                                    setEditContent(review.content);
                                                    setEditRating(review.rating);
                                                }}
                                                className="text-[10px] font-bold text-brown-400 hover:text-rose-500 uppercase tracking-wider flex items-center gap-1"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                                {tCommon('edit')}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(review.id);
                                                }}
                                                className="text-[10px] font-bold text-brown-400 hover:text-rose-500 uppercase tracking-wider flex items-center gap-1"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                {tCommon('delete')}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className={`p-4 rounded-2xl border transition-all ${editingId === review.id ? 'bg-white border-rose-200' : 'bg-cream-50/50 border-tan-100'}`}>
                                    {editingId === review.id ? (
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="w-full bg-transparent text-brown-600 text-sm leading-relaxed focus:outline-none resize-none"
                                            rows={3}
                                            minLength={10}
                                        />
                                    ) : (
                                        <p className="text-brown-600 text-sm leading-relaxed">{review.content}</p>
                                    )}
                                </div>
                                <p className="text-[10px] text-brown-300 ml-2">
                                    {new Date(review.created_at).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US')}
                                </p>
                            </div>
                        ))}
                    </div>

                    {reviews.length > 3 && (
                        <div className="flex gap-2 mt-4">
                            {reviews.length > visibleCount && (
                                <button
                                    onClick={handleShowMore}
                                    className="flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold text-brown-500 hover:text-rose-500 bg-cream-50/50 hover:bg-cream-100/50 rounded-2xl transition-all border border-dashed border-tan-200"
                                >
                                    {tCommon('showMore')} ({Math.min(15, reviews.length - visibleCount)})
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                            )}
                            {visibleCount > 3 && (
                                <button
                                    onClick={handleShowLess}
                                    className="flex-1 py-3 flex items-center justify-center gap-2 text-sm font-bold text-brown-500 hover:text-rose-500 bg-cream-50/50 hover:bg-cream-100/50 rounded-2xl transition-all border border-dashed border-tan-200"
                                >
                                    {tCommon('showLess') || 'Fold'}
                                    <ChevronUp className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}

                    {selectedPatternId && (
                        <PatternModal
                            patternId={selectedPatternId}
                            locale={locale}
                            user={user}
                            onClose={() => setSelectedPatternId(null)}
                        />
                    )}
                </>
            )}
        </div>
    );
}
