'use client';

import { useState, useEffect } from 'react';
import { X, Gift, Sparkles } from 'lucide-react';

interface CreditPopupManagerProps {
    isAuth: boolean;
}

export function CreditPopupManager({ isAuth }: CreditPopupManagerProps) {
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);

    useEffect(() => {
        // Wait a moment before showing popup to avoid immediate flash
        const timer = setTimeout(() => {
            const hasSeenPopup = localStorage.getItem('hasSeenCreditPopup_byknit');
            if (!hasSeenPopup) {
                if (isAuth) {
                    setIsUserModalOpen(true);
                } else {
                    setIsGuestModalOpen(true);
                }
                localStorage.setItem('hasSeenCreditPopup_byknit', 'true');
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [isAuth]);

    const handleCloseUser = () => setIsUserModalOpen(false);
    const handleCloseGuest = () => setIsGuestModalOpen(false);

    if (!isUserModalOpen && !isGuestModalOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-brown-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={isUserModalOpen ? handleCloseUser : handleCloseGuest}
            />
            <div className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                <div className="absolute top-6 right-6">
                    <button
                        onClick={isUserModalOpen ? handleCloseUser : handleCloseGuest}
                        className="p-2 hover:bg-cream-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-brown-400" />
                    </button>
                </div>

                <div className="p-10 space-y-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-4 bg-rose-50 rounded-3xl">
                            {isAuth ? (
                                <Gift className="w-12 h-12 text-rose-500" />
                            ) : (
                                <Sparkles className="w-12 h-12 text-rose-500" />
                            )}
                        </div>
                        <h3 className="text-2xl font-bold text-brown-800">
                            {isAuth ? '축하합니다! 1,000 크레딧 지급 완료' : '가입 없이 1,000 크레딧 체험하기'}
                        </h3>
                    </div>

                    <div className="space-y-4 text-brown-600 leading-relaxed text-center">
                        <p>
                            {isAuth ? 'byKnit에 오신 것을 환영합니다!' : 'byKnit에 오신 것을 환영합니다!'}
                        </p>
                        <div className="bg-cream-50 p-6 rounded-2xl border border-tan-100 text-sm font-medium">
                            {isAuth ? (
                                <>
                                    자유롭게 AI 기능을 체험해 볼 수 있도록 <br/>
                                    <span className="text-rose-500 text-base font-bold">1,000 크레딧</span>이 지급되었습니다.
                                </>
                            ) : (
                                <>
                                    로그인하지 않아도 즉시 <span className="text-rose-500 font-bold text-base">1,000 크레딧</span>을<br/>
                                    사용하여 뜨개질 도안 변환 AI 기능을 테스트해 볼 수 있습니다.<br/><br/>
                                    <span className="text-xs text-brown-400">*로그인하시면 작업 내역이 안전하게 보관됩니다.</span>
                                </>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={isUserModalOpen ? handleCloseUser : handleCloseGuest}
                        className="w-full py-4 bg-gradient-to-r from-rose-400 to-peach-400 hover:from-rose-500 hover:to-peach-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-rose-200 hover:shadow-rose-300 active:scale-95"
                    >
                        {isAuth ? '감사합니다, 지금 시작하기' : '지금 바로 무료 체험하기'}
                    </button>
                </div>
            </div>
        </div>
    );
}
