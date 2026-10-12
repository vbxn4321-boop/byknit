'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Package, Store, Lock, AlertTriangle, BarChart3 } from 'lucide-react';

export default function AdminLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = use(params);
    const pathname = usePathname();
    const isSellers = pathname.includes('/admin/sellers');
    const isKyc = pathname.includes('/admin/kyc');
    const isAnalytics = pathname.includes('/admin/analytics');

    const [isAuthorized, setIsAuthorized] = useState(false);
    const [authUser, setAuthUser] = useState<any>(null);
    const [authProfile, setAuthProfile] = useState<any>(null);
    const [authChecking, setAuthChecking] = useState(true);

    useEffect(() => {
        const checkAdminAuth = async () => {
            if (typeof window === 'undefined') return;

            const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();

            // 1. Check if user is logged in
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setAuthChecking(false);
                return;
            }
            setAuthUser(user);

            // 2. Check if user has admin role in DB
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, display_name')
                .eq('id', user.id)
                .single();

            setAuthProfile(profile);

            if (profile?.role === 'admin') {
                setIsAuthorized(true);
            }

            setAuthChecking(false);
        };
        checkAdminAuth();
    }, []);

    if (authChecking) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center font-sans">
                <span className="text-stone-400 text-sm font-bold">어드민 권한 확인 중...</span>
            </div>
        );
    }

    if (!authUser) {
        return (
            <div className="min-h-screen bg-[#F9F9F8] flex items-center justify-center p-6 font-sans">
                <div className="max-w-md w-full p-8 bg-white rounded-3xl border border-stone-200 shadow-soft text-stone-700 space-y-6">
                    <div className="text-center space-y-3">
                        <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-100">
                            <Lock size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-stone-900">로그인이 필요합니다</h2>
                        <p className="text-sm text-stone-400 font-medium leading-relaxed">
                            관리자 페이지에 접근하려면 로그인해야 합니다.
                        </p>
                    </div>
                    <Link
                        href={`/${locale}/login`}
                        className="w-full py-3.5 bg-stone-900 hover:bg-stone-950 text-white rounded-2xl text-sm font-bold transition-all shadow-soft block text-center"
                    >
                        로그인 하러 가기
                    </Link>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-[#F9F9F8] flex items-center justify-center p-6 font-sans">
                <div className="max-w-md w-full p-8 bg-white rounded-3xl border border-stone-200 shadow-soft text-stone-700 space-y-6">
                    <div className="text-center space-y-3">
                        <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-100">
                            <AlertTriangle size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-stone-900">접근 권한이 없습니다</h2>
                        <p className="text-sm text-stone-400 font-medium leading-relaxed">
                            본 페이지는 바이니트 본사 관리자 전용 보안 구역입니다.<br />
                            일반 계정으로는 열람이 불가합니다.
                        </p>
                        <p className="text-xs text-stone-300 font-mono">
                            현재 계정: {authUser.email} (Role: {authProfile?.role || 'user'})
                        </p>
                    </div>
                    <Link
                        href={`/${locale}`}
                        className="w-full py-3.5 bg-stone-900 hover:bg-stone-950 text-white rounded-2xl text-sm font-bold transition-all shadow-soft block text-center"
                    >
                        메인 홈으로 돌아가기
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 flex">
            {/* Admin Sidebar */}
            <aside className="w-64 bg-white border-r border-stone-200 flex flex-col hidden md:flex shrink-0">
                <div className="p-6 border-b border-stone-200">
                    <div className="flex items-center gap-2 text-rose-600 font-black text-lg">
                        <Shield size={24} />
                        <span>Admin Console</span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1 font-bold">통합 관리자 시스템</p>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    <Link 
                        href={`/${locale}/admin/sellers`}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                            isSellers 
                                ? 'bg-rose-50 text-rose-700' 
                                : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                        }`}
                    >
                        <Store size={18} />
                        <span>통합 판매자 관리</span>
                    </Link>
                    <Link 
                        href={`/${locale}/admin/kyc`}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                            isKyc 
                                ? 'bg-rose-50 text-rose-700' 
                                : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                        }`}
                    >
                        <Shield size={18} />
                        <span>바이니트 입점 심사</span>
                    </Link>
                    <Link 
                        href={`/${locale}/admin/analytics`}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                            isAnalytics 
                                ? 'bg-rose-50 text-rose-700' 
                                : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                        }`}
                    >
                        <BarChart3 size={18} />
                        <span>방문자/회원 활동</span>
                    </Link>
                </nav>
                <div className="p-4 border-t border-stone-200">
                    <div className="bg-stone-50 rounded-xl p-4 text-xs font-bold text-stone-500 text-center">
                        최고 관리자 권한으로 접속 중입니다.
                    </div>
                </div>
            </aside>

            {/* Mobile Header (fallback) */}
            <div className="md:hidden flex flex-col w-full absolute top-0 left-0 bg-white border-b border-stone-200 z-10">
                <div className="flex p-4 gap-2">
                    <Link 
                        href={`/${locale}/admin/sellers`}
                        className={`flex-1 py-2 text-center text-xs font-bold rounded-lg ${isSellers ? 'bg-rose-50 text-rose-600' : 'bg-stone-100 text-stone-500'}`}
                    >
                        판매자 관리
                    </Link>
                    <Link 
                        href={`/${locale}/admin/kyc`}
                        className={`flex-1 py-2 text-center text-xs font-bold rounded-lg ${isKyc ? 'bg-rose-50 text-rose-600' : 'bg-stone-100 text-stone-500'}`}
                    >
                        입점 심사
                    </Link>
                    <Link 
                        href={`/${locale}/admin/analytics`}
                        className={`flex-1 py-2 text-center text-xs font-bold rounded-lg ${isAnalytics ? 'bg-rose-50 text-rose-600' : 'bg-stone-100 text-stone-500'}`}
                    >
                        방문/활동
                    </Link>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 h-screen overflow-y-auto w-full md:w-auto pt-16 md:pt-0 bg-[#F9F9F8]">
                {children}
            </main>
        </div>
    );
}
