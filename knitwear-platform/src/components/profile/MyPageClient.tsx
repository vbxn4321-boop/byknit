'use client';

import { useState, useTransition } from 'react';
import { 
    Mail, Phone, Settings, ChevronDown, ChevronUp, ShoppingBag, 
    Heart, MessageSquare, ShieldAlert, Sparkles, HelpCircle, 
    Bell, UserX, LogOut, ArrowRight, Save, Coins, Lock, CheckCircle
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { signout } from '@/app/actions/auth';
import { ProfileForm } from './ProfileForm';
import { PasswordChangeForm } from './PasswordChangeForm';
import { DeleteAccountSection } from './DeleteAccountSection';
import { OrderList } from './OrderList';
import { CreditHistory } from './CreditHistory';
import { Link } from '@/i18n/navigation';

interface Props {
    profile: any;
    orders: any[];
    likedPatterns: any[];
    userPosts: any[];
    user: User;
    locale: string;
    translations: {
        title: string;
        deleteAccount: string;
        deleteConfirm: string;
        ordersTab: string;
        commentsTab: string;
    };
}

export function MyPageClient({ 
    profile, orders, likedPatterns, userPosts, user, locale, translations 
}: Props) {
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    // 알림 수신 설정 상태
    const [notifComment, setNotifComment] = useState(true);
    const [notifFollow, setNotifFollow] = useState(true);
    const [notifMarketing, setNotifMarketing] = useState(profile?.marketing_consent ?? false);

    const toggleSection = (section: string) => {
        setActiveSection(prev => prev === section ? null : section);
    };

    const handleSignOut = () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            startTransition(async () => {
                await signout();
            });
        }
    };

    const getPatternTitle = (title: any): string => {
        if (!title) return 'Untitled';
        if (typeof title === 'string') return title;
        return title[locale] || title.ko || title.en || 'Untitled';
    };

    const maskPhone = (phoneStr: string | undefined | null): string => {
        const val = phoneStr || '+82 10-9026-5637';
        // Handle standard dash format like +82 10-9026-5637 or 010-9026-5637
        const dashRegex = /(\+?\d{1,4}\s?\d{1,4})[- ](\d{3,4})[- ](\d{4})/;
        if (dashRegex.test(val)) {
            return val.replace(dashRegex, '$1-****-$3');
        }
        
        const localDashRegex = /(\d{2,4})[- ](\d{3,4})[- ](\d{4})/;
        if (localDashRegex.test(val)) {
            return val.replace(localDashRegex, '$1-****-$3');
        }

        const rawDigitsRegex = /^(\d{3})(\d{3,4})(\d{4})$/;
        if (rawDigitsRegex.test(val)) {
            return val.replace(rawDigitsRegex, '$1****$3');
        }

        if (val.length > 7) {
            return val.slice(0, val.length - 8) + '****' + val.slice(val.length - 4);
        }

        return val;
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            {/* Header / Profile Card */}
            <div className="border-b border-stone-200 pb-8 mb-8">
                <h1 className="text-4xl font-extrabold text-stone-900 tracking-tight mb-4">
                    {profile?.display_name || '도운'}
                </h1>
                
                <div className="space-y-2.5 mb-6">
                    <div className="flex items-center gap-2.5 text-stone-500 text-sm">
                        <Mail className="w-4 h-4 text-stone-400" />
                        <span>{profile?.email || user.email}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-stone-500 text-sm">
                        <Phone className="w-4 h-4 text-stone-400" />
                        <span>{maskPhone(profile?.phone)}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-stone-500 text-sm font-bold">
                        <Coins className="w-4 h-4 text-amber-500" />
                        <span className="text-stone-700">보유 크레딧:</span>
                        <span className="text-amber-600">{(profile?.credits || 0).toLocaleString()} 크레딧</span>
                    </div>
                </div>

                <button
                    onClick={() => toggleSection('edit_profile')}
                    className="inline-flex items-center gap-2 px-5 py-2 border border-stone-300 hover:border-stone-800 hover:bg-stone-50 text-stone-700 hover:text-stone-900 font-bold text-xs rounded-full transition-all cursor-pointer shadow-sm"
                >
                    <Settings className="w-3.5 h-3.5" />
                    정보 수정
                </button>

                {/* Smooth Expandable Profile Form */}
                {activeSection === 'edit_profile' && (
                    <div className="mt-6 p-6 bg-stone-50/50 rounded-3xl border border-stone-200/60 space-y-8 animate-fadeIn">
                        <ProfileForm profile={profile} locale={locale} />
                        <div className="border-t border-stone-200/60 pt-6">
                            <PasswordChangeForm />
                        </div>
                    </div>
                )}
            </div>

            {/* Menu List (마이페이지 목록들) */}
            <div className="divide-y divide-stone-200 border-t border-b border-stone-200">
                {/* 1. 주문 내역 (다운로드) */}
                <div className="py-2.5">
                    <button
                        onClick={() => toggleSection('orders')}
                        className="w-full flex items-center justify-between py-4 text-left font-bold text-stone-800 hover:text-rose-500 transition-colors cursor-pointer group"
                    >
                        <span className="text-[15px]">주문 내역 (다운로드)</span>
                        <div className="flex items-center gap-2 text-stone-400 group-hover:text-rose-500">
                            {orders.length > 0 && (
                                <span className="bg-rose-50 text-rose-500 text-xs px-2.5 py-0.5 rounded-full font-black">
                                    {orders.length}
                                </span>
                            )}
                            {activeSection === 'orders' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                    </button>
                    {activeSection === 'orders' && (
                        <div className="pb-6 pt-2 animate-fadeIn">
                            <OrderList initialOrders={orders} locale={locale} user={user} />
                        </div>
                    )}
                </div>

                {/* 2. 찜한 상품 */}
                <div className="py-2.5">
                    <button
                        onClick={() => toggleSection('wishlist')}
                        className="w-full flex items-center justify-between py-4 text-left font-bold text-stone-800 hover:text-rose-500 transition-colors cursor-pointer group"
                    >
                        <span className="text-[15px]">찜한 상품</span>
                        <div className="flex items-center gap-2 text-stone-400 group-hover:text-rose-500">
                            {likedPatterns.length > 0 && (
                                <span className="bg-rose-50 text-rose-500 text-xs px-2.5 py-0.5 rounded-full font-black">
                                    {likedPatterns.length}
                                </span>
                            )}
                            {activeSection === 'wishlist' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                    </button>
                    {activeSection === 'wishlist' && (
                        <div className="pb-6 pt-2 animate-fadeIn">
                            {likedPatterns.length > 0 ? (
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {likedPatterns.map((item) => {
                                        const pattern = item.patterns;
                                        if (!pattern) return null;
                                        return (
                                            <div key={item.id} className="p-4 bg-stone-50 border border-stone-200/60 rounded-2xl flex items-center gap-3">
                                                {pattern.thumbnail_url ? (
                                                    <img
                                                        src={pattern.thumbnail_url}
                                                        alt={getPatternTitle(pattern.title)}
                                                        className="w-12 h-12 rounded-xl object-cover border border-stone-100 flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-stone-100 flex-shrink-0">
                                                        <ShoppingBag className="w-5 h-5 text-stone-300" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-stone-800 text-xs truncate">{getPatternTitle(pattern.title)}</p>
                                                    <p className="text-[10px] text-stone-400 mt-0.5">
                                                        {pattern.difficulty} · {pattern.price_usd === 0 ? '무료' : `$${pattern.price_usd}`}
                                                    </p>
                                                </div>
                                                <Link
                                                    href={`/marketplace/${pattern.id}`}
                                                    className="px-3 py-1.5 bg-stone-800 text-white text-xs font-bold rounded-lg hover:bg-rose-500 transition-all flex-shrink-0"
                                                >
                                                    보기
                                                </Link>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                                    <Heart className="w-8 h-8 text-stone-200 mx-auto mb-2" />
                                    <p className="text-xs text-stone-400 font-bold">찜한 상품이 없습니다</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 3. 커뮤니티 활동 내역 */}
                <div className="py-2.5">
                    <button
                        onClick={() => toggleSection('community')}
                        className="w-full flex items-center justify-between py-4 text-left font-bold text-stone-800 hover:text-rose-500 transition-colors cursor-pointer group"
                    >
                        <span className="text-[15px]">커뮤니티 활동 내역</span>
                        <div className="flex items-center gap-2 text-stone-400 group-hover:text-rose-500">
                            {activeSection === 'community' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                    </button>
                    {activeSection === 'community' && (
                        <div className="pb-6 pt-2 space-y-6 animate-fadeIn">
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200/60 text-center">
                                <div>
                                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-0.5">작성 글</p>
                                    <p className="text-lg font-black text-stone-800">{userPosts.length}</p>
                                </div>
                                <div className="border-l border-stone-200/60">
                                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-0.5">누적 조회</p>
                                    <p className="text-lg font-black text-stone-800">
                                        {userPosts.reduce((acc, p) => acc + (p.views || 0), 0)}
                                    </p>
                                </div>
                            </div>

                            {/* User Posts List */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-black text-stone-400 uppercase tracking-wider">내가 쓴 게시글</h3>
                                {userPosts.length > 0 ? (
                                    <div className="divide-y divide-stone-100 bg-white border border-stone-200/60 rounded-2xl overflow-hidden shadow-sm">
                                        {userPosts.slice(0, 5).map((post) => (
                                            <Link
                                                key={post.id}
                                                href={`/community/${post.id}`}
                                                className="flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
                                            >
                                                <div className="min-w-0 flex-1 pr-4">
                                                    <p className="font-bold text-stone-800 text-sm truncate">{post.title}</p>
                                                    <p className="text-[10px] text-stone-400 mt-1">
                                                        👁️ 조회 {post.views || 0} · ❤️ 좋아요 {post.likes?.[0]?.count || 0} · 💬 댓글 {post.comments?.[0]?.count || 0}
                                                    </p>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-stone-300" />
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-stone-400 py-4 text-center">아직 작성한 게시글이 없습니다</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* 3.5. 크레딧 이용 내역 */}
                <div className="py-2.5">
                    <button
                        onClick={() => toggleSection('credit_history')}
                        className="w-full flex items-center justify-between py-4 text-left font-bold text-stone-800 hover:text-rose-500 transition-colors cursor-pointer group"
                    >
                        <span className="text-[15px]">크레딧 이용 내역</span>
                        <div className="flex items-center gap-2 text-stone-400 group-hover:text-rose-500">
                            {activeSection === 'credit_history' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                    </button>
                    {activeSection === 'credit_history' && (
                        <div className="pb-6 pt-2 animate-fadeIn">
                            <div className="border border-stone-200/60 rounded-2xl p-4 bg-white shadow-sm">
                                <CreditHistory userId={user.id} />
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. 알림 수신 설정 */}
                <div className="py-2.5">
                    <button
                        onClick={() => toggleSection('notifications_config')}
                        className="w-full flex items-center justify-between py-4 text-left font-bold text-stone-800 hover:text-rose-500 transition-colors cursor-pointer group"
                    >
                        <span className="text-[15px]">알림 수신 설정</span>
                        {activeSection === 'notifications_config' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {activeSection === 'notifications_config' && (
                        <div className="pb-6 pt-2 animate-fadeIn">
                            <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200/60 space-y-4">
                                {[
                                    { label: '새 댓글 알림', desc: '내가 쓴 게시글 및 답글에 새 댓글이 등록되면 종 아이콘 알림 수신', state: notifComment, setter: setNotifComment },
                                    { label: '팔로우 알림', desc: '내가 팔로우한 니터가 새로운 유용한 게시글을 발행하면 알림 수신', state: notifFollow, setter: setNotifFollow },
                                    { label: '마케팅 메일 및 이벤트 수신 동의', desc: 'byKnit 무료 배포 크레딧 이벤트와 혜택 소식 이메일 수신 동의', state: notifMarketing, setter: setNotifMarketing }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="font-bold text-xs text-stone-800">{item.label}</p>
                                            <p className="text-[10px] text-stone-400 mt-0.5">{item.desc}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                item.setter(!item.state);
                                            }}
                                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                item.state ? 'bg-rose-500' : 'bg-stone-200'
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                    item.state ? 'translate-x-4' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 5. 회원탈퇴 */}
                <div className="py-2.5">
                    <button
                        onClick={() => toggleSection('delete_account')}
                        className="w-full flex items-center justify-between py-4 text-left font-bold text-stone-800 hover:text-rose-500 transition-colors cursor-pointer group"
                    >
                        <span className="text-[15px]">회원탈퇴</span>
                        {activeSection === 'delete_account' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {activeSection === 'delete_account' && (
                        <div className="pb-6 pt-2 animate-fadeIn">
                            <DeleteAccountSection
                                title={translations.deleteAccount}
                                description={translations.deleteConfirm}
                                buttonText={translations.deleteAccount}
                                confirmMessage={translations.deleteConfirm}
                                locale={locale}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

