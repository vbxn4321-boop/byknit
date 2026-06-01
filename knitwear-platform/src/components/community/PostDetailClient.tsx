'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft, Heart, MessageSquare, Send,
    User as UserIcon, UserPlus, UserCheck,
    Package, Trash2, CornerDownRight, Coins,
    Bookmark, Edit3, X, Save
} from 'lucide-react';
import { toggleLike, toggleFollow, createComment, deleteComment, deletePost, updatePost, toggleBookmark, getMyLikes } from '@/app/actions/community';
import { User } from '@supabase/supabase-js';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

interface Comment {
    id: string;
    post_id: string;
    user_id: string;
    parent_id: string | null;
    content: string;
    created_at: string;
    profiles: { id: string; display_name: string; email: string };
}

interface Post {
    id: string;
    user_id: string;
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

interface Props {
    post: Post;
    comments: Comment[];
    user: User | null;
    locale: string;
}

export function PostDetailClient({ post, comments: initialComments, user, locale }: Props) {
    const t = useTranslations('community');
    const tCommon = useTranslations('common');
    const router = useRouter();
    const [comments, setComments] = useState(initialComments);
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(post.title);
    const [editContent, setEditContent] = useState(post.content);
    const [editCategory, setEditCategory] = useState(post.category);
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likes?.[0]?.count || 0);

    useEffect(() => {
        if (user) {
            getMyLikes().then(likes => {
                if (likes.includes(post.id)) {
                    setIsLiked(true);
                }
            });
        }
    }, [user, post.id]);

    // 🌐 AI 원클릭 번역 상태
    const [translatedPost, setTranslatedPost] = useState<{ title: string; content: string } | null>(null);
    const [isTranslatingPost, setIsTranslatingPost] = useState(false);
    const [translatedComments, setTranslatedComments] = useState<Record<string, string>>({});
    const [translatingCommentIds, setTranslatingCommentIds] = useState<Set<string>>(new Set());

    const handleTranslatePost = async () => {
        if (translatedPost) {
            setTranslatedPost(null);
            return;
        }
        setIsTranslatingPost(true);
        try {
            const { translateText } = await import('@/app/actions/translate');
            const targetLang = locale === 'ko' ? 'ko' : 'en';
            const [tTitle, tContent] = await Promise.all([
                translateText(post.title, targetLang),
                translateText(post.content, targetLang)
            ]);
            setTranslatedPost({ title: tTitle, content: tContent });
        } catch (error) {
            console.error('Post translation failed:', error);
            alert(t('detail.translationFailed'));
        } finally {
            setIsTranslatingPost(false);
        }
    };

    const handleTranslateComment = async (commentId: string, originalContent: string) => {
        if (translatedComments[commentId]) {
            setTranslatedComments(prev => {
                const next = { ...prev };
                delete next[commentId];
                return next;
            });
            return;
        }
        setTranslatingCommentIds(prev => {
            const next = new Set(prev);
            next.add(commentId);
            return next;
        });
        try {
            const { translateText } = await import('@/app/actions/translate');
            const targetLang = locale === 'ko' ? 'ko' : 'en';
            const translated = await translateText(originalContent, targetLang);
            setTranslatedComments(prev => ({ ...prev, [commentId]: translated }));
        } catch (error) {
            console.error('Comment translation failed:', error);
        } finally {
            setTranslatingCommentIds(prev => {
                const next = new Set(prev);
                next.delete(commentId);
                return next;
            });
        }
    };

    const isOwner = !!user && (user.id === post.user_id || user.id === post.profiles?.id);

    // 트리 구조로 변환: 최상위 댓글 + 하위 답글
    const topLevelComments = comments.filter(c => !c.parent_id);
    const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

    const getPatternTitle = (title: any): string => {
        if (!title) return 'Untitled';
        if (typeof title === 'string') return title;
        return title[locale] || title.ko || title.en || 'Untitled';
    };

    const getPatternImage = (pattern: Post['pattern']): string | null => {
        if (!pattern) return null;
        return pattern.thumbnail_url || (pattern.images && pattern.images[0]) || null;
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
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    const getCategoryLabel = (cat: string) => {
        return t(`categories.${cat}`, { defaultValue: cat });
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

    const handleSubmitComment = async () => {
        if (!newComment.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await createComment(post.id, newComment.trim());
            setNewComment('');
            router.refresh();
        } catch (error) {
            alert('댓글 작성에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitReply = async () => {
        if (!replyContent.trim() || !replyTo || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await createComment(post.id, replyContent.trim(), replyTo.id);
            setReplyContent('');
            setReplyTo(null);
            router.refresh();
        } catch (error) {
            alert('답글 작성에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm(t('detail.deleteCommentConfirm'))) return;
        try {
            await deleteComment(commentId);
            router.refresh();
        } catch (error) {
            alert(t('detail.deleteFailed'));
        }
    };

    const handleDeletePost = async () => {
        if (!confirm(t('detail.deleteConfirm'))) return;
        try {
            await deletePost(post.id);
            router.push(`/${locale}/community`);
        } catch (error) {
            alert(t('detail.deleteFailed'));
        }
    };

    const handleUpdatePost = async () => {
        if (!editTitle.trim() || !editContent.trim()) return;
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', editTitle);
            formData.append('content', editContent);
            formData.append('category', editCategory);
            await updatePost(post.id, formData);
            setIsEditing(false);
            router.refresh();
        } catch (error) {
            alert(locale === 'ko' ? '수정에 실패했습니다.' : 'Failed to edit post.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBookmark = async () => {
        if (!user) return;
        try {
            const result = await toggleBookmark(post.id);
            setIsBookmarked(result.bookmarked);
        } catch (e) { /* ignore */ }
    };

    const handleLike = async () => {
        if (!user) return;
        try {
            const newIsLiked = !isLiked;
            setIsLiked(newIsLiked);
            setLikeCount(prev => newIsLiked ? prev + 1 : Math.max(0, prev - 1));
            await toggleLike(post.id);
        } catch (error) {
            console.error('Like error:', error);
        }
    };

    return (
        <div className="min-h-screen bg-cream-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-tan-200 px-6 py-4">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-stone-500 hover:text-stone-800 font-bold transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        {t('detail.backToList')}
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Post Content */}
                <article className="bg-white rounded-2xl border border-tan-200 shadow-soft overflow-hidden">
                    <div className="p-8">
                        {/* Category */}
                        {isEditing ? (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {['general', 'showcase', 'qna', 'tip'].map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setEditCategory(cat)}
                                        className={`px-4 py-1.5 rounded-full border text-xs font-bold transition-all ${
                                            editCategory === cat ? 'bg-stone-800 text-white border-stone-800' : 'border-stone-200 text-stone-500'
                                        }`}
                                    >
                                        #{t(`categories.${cat}`, { defaultValue: cat })}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <span className="inline-block px-3 py-1 rounded-lg bg-stone-100 text-stone-600 text-xs font-bold mb-4">
                                #{getCategoryLabel(post.category)}
                            </span>
                        )}

                        {/* Title */}
                        {isEditing ? (
                            <input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full text-3xl font-black text-stone-900 mb-6 outline-none border-b-2 border-rose-200 focus:border-rose-400 pb-2 bg-transparent"
                            />
                        ) : (
                            <h1 className="text-3xl font-black text-stone-900 mb-6">{translatedPost ? translatedPost.title : post.title}</h1>
                        )}

                        {/* Author */}
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-stone-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
                                    <UserIcon className="w-5 h-5 text-stone-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-stone-800">{post.profiles?.display_name || 'Anonymous'}</span>
                                        {user && post.profiles?.id && user.id !== post.profiles.id && (
                                            <button
                                                onClick={() => handleFollow(post.profiles.id)}
                                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                                                    followingSet.has(post.profiles.id)
                                                        ? 'bg-stone-100 text-stone-500'
                                                        : 'bg-rose-500 text-white hover:bg-rose-600'
                                                }`}
                                            >
                                                {followingSet.has(post.profiles.id) ? (
                                                    <><UserCheck className="w-3 h-3" /> {t('detail.following')}</>
                                                ) : (
                                                    <><UserPlus className="w-3 h-3" /> {t('detail.follow')}</>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-stone-400">{formatDate(post.created_at)}</span>
                                        <span className="text-stone-300 text-xs">·</span>
                                        <span className="text-xs text-stone-400">{t('detail.views', { count: post.views || 0 })}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                {/* Translate */}
                                <button
                                    onClick={handleTranslatePost}
                                    disabled={isTranslatingPost}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all text-xs font-bold ${
                                        translatedPost
                                            ? 'border-rose-200 text-rose-500 bg-rose-50'
                                            : 'border-stone-200 text-stone-500 hover:text-rose-500 hover:border-rose-200 bg-white'
                                    }`}
                                >
                                    <span className="text-sm">🌐</span>
                                    <span>{isTranslatingPost ? t('detail.translating') : (translatedPost ? t('detail.originalView') : t('detail.translateView'))}</span>
                                </button>

                                {/* Bookmark */}
                                {user && (
                                    <button
                                        onClick={handleBookmark}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all font-bold ${
                                            isBookmarked
                                                ? 'border-amber-200 text-amber-500 bg-amber-50'
                                                : 'border-stone-200 text-stone-500 hover:text-amber-500 hover:border-amber-200'
                                        }`}
                                    >
                                        <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
                                    </button>
                                )}

                                {/* Like */}
                                <button
                                    onClick={handleLike}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all font-bold ${
                                        isLiked 
                                            ? 'border-rose-200 bg-rose-50 text-rose-500' 
                                            : 'border-stone-200 text-stone-500 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50'
                                    }`}
                                >
                                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-rose-500' : ''}`} />
                                    <span>{likeCount}</span>
                                </button>

                                {/* Edit/Delete (owner only) */}
                                {isOwner && !isEditing && (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 text-stone-400 hover:text-blue-500 hover:border-blue-200 transition-all"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={handleDeletePost}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 text-stone-400 hover:text-rose-500 hover:border-rose-200 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                                {isEditing && (
                                    <>
                                        <button
                                            onClick={handleUpdatePost}
                                            disabled={isSubmitting}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-stone-800 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 transition-all disabled:opacity-40"
                                        >
                                            <Save className="w-4 h-4" /> {isSubmitting ? t('detail.saving') : t('detail.save')}
                                        </button>
                                        <button
                                            onClick={() => { setIsEditing(false); setEditTitle(post.title); setEditContent(post.content); setEditCategory(post.category); }}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 text-stone-400 hover:text-stone-600 transition-all"
                                        >
                                            <X className="w-4 h-4" /> {t('detail.cancel')}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Body */}
                        {isEditing ? (
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={12}
                                className="w-full text-stone-700 text-lg leading-relaxed mb-8 outline-none border-2 border-rose-100 focus:border-rose-300 rounded-xl p-4 bg-stone-50/50 resize-none"
                            />
                        ) : (
                            <div className="text-stone-700 text-lg leading-relaxed whitespace-pre-wrap mb-8">
                                {translatedPost ? translatedPost.content : post.content}
                            </div>
                        )}

                        {/* Attachments & Patterns Section */}
                        {(post.pattern || (post.images && post.images.length > 0)) && (
                            <div className="pt-6 border-t border-stone-100 space-y-3">
                                <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest">{t('detail.attachments')}</h3>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {/* Attached Pattern */}
                                    {post.pattern && (
                                        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-center gap-3">
                                            {getPatternImage(post.pattern) ? (
                                                <img
                                                    src={getPatternImage(post.pattern)!}
                                                    alt="pattern"
                                                    className="w-12 h-12 rounded-xl object-cover border border-stone-100 flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-stone-100 flex-shrink-0">
                                                    <Package className="w-6 h-6 text-stone-300" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">{t('detail.sharedPattern')}</span>
                                                    <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-50 border border-amber-200 text-amber-600 text-[8px] font-black">
                                                        <Coins className="w-2 h-2" /> +50
                                                    </span>
                                                </div>
                                                <p className="font-bold text-stone-800 text-xs truncate">{getPatternTitle(post.pattern.title)}</p>
                                            </div>
                                            <Link
                                                href={`/marketplace/${post.pattern.id}`}
                                                className="px-3.5 py-2 bg-stone-800 text-white text-xs font-bold rounded-lg hover:bg-rose-500 transition-all flex-shrink-0"
                                            >
                                                {t('detail.view')}
                                            </Link>
                                        </div>
                                    )}

                                    {/* Attached Photo */}
                                    {post.images && post.images.length > 0 && post.images.map((imgUrl, i) => (
                                        <div key={i} className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-center gap-3">
                                            <img
                                                src={imgUrl}
                                                alt="attached photo"
                                                className="w-12 h-12 rounded-xl object-cover border border-stone-100 flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-0.5">{t('detail.attachedPhoto')}</p>
                                                <p className="font-bold text-stone-800 text-xs truncate">photo_attachment_{i+1}.png</p>
                                            </div>
                                            <a
                                                href={imgUrl}
                                                download={`byknit_attachment_${post.id}_${i}.png`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3.5 py-2 bg-stone-800 text-white text-xs font-bold rounded-lg hover:bg-rose-500 transition-all flex-shrink-0 flex items-center gap-1 cursor-pointer"
                                            >
                                                <Save className="w-3.5 h-3.5" />
                                                <span>{t('detail.saveFile')}</span>
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </article>

                {/* ===== Comments Section ===== */}
                <div className="mt-8">
                    <h2 className="text-lg font-black text-stone-800 mb-5 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-rose-400" />
                        {t('detail.commentsCount', { count: comments.length })}
                    </h2>

                    {/* Comment Input */}
                    {user ? (
                        <div className="bg-white rounded-2xl border border-tan-200 shadow-soft p-3 px-4.5 mb-6">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder={t('detail.commentPlaceholder')}
                                className="w-full h-[26px] text-sm text-stone-800 placeholder:text-stone-400 outline-none resize-none bg-transparent overflow-y-auto leading-normal py-0.5"
                            />
                            <div className="flex justify-end mt-3 pt-3 border-t border-stone-50">
                                <button
                                    onClick={handleSubmitComment}
                                    disabled={!newComment.trim() || isSubmitting}
                                    className="flex items-center gap-2 px-5 py-2 bg-stone-800 text-white text-sm font-bold rounded-xl hover:bg-rose-500 transition-all disabled:opacity-40"
                                >
                                    <Send className="w-4 h-4" />
                                    {isSubmitting ? t('detail.submitCommentLoading') : t('detail.submitComment')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-tan-200 p-6 mb-6 text-center">
                            <p className="text-sm text-stone-400">{t('detail.commentLoginPrompt')}</p>
                        </div>
                    )}

                    {/* Comment List */}
                    <div className="space-y-4">
                        {topLevelComments.length > 0 ? (
                            topLevelComments.map((comment) => (
                                <div key={comment.id}>
                                    {/* Main Comment */}
                                    <div className="bg-white rounded-2xl border border-tan-200 shadow-soft p-5">
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                                                <UserIcon className="w-4 h-4 text-stone-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-stone-800 text-sm">{comment.profiles?.display_name || 'Anonymous'}</span>
                                                    <span className="text-[10px] text-stone-400">{formatDate(comment.created_at)}</span>
                                                </div>
                                                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                                                    {translatedComments[comment.id] || comment.content}
                                                </p>
                                                <div className="flex items-center gap-3 mt-3">
                                                    {user && (
                                                        <button
                                                            onClick={() => setReplyTo({ id: comment.id, name: comment.profiles?.display_name || 'Anonymous' })}
                                                            className="text-[11px] font-bold text-stone-400 hover:text-rose-500 transition-colors"
                                                        >
                                                            {t('detail.reply')}
                                                        </button>
                                                    )}

                                                    {/* Translate Comment */}
                                                    <button
                                                        onClick={() => handleTranslateComment(comment.id, comment.content)}
                                                        disabled={translatingCommentIds.has(comment.id)}
                                                        className="text-[11px] font-black text-stone-400 hover:text-rose-500 transition-colors inline-flex items-center gap-0.5"
                                                    >
                                                        <span>🌐</span>
                                                        <span>{translatingCommentIds.has(comment.id) ? t('detail.translating') : (translatedComments[comment.id] ? t('detail.originalView') : t('detail.translateView'))}</span>
                                                    </button>

                                                    {user && user.id === comment.user_id && (
                                                        <button
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className="text-[11px] font-bold text-stone-300 hover:text-rose-500 transition-colors flex items-center gap-1"
                                                        >
                                                            <Trash2 className="w-3 h-3" /> {t('detail.delete')}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reply Input */}
                                    {replyTo?.id === comment.id && (
                                        <div className="ml-10 mt-2 bg-stone-50 rounded-xl border border-stone-200 p-3">
                                            <p className="text-[11px] text-stone-400 mb-1.5 font-bold">
                                                <CornerDownRight className="w-3 h-3 inline mr-1" />
                                                {t('detail.replyTo', { name: replyTo.name })}
                                            </p>
                                            <textarea
                                                value={replyContent}
                                                onChange={(e) => setReplyContent(e.target.value)}
                                                placeholder={t('detail.replyPlaceholder')}
                                                className="w-full h-[26px] text-sm text-stone-800 placeholder:text-stone-400 outline-none resize-none bg-transparent overflow-y-auto leading-normal py-0.5"
                                                autoFocus
                                            />
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button
                                                    onClick={() => { setReplyTo(null); setReplyContent(''); }}
                                                    className="px-3 py-1.5 text-xs font-bold text-stone-400 hover:text-stone-600"
                                                >
                                                    {t('detail.cancel')}
                                                </button>
                                                <button
                                                    onClick={handleSubmitReply}
                                                    disabled={!replyContent.trim() || isSubmitting}
                                                    className="px-4 py-1.5 bg-stone-800 text-white text-xs font-bold rounded-lg hover:bg-rose-500 transition-all disabled:opacity-40"
                                                >
                                                    {isSubmitting ? t('detail.submitReplyLoading') : t('detail.submitReply')}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Replies */}
                                    {getReplies(comment.id).length > 0 && (
                                        <div className="ml-10 mt-2 space-y-2">
                                            {getReplies(comment.id).map((reply) => (
                                                <div key={reply.id} className="bg-stone-50 rounded-xl border border-stone-100 p-4">
                                                    <div className="flex items-start gap-3">
                                                        <CornerDownRight className="w-4 h-4 text-stone-300 flex-shrink-0 mt-0.5" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-bold text-stone-700 text-xs">{reply.profiles?.display_name || 'Anonymous'}</span>
                                                                <span className="text-[10px] text-stone-400">{formatDate(reply.created_at)}</span>
                                                            </div>
                                                            <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">
                                                                {translatedComments[reply.id] || reply.content}
                                                            </p>
                                                            <div className="flex items-center gap-3 mt-2">
                                                                {/* Translate Reply */}
                                                                <button
                                                                    onClick={() => handleTranslateComment(reply.id, reply.content)}
                                                                    disabled={translatingCommentIds.has(reply.id)}
                                                                    className="text-[11px] font-black text-stone-400 hover:text-rose-500 transition-colors inline-flex items-center gap-0.5"
                                                                >
                                                                    <span>🌐</span>
                                                                    <span>{translatingCommentIds.has(reply.id) ? t('detail.translating') : (translatedComments[reply.id] ? t('detail.originalView') : t('detail.translateView'))}</span>
                                                                </button>

                                                                {user && user.id === reply.user_id && (
                                                                    <button
                                                                        onClick={() => handleDeleteComment(reply.id)}
                                                                        className="text-[11px] font-bold text-stone-300 hover:text-rose-500 transition-colors flex items-center gap-1"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" /> {t('detail.delete')}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <MessageSquare className="w-10 h-10 text-stone-200 mx-auto mb-3" />
                                <p className="text-sm text-stone-400 font-bold">{t('detail.noCommentsTitle')}</p>
                                <p className="text-xs text-stone-300 mt-1">{t('detail.noCommentsDesc')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
