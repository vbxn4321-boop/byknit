'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Gift, Sparkles } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface CreditPopupManagerProps {
    isAuth: boolean;
}

export function CreditPopupManager({ isAuth }: CreditPopupManagerProps) {
    const router = useRouter();
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const [dontShowToday, setDontShowToday] = useState(false);

    const [isNewUser, setIsNewUser] = useState(false);
    const [credits, setCredits] = useState(0);
    const [userId, setUserId] = useState<string | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!isAuth) {
                setLoadingProfile(false);
                return;
            }

            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setLoadingProfile(false);
                    return;
                }
                setUserId(user.id);

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('created_at, credits')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setCredits(profile.credits || 0);

                    // A user is new if they registered in the last 10 minutes
                    const createdTime = new Date(profile.created_at).getTime();
                    const now = new Date().getTime();
                    const isWithinSignupWindow = (now - createdTime) < 10 * 60 * 1000; 

                    // Or if they haven't seen the signup gift popup yet
                    const hasSeenGift = localStorage.getItem(`hasSeenSignupGift_${user.id}`);
                    
                    if (isWithinSignupWindow && !hasSeenGift) {
                        setIsNewUser(true);
                    } else {
                        setIsNewUser(false);
                    }
                }
            } catch (err) {
                console.error('Error fetching profile in credit popup:', err);
            } finally {
                setLoadingProfile(false);
            }
        };

        fetchUserProfile();
    }, [isAuth]);

    useEffect(() => {
        if (loadingProfile) return;

        const timer = setTimeout(() => {
            const hideUntil = localStorage.getItem('hideCreditPopupUntil_byknit');
            const now = new Date().getTime();

            // If there's a valid hideUntil timestamp in the future, don't show.
            if (hideUntil && parseInt(hideUntil, 10) > now) {
                return;
            }

            // Session check: only show once per tab session
            const hasSeenSessionPopup = sessionStorage.getItem('hasSeenWelcomePopup_byknit');
            if (hasSeenSessionPopup) {
                return;
            }

            if (isAuth) {
                setIsUserModalOpen(true);
            } else {
                setIsGuestModalOpen(true);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [isAuth, loadingProfile]);

    const handleClose = () => {
        if (dontShowToday) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            localStorage.setItem('hideCreditPopupUntil_byknit', tomorrow.getTime().toString());
        }
        
        // Save that they have seen the welcome/signup gift modal
        if (isAuth && isNewUser && userId) {
            localStorage.setItem(`hasSeenSignupGift_${userId}`, 'true');
        }

        // Save session flag so they don't see any popups again in this session
        sessionStorage.setItem('hasSeenWelcomePopup_byknit', 'true');

        setIsUserModalOpen(false);
        setIsGuestModalOpen(false);
    };

    const handleActionClick = () => {
        handleClose();
        if (!isAuth) {
            router.push('/ko/login');
        }
    };

    if (!isUserModalOpen && !isGuestModalOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/20 animate-in fade-in duration-300"
                onClick={handleClose}
            />
            <div className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                <div className="absolute top-6 right-6">
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-cream-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-brown-400" />
                    </button>
                </div>

                <div className="p-10 pb-6 space-y-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-4 bg-rose-50 rounded-3xl">
                            {isAuth ? (
                                isNewUser ? (
                                    <Gift className="w-12 h-12 text-rose-500" />
                                ) : (
                                    <Sparkles className="w-12 h-12 text-rose-500" />
                                )
                            ) : (
                                <Sparkles className="w-12 h-12 text-rose-500" />
                            )}
                        </div>
                        <h3 className="text-2xl font-bold text-brown-800">
                            {isAuth ? (
                                isNewUser ? '축하합니다! 1,000 크레딧 지급 완료' : '반가워요! 다시 오셨군요 🧶'
                            ) : (
                                '로그인하고 1,000 크레딧 받기'
                            )}
                        </h3>
                    </div>

                    <div className="space-y-4 text-brown-600 leading-relaxed text-center">
                        <p>
                            {isAuth ? (
                                isNewUser ? 'byKnit에 오신 것을 환영합니다!' : '오늘도 byKnit와 함께 나만의 특별한 도안을 디자인해 보세요.'
                            ) : (
                                'byKnit에 오신 것을 환영합니다!'
                            )}
                        </p>
                        <div className="bg-cream-50 p-6 rounded-2xl border border-tan-100 text-sm font-medium">
                            {isAuth ? (
                                isNewUser ? (
                                    <>
                                        자유롭게 AI 기능을 체험해 볼 수 있도록 <br/>
                                        <span className="text-rose-500 text-base font-bold">1,000 크레딧</span>이 지급되었습니다.
                                    </>
                                ) : (
                                    <>
                                        현재 보유하신 크레딧은<br/>
                                        <span className="text-rose-500 text-base font-bold">{credits.toLocaleString()} 크레딧</span>입니다.
                                    </>
                                )
                            ) : (
                                <>
                                    구글 계정 또는 회원가입 및 로그인하시면 <br/>
                                    AI 분석 기능을 즉시 사용하실 수 있는 <span className="text-rose-500 font-bold text-base">1,000 크레딧</span>을 드립니다.<br/><br/>
                                    <span className="text-xs text-brown-400">*로그인하지 않은 비회원 상태에서는 크레딧이 지급되지 않습니다.</span>
                                </>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleActionClick}
                        className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl transition-all shadow-md active:scale-95"
                    >
                        {isAuth ? (
                            isNewUser ? '감사합니다, 지금 시작하기' : '오늘의 뜨개 시작하기'
                        ) : (
                            'Google 계정 또는 가입 / 로그인하기'
                        )}
                    </button>
                </div>
                
                {/* 하루 동안 보지 않기 영역 */}
                <div className="bg-cream-50 px-8 py-4 border-t border-cream-100 flex justify-end">
                    <label className="flex items-center space-x-2 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-5 h-5 border-2 border-brown-300 rounded md:bg-white group-hover:border-rose-400 transition-colors">
                            <input
                                type="checkbox"
                                className="absolute opacity-0 cursor-pointer"
                                checked={dontShowToday}
                                onChange={(e) => setDontShowToday(e.target.checked)}
                            />
                            {dontShowToday && (
                                <svg className="w-3 h-3 text-rose-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                        <span className="text-sm text-brown-600 font-medium group-hover:text-brown-800 transition-colors select-none">
                            하루 동안 보지 않기
                        </span>
                    </label>
                </div>
            </div>
        </div>
    );
}
