'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trash2, Edit3, X, Loader2, Check, Eye, Download, Heart, MessageSquare, Reply } from 'lucide-react';
import { updatePattern, deletePattern, getPatternStats, getPatternReviews, replyToReview } from '@/app/actions/pattern';

interface Product {
    id: string;
    thumbnail_url: string;
    title: { ko?: string; en?: string };
    description: { ko?: string; en?: string };
    price_usd: number;
    previous_price?: number;
    price_updated_at?: string;
    is_on_sale?: boolean;
    discount_percentage?: number;
    category?: string;
    difficulty?: string;
    view_count?: number;
    download_count?: number;
}

interface SellerProductGridProps {
    products: Product[];
    locale: string;
}

export function SellerProductGrid({ products, locale }: SellerProductGridProps) {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    const handleDelete = async (productId: string) => {
        if (!confirm(locale === 'ko' ? '정말 삭제하시겠습니까?' : 'Are you sure you want to delete?')) return;

        setDeletingId(productId);
        setDeletingId(productId);
        try {
            const res = await deletePattern(productId);
            if (!res.success) {
                alert(res.error || 'Failed to delete');
                return;
            }
            window.location.reload();
        } catch (err) {
            alert('Failed to delete');
        } finally {
            setDeletingId(null);
        }
    };

    if (products.length === 0) {
        return (
            <div className="text-center py-16 bg-cream-50 rounded-3xl border-2 border-dashed border-tan-200">
                <p className="text-brown-400 font-medium mb-2">
                    {locale === 'ko' ? '아직 등록된 작품이 없어요' : 'No patterns yet'}
                </p>
                <p className="text-brown-300 text-sm">
                    {locale === 'ko' ? '에디터에서 첫 번째 도안을 만들어보세요!' : 'Create your first pattern in the editor!'}
                </p>
            </div>
        );
    }

    // Check if product should show discount badge (price lowered within last month)
    const isDiscounted = (product: Product) => {
        if (!product.previous_price || !product.price_updated_at) return false;
        if (product.price_usd >= product.previous_price) return false;

        const updatedAt = new Date(product.price_updated_at);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        return updatedAt > oneMonthAgo;
    };

    // Calculate discount percentage
    const getDiscountPercent = (product: Product) => {
        if (!product.previous_price || product.price_usd >= product.previous_price) return 0;
        return Math.round((1 - product.price_usd / product.previous_price) * 100);
    };

    return (
        <>
            {/* Product Grid - Card Style */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((product) => (
                    <div
                        key={product.id}
                        className="bg-white rounded-2xl overflow-hidden shadow-soft border border-tan-100 hover:shadow-lg transition-all group"
                    >
                        {/* Image Container */}
                        <div className="relative aspect-[4/3] overflow-hidden">
                            <button
                                onClick={() => setSelectedProduct(product)}
                                className="w-full h-full"
                            >
                                {product.thumbnail_url ? (
                                    <img
                                        src={product.thumbnail_url}
                                        alt=""
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-5xl bg-tan-50">🧶</div>
                                )}
                            </button>

                            {/* Free Badge only on image */}
                            {product.price_usd === 0 && (
                                <div className="absolute top-3 left-3 px-3 py-1 bg-sage-500 text-white text-xs font-bold rounded-lg shadow-sm">
                                    {locale === 'ko' ? '무료' : 'Free'}
                                </div>
                            )}

                            {/* Hover Edit/Delete Buttons */}
                            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => {
                                        setSelectedProduct(product);
                                        setShowEditModal(true);
                                    }}
                                    className="p-2 rounded-lg bg-white/90 text-brown-700 hover:bg-white shadow-sm transition-colors"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(product.id)}
                                    disabled={deletingId === product.id}
                                    className="p-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 shadow-sm transition-colors disabled:opacity-50"
                                >
                                    {deletingId === product.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            {/* Title */}
                            <h3 className="font-bold text-brown-800 text-sm md:text-base mb-2 line-clamp-1">
                                {product.title?.ko || product.title?.en || 'Untitled'}
                            </h3>

                            {/* Price Row with Discount Badge */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-rose-500 font-bold text-sm">
                                    {product.price_usd === 0
                                        ? (locale === 'ko' ? '무료' : 'Free')
                                        : `$${product.price_usd}`
                                    }
                                </span>
                                {(isDiscounted(product) || (product.is_on_sale && product.discount_percentage)) && (
                                    <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                                        {isDiscounted(product)
                                            ? `-${getDiscountPercent(product)}%`
                                            : `-${product.discount_percentage}%`
                                        }
                                    </span>
                                )}
                            </div>

                            {/* Stats Row */}
                            <div className="flex items-center justify-between text-xs text-brown-400">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        {product.view_count || 0}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        {product.download_count || 0}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSelectedProduct(product)}
                                    className="px-3 py-1 rounded-lg bg-tan-100 text-brown-600 font-bold hover:bg-tan-200 transition-colors"
                                >
                                    View
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pattern Detail Modal (View Mode - with Edit/Delete instead of Creator) */}
            {selectedProduct && !showEditModal && (
                <PatternDetailModal
                    product={selectedProduct}
                    locale={locale}
                    onClose={() => setSelectedProduct(null)}
                    onEdit={() => setShowEditModal(true)}
                    onDelete={() => handleDelete(selectedProduct.id)}
                    deletingId={deletingId}
                />
            )}

            {/* Edit Modal - Same as Publish Modal but with locked design */}
            {selectedProduct && showEditModal && (
                <EditPatternModal
                    product={selectedProduct}
                    locale={locale}
                    setShowSaveSuccess={setShowSaveSuccess}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedProduct(null);
                    }}
                />
            )}

            {showSaveSuccess && <SaveSuccessToast locale={locale} />}
        </>
    );
}

function PatternDetailModal({
    product,
    locale,
    onClose,
    onEdit,
    onDelete,
    deletingId
}: {
    product: Product;
    locale: string;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    deletingId: string | null;
}) {
    const [stats, setStats] = useState({ views: 0, downloads: 0, likes: 0, reviews: 0 });
    const [reviews, setReviews] = useState<any[]>([]);
    const [replyingId, setReplyingId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

    const fetchData = async () => {
        const [newStats, newReviews] = await Promise.all([
            getPatternStats(product.id),
            getPatternReviews(product.id)
        ]);
        setStats(newStats);
        setReviews(newReviews || []);
    };

    useEffect(() => {
        fetchData();
    }, [product.id]);

    const handleReply = async (reviewId: string) => {
        if (!replyText.trim()) return;
        setSendingReply(true);
        try {
            await replyToReview(reviewId, replyText);
            setReplyText('');
            setReplyingId(null);
            fetchData(); // Refresh to show new reply
        } catch (error) {
            console.error(error);
            alert(locale === 'ko' ? '답글을 달지 못했습니다' : 'Failed to reply');
        } finally {
            setSendingReply(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Instagram-style header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pattern Insights</span>
                    </div>
                    <button onClick={onClose}>
                        <X className="w-5 h-5 text-gray-800" />
                    </button>
                </div>

                {/* Main Content */}
                <div className="p-4">
                    {/* Header Info */}
                    <div className="flex gap-4 mb-6">
                        <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm border border-gray-100">
                            {product.thumbnail_url && (
                                <img src={product.thumbnail_url} className="w-full h-full object-cover" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 truncate mb-1">
                                {product.title?.ko || product.title?.en}
                            </h3>
                            <p className="text-rose-500 font-bold text-sm mb-2">
                                {product.price_usd === 0 ? (locale === 'ko' ? '무료' : 'Free') : `$${product.price_usd}`}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className={product.is_on_sale ? "text-rose-500 font-bold" : ""}>
                                    {product.is_on_sale ? "Sale Active" : "Published"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-4 gap-2 mb-6">
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <Eye className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                            <span className="block text-sm font-bold text-gray-900">{stats.views}</span>
                            <span className="text-[10px] text-gray-500">{locale === 'ko' ? '조회' : 'Views'}</span>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <Download className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                            <span className="block text-sm font-bold text-gray-900">{stats.downloads}</span>
                            <span className="text-[10px] text-gray-500">{locale === 'ko' ? '다운' : 'Downs'}</span>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <Heart className="w-5 h-5 mx-auto mb-1 text-rose-500 fill-rose-500" />
                            <span className="block text-sm font-bold text-gray-900">{stats.likes}</span>
                            <span className="text-[10px] text-gray-500">{locale === 'ko' ? '좋아요' : 'Likes'}</span>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <MessageSquare className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                            <span className="block text-sm font-bold text-gray-900">{stats.reviews}</span>
                            <span className="text-[10px] text-gray-500">{locale === 'ko' ? '리뷰' : 'Reviews'}</span>
                        </div>
                    </div>

                </div>

                {/* Actions */}
                <div className="space-y-2 mb-6 px-4">
                    <button
                        onClick={onEdit}
                        className="w-full py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition-colors flex items-center justify-center gap-2"
                    >
                        <Edit3 className="w-4 h-4" />
                        {locale === 'ko' ? '정보 수정' : 'Edit Info'}
                    </button>
                    <button
                        onClick={onDelete}
                        disabled={deletingId === product.id}
                        className="w-full py-3 rounded-xl border border-gray-200 text-rose-500 font-bold hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"
                    >
                        {deletingId === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        {locale === 'ko' ? '삭제하기' : 'Delete'}
                    </button>
                </div>

                {/* Reviews Section */}
                <div className="border-t border-gray-100 pt-6 px-4">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        {locale === 'ko' ? '리뷰 관리' : 'Manage Reviews'} ({reviews.length})
                    </h4>

                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {reviews.length === 0 ? (
                            <p className="text-gray-400 text-sm text-center py-4">
                                {locale === 'ko' ? '아직 작성된 리뷰가 없습니다' : 'No reviews yet'}
                            </p>
                        ) : (
                            reviews.map((review) => (
                                <div key={review.id} className="bg-gray-50 rounded-xl p-3 text-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                                                {review.user?.avatar_url && <img src={review.user.avatar_url} className="w-full h-full object-cover" />}
                                            </div>
                                            <span className="font-bold text-gray-800">{review.user?.full_name || 'User'}</span>
                                        </div>
                                        <div className="flex text-yellow-400">
                                            {[...Array(5)].map((_, i) => (
                                                <StarIcon key={i} filled={i < review.rating} />
                                            ))}
                                        </div>
                                    </div>

                                    <p className="text-gray-600 mb-2">{review.content}</p>

                                    {/* Seller Reply Display */}
                                    {review.seller_reply && (
                                        <div className="ml-4 mt-2 p-3 bg-white rounded-lg border border-tan-100">
                                            <div className="text-xs font-bold text-rose-500 mb-1 flex items-center gap-1">
                                                <Reply className="w-3 h-3" />
                                                {locale === 'ko' ? '판매자 답글' : 'Seller Reply'}
                                            </div>
                                            <p className="text-gray-600 font-light">{review.seller_reply}</p>
                                        </div>
                                    )}

                                    {/* Reply Input */}
                                    {!review.seller_reply && (
                                        <div className="mt-3">
                                            {replyingId === review.id ? (
                                                <div className="flex gap-2">
                                                    <input
                                                        autoFocus
                                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs focus:ring-1 focus:ring-rose-300 outline-none"
                                                        placeholder={locale === 'ko' ? '답글을 입력하세요...' : 'Write a reply...'}
                                                        value={replyText}
                                                        onChange={e => setReplyText(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && handleReply(review.id)}
                                                    />
                                                    <button
                                                        onClick={() => handleReply(review.id)}
                                                        disabled={sendingReply}
                                                        className="px-3 py-1 bg-rose-500 text-white rounded-lg text-xs font-bold whitespace-nowrap"
                                                    >
                                                        {sendingReply ? <Loader2 className="w-3 h-3 animate-spin" /> : (locale === 'ko' ? '등록' : 'Post')}
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setReplyingId(review.id)}
                                                    className="text-xs text-blue-500 font-medium hover:underline flex items-center gap-1"
                                                >
                                                    <Reply className="w-3 h-3" />
                                                    {locale === 'ko' ? '답글 달기' : 'Reply'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>

    );
}

// Simple Edit Modal (publish modal style but design locked)
function EditPatternModal({ product, locale, onClose, setShowSaveSuccess }: {
    product: Product;
    locale: string;
    onClose: () => void;
    setShowSaveSuccess: (show: boolean) => void;
}) {
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState(product.title?.ko || product.title?.en || '');
    const [description, setDescription] = useState(product.description?.ko || product.description?.en || '');
    const [price, setPrice] = useState(product.price_usd);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updatePattern({
                id: product.id,
                title,
                description,
                price,
                locale
            });
            setShowSaveSuccess(true);
            onClose(); // Close the modal immediately
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (err: any) {
            console.error('Save error:', err);
            alert((locale === 'ko' ? '저장에 실패했습니다: ' : 'Failed to save: ') + (err.message || err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-tan-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-brown-800">
                        {locale === 'ko' ? '상품 정보 수정' : 'Edit Product Info'}
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-tan-100">
                        <X className="w-5 h-5 text-brown-400" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Locked Design Notice */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                        {locale === 'ko'
                            ? '⚠️ 도안 디자인은 수정할 수 없습니다. 디자인을 변경하려면 스튜디오에서 새로 출시해주세요.'
                            : '⚠️ Pattern design cannot be modified. To change the design, please republish from Studio.'}
                    </div>

                    {/* Discount Notice */}
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-600">
                        {locale === 'ko'
                            ? '💡 가격을 낮추면 "할인" 뱃지가 자동으로 표시됩니다. 할인 뱃지는 수정일로부터 1개월간 유지됩니다.'
                            : '💡 Lowering the price will automatically show a "Sale" badge. The badge remains for 1 month from the modification date.'}
                    </div>

                    {/* Title */}
                    <div>
                        <label className="text-sm font-bold text-brown-600 block mb-1">
                            {locale === 'ko' ? '제목' : 'Title'}
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-tan-200 text-brown-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-sm font-bold text-brown-600 block mb-1">
                            {locale === 'ko' ? '설명' : 'Description'}
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-tan-200 text-brown-700 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-rose-300"
                        />
                    </div>

                    {/* Price */}
                    <div>
                        <label className="text-sm font-bold text-brown-600 block mb-1">
                            {locale === 'ko' ? '가격 (USD)' : 'Price (USD)'}
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl border border-tan-200 text-brown-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-tan-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl bg-tan-100 text-brown-600 font-bold hover:bg-tan-200 transition-colors"
                    >
                        {locale === 'ko' ? '취소' : 'Cancel'}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>{locale === 'ko' ? '저장' : 'Save'}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}



function StarIcon({ filled }: { filled: boolean }) {
    return (
        <svg
            className={`w-3 h-3 ${filled ? 'fill-current' : 'text-gray-300 fill-gray-300'}`}
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    );
}

function SaveSuccessToast({ locale }: { locale: string }) {
    return (
        <div className="fixed top-1/2 left-1/2 bg-[#6B8E63] text-white px-8 py-6 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] z-[9999] animate-toast flex flex-col items-center gap-4 border border-white/20 min-w-[280px]">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white">
                <Check size={28} strokeWidth={3} />
            </div>
            <div className="text-center">
                <h3 className="text-xl font-bold">
                    {locale === 'ko' ? '저장 완료' : 'Saved'}
                </h3>
                <p className="text-sm text-white/80 mt-1">
                    {locale === 'ko' ? '내 작품 정보가 안전하게 수정되었습니다.' : 'Your pattern has been safely updated.'}
                </p>
            </div>
        </div>
    );
}
