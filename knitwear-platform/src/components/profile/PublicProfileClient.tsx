'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { Settings, Heart, MessageCircle, MapPin, Grid, List as ListIcon, X, Eye } from 'lucide-react';
import { Pattern, Profile } from '@/types';
import { toggleFollow } from '@/app/actions/social';
import { PatternDetailClient } from '../marketplace/PatternDetailClient';

interface PublicProfileClientProps {
    profile: Profile & { follower_count: number; following_count?: number };
    patterns: Pattern[];
    viewer: User | null;
    initialIsFollowing: boolean;
    locale: string;
}

export function PublicProfileClient({ profile, patterns, viewer, initialIsFollowing, locale }: PublicProfileClientProps) {
    const router = useRouter();
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [followerCount, setFollowerCount] = useState(profile.follower_count || 0);
    const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const handleFollow = async () => {
        if (!viewer) return router.push(`/${locale}/login`);

        // Optimistic update
        const newStatus = !isFollowing;
        setIsFollowing(newStatus);
        setFollowerCount(prev => newStatus ? prev + 1 : prev - 1);

        const result = await toggleFollow(profile.id);
        if (result.error) {
            // Revert on error
            setIsFollowing(!newStatus);
            setFollowerCount(prev => !newStatus ? prev + 1 : prev - 1);
            alert('Failed to update follow status');
        } else {
            router.refresh(); // Sync server state
        }
    };

    const isOwner = viewer?.id === profile.id;

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header Section */}
            <div className="px-5 py-8 md:py-12 border-b border-gray-100">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-12">
                    {/* Avatar */}
                    <div className="w-24 h-24 md:w-36 md:h-36 rounded-full border-2 border-gray-100 p-1 flex-shrink-0">
                        <div className="w-full h-full rounded-full bg-gray-200 overflow-hidden relative">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.display_name || ''} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400 font-bold bg-gray-100 uppercase">
                                    {(profile.display_name || profile.username || 'U')[0]}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col items-center md:items-start gap-4">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {profile.display_name || profile.username}
                            </h1>

                            {/* Actions */}
                            <div className="flex gap-2">
                                {isOwner ? (
                                    <Link
                                        href={`/${locale}/profile`}
                                        className="px-4 py-1.5 bg-gray-100 text-gray-700 font-semibold rounded-lg text-sm hover:bg-gray-200 transition-colors"
                                    >
                                        {locale === 'ko' ? '프로필 편집' : 'Edit profile'}
                                    </Link>
                                ) : (
                                    <button
                                        onClick={handleFollow}
                                        className={`px-6 py-1.5 rounded-lg text-sm font-semibold transition-all ${isFollowing
                                            ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-500'
                                            : 'bg-blue-500 text-white hover:bg-blue-600'
                                            }`}
                                    >
                                        {isFollowing
                                            ? (locale === 'ko' ? '팔로잉' : 'Following')
                                            : (locale === 'ko' ? '팔로우' : 'Follow')
                                        }
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-8 text-base">
                            <div className="flex flex-col md:flex-row md:gap-1 items-center">
                                <span className="font-bold text-gray-900">{patterns.length}</span>
                                <span className="text-gray-500">{locale === 'ko' ? '게시물' : 'posts'}</span>
                            </div>
                            <div className="flex flex-col md:flex-row md:gap-1 items-center">
                                <span className="font-bold text-gray-900">{followerCount}</span>
                                <span className="text-gray-500">{locale === 'ko' ? '팔로워' : 'followers'}</span>
                            </div>
                            {/* Mocking Following count for now if not available in profile */}
                            <div className="flex flex-col md:flex-row md:gap-1 items-center">
                                <span className="font-bold text-gray-900">{profile.following_count || 0}</span>
                                <span className="text-gray-500">{locale === 'ko' ? '팔로우' : 'following'}</span>
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="text-center md:text-left text-sm md:text-base text-gray-700 max-w-md">
                            {profile.bio || (locale === 'ko' ? '소개가 없습니다.' : 'No bio available.')}
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid/List Toggle (Optional, sticking to Grid per request but adding UI for typical insta feel) */}
            <div className="flex items-center justify-center border-b border-gray-100 mb-1">
                <button
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center gap-2 px-12 py-3 border-b-2 transition-colors ${viewMode === 'grid'
                        ? 'border-gray-900 text-gray-900'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <Grid size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">{locale === 'ko' ? '게시물' : 'POSTS'}</span>
                </button>
            </div>

            {/* Content Grid */}
            {patterns.length === 0 ? (
                <div className="py-20 text-center text-gray-500">
                    <div className="w-16 h-16 mx-auto mb-4 border-2 border-gray-300 rounded-full flex items-center justify-center text-gray-300">
                        <Grid size={32} />
                    </div>
                    <p>{locale === 'ko' ? '아직 게시물이 없습니다.' : 'No posts yet.'}</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-1 md:gap-8 p-1 md:p-0">
                    {patterns.map((pattern) => (
                        <div
                            key={pattern.id}
                            onClick={() => setSelectedPatternId(pattern.id)}
                            className="bg-gray-100 aspect-square relative group overflow-hidden block cursor-pointer"
                        >
                            {pattern.preview_images?.[0] || pattern.thumbnail_url ? (
                                <img
                                    src={pattern.preview_images?.[0] || pattern.thumbnail_url || ''}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                                    No Image
                                </div>
                            )}

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold pointer-events-none md:pointer-events-auto">
                                <div className="flex items-center gap-2">
                                    <Heart className="fill-white w-5 h-5" />
                                    <span>{pattern.like_count || 0}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MessageCircle className="fill-white w-5 h-5" />
                                    <span>{pattern.review_count || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pattern Detail Modal */}
            {selectedPatternId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-brown-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
                        <button
                            onClick={() => setSelectedPatternId(null)}
                            className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-brown-600 shadow-md transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <div className="flex-1 overflow-y-auto">
                            <PatternDetailClient
                                patternId={selectedPatternId}
                                locale={locale}
                                user={viewer}
                                isModal={true}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
