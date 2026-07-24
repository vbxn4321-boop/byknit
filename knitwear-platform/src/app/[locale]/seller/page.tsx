'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { createClient } from '@/utils/supabase/client';
import { 
    LayoutDashboard, 
    ShoppingBag, 
    Truck, 
    AlertCircle, 
    Receipt, 
    Settings, 
    Lock,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';

// Import subcomponents
import { SellerSidebar } from '@/components/seller/SellerSidebar';
import { SellerDashboard } from '@/components/seller/SellerDashboard';
import { ProductManagement } from '@/components/seller/ProductManagement';
import { OrderManagement } from '@/components/seller/OrderManagement';
import { ClaimManagement } from '@/components/seller/ClaimManagement';
import { SettlementManagement } from '@/components/seller/SettlementManagement';
import { ShopSettings } from '@/components/seller/ShopSettings';

export type SellerTab = 'dashboard' | 'products' | 'orders' | 'claims' | 'settlement' | 'settings';

export default function SellerPage() {
    const locale = useLocale();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<SellerTab>('dashboard');

    useEffect(() => {
        const checkUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setProfile(profile);
            }
            setUser(user);
            setLoading(false);
        };
        checkUser();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8FBC8F]"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl shadow-xl border border-stone-100 transition-all hover:shadow-2xl">
                    <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-500">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-stone-800 mb-3">
                        {locale === 'ko' ? '판매자 전용 공간입니다' : 'Seller Space Only'}
                    </h1>
                    <p className="text-stone-500 mb-8 leading-relaxed text-sm">
                        {locale === 'ko' 
                            ? '실물 상품 등록 및 주문 배송 관리를 하려면 바이니트 판매자 계정으로 로그인이 필요합니다.' 
                            : 'To manage physical products and orders, please sign in with your byKnit seller account.'}
                    </p>
                    <Link 
                        href={`/${locale}/login?next=seller`}
                        className="w-full py-4 px-6 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                        <span>{locale === 'ko' ? '로그인 하러가기' : 'Go to Sign In'}</span>
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        );
    }

    if (profile?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center bg-white p-8 rounded-3xl shadow-xl border border-stone-100 transition-all hover:shadow-2xl">
                    <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-500">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-stone-800 mb-3">
                        {locale === 'ko' ? '접근 권한이 없습니다' : 'Access Denied'}
                    </h1>
                    <p className="text-stone-500 mb-8 leading-relaxed text-sm">
                        {locale === 'ko' 
                            ? '이 공간은 입점된 판매자 및 관리자 계정만 이용할 수 있습니다. 권한 변경이 필요한 경우 관리자에게 문의해 주세요.' 
                            : 'This area is restricted to registered sellers and administrator accounts only.'}
                    </p>
                    <Link 
                        href={`/${locale}`}
                        className="w-full py-4 px-6 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                        <span>{locale === 'ko' ? '홈으로 돌아가기' : 'Back to Home'}</span>
                    </Link>
                </div>
            </div>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <SellerDashboard setActiveTab={setActiveTab} locale={locale} />;
            case 'products':
                return <ProductManagement locale={locale} />;
            case 'orders':
                return <OrderManagement locale={locale} />;
            case 'claims':
                return <ClaimManagement locale={locale} />;
            case 'settlement':
                return <SettlementManagement locale={locale} />;
            case 'settings':
                return <ShopSettings locale={locale} />;
            default:
                return <SellerDashboard setActiveTab={setActiveTab} locale={locale} />;
        }
    };

    return (
        <div className="min-h-screen bg-[#FAF9F6] flex flex-col md:flex-row">
            {/* Sidebar */}
            <SellerSidebar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                locale={locale} 
                userEmail={user.email}
            />

            {/* Main Content Area */}
            <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
                {renderTabContent()}
            </main>
        </div>
    );
}
