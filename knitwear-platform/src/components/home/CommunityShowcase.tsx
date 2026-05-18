import { getPosts, getPopularPosts } from '@/app/actions/community';
import { MessageSquare, Heart, TrendingUp, Clock, User as UserIcon, Crown } from 'lucide-react';
import Link from 'next/link';

interface Props {
    locale: string;
    userId: string | null;
}

export async function CommunityShowcase({ locale, userId }: Props) {
    const [latestPosts, popularPosts] = await Promise.all([
        getPosts(locale),
        getPopularPosts(5)
    ]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return '방금';
        if (mins < 60) return `${mins}분 전`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}시간 전`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}일 전`;
        return `${date.getMonth() + 1}.${date.getDate()}`;
    };

    const getTitle = (title: any): string => {
        if (!title) return 'Untitled';
        if (typeof title === 'string') return title;
        return title[locale] || title.ko || title.en || 'Untitled';
    };

    return (
        <div className="grid md:grid-cols-3 gap-6">
            {/* 최신 게시물 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h3 className="flex items-center gap-2 text-white font-black text-sm mb-5">
                    <Clock className="w-4 h-4 text-rose-400" />
                    최신 게시물
                </h3>
                <div className="space-y-3">
                    {latestPosts.length > 0 ? (
                        latestPosts.slice(0, 5).map((post: any) => (
                            <Link
                                key={post.id}
                                href={`/${locale}/community`}
                                className="block group"
                            >
                                <p className="text-sm text-stone-300 font-bold truncate group-hover:text-rose-400 transition-colors">
                                    {post.title}
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] text-stone-500">{post.profiles?.display_name || 'Anonymous'}</span>
                                    <span className="text-[10px] text-stone-600">{formatDate(post.created_at)}</span>
                                    <span className="flex items-center gap-0.5 text-[10px] text-stone-500">
                                        <Heart className="w-2.5 h-2.5" /> {post.likes?.[0]?.count || 0}
                                    </span>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="py-8 text-center">
                            <MessageSquare className="w-8 h-8 text-stone-600 mx-auto mb-2" />
                            <p className="text-xs text-stone-500 font-bold">아직 게시글이 없어요</p>
                            <p className="text-[10px] text-stone-600 mt-1">첫 번째 글을 작성해 보세요!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 인기 게시물 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h3 className="flex items-center gap-2 text-white font-black text-sm mb-5">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    인기 게시물
                    <span className="ml-auto text-[9px] text-stone-500 font-bold uppercase tracking-widest">All Languages</span>
                </h3>
                <div className="space-y-3">
                    {popularPosts.length > 0 ? (
                        popularPosts.slice(0, 5).map((post: any, idx: number) => (
                            <div key={post.id} className="flex items-start gap-2.5 group cursor-pointer">
                                <span className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-black ${
                                    idx === 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-stone-500'
                                }`}>
                                    {idx === 0 ? '👑' : idx + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-stone-300 font-bold truncate group-hover:text-rose-400 transition-colors">
                                        {post.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-stone-500">{post.profiles?.display_name || '-'}</span>
                                        <span className="flex items-center gap-0.5 text-[10px] text-rose-400 font-bold">
                                            <Heart className="w-2.5 h-2.5" /> {post.likes?.[0]?.count || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-8 text-center">
                            <TrendingUp className="w-8 h-8 text-stone-600 mx-auto mb-2" />
                            <p className="text-xs text-stone-500 font-bold">인기 게시물이 없어요</p>
                            <p className="text-[10px] text-stone-600 mt-1">활동이 쌓이면 여기에 표시됩니다!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 내 활동 내역 */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h3 className="flex items-center gap-2 text-white font-black text-sm mb-5">
                    <UserIcon className="w-4 h-4 text-emerald-400" />
                    내 활동 내역
                </h3>
                {userId ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-xl font-black text-white">0</p>
                                <p className="text-[10px] text-stone-400 font-bold mt-1">게시글</p>
                            </div>
                            <div className="text-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-xl font-black text-white">0</p>
                                <p className="text-[10px] text-stone-400 font-bold mt-1">좋아요</p>
                            </div>
                            <div className="text-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-xl font-black text-white">0</p>
                                <p className="text-[10px] text-stone-400 font-bold mt-1">팔로워</p>
                            </div>
                        </div>
                        <Link
                            href={`/${locale}/community/write`}
                            className="block w-full text-center px-4 py-3 bg-rose-500 text-white text-sm font-bold rounded-xl hover:bg-rose-600 transition-all"
                        >
                            새 글 작성하기
                        </Link>
                    </div>
                ) : (
                    <div className="py-8 text-center">
                        <UserIcon className="w-8 h-8 text-stone-600 mx-auto mb-2" />
                        <p className="text-xs text-stone-500 font-bold">로그인하면 활동을 확인할 수 있어요</p>
                        <Link 
                            href={`/${locale}/login`}
                            className="inline-block mt-3 px-5 py-2 bg-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/20 transition-all border border-white/10"
                        >
                            로그인
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
