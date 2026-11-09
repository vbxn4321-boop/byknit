'use client';

import React, { useState, useEffect, use } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function AdminSellerDetailLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string, sellerId: string }>;
}) {
    const { locale, sellerId } = use(params);
    const pathname = usePathname();
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState({ revenue: 0, views: 0, likes: 0, followers: 0 });

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient();
            const { data } = await supabase.from('profiles').select('avatar_url, display_name').eq('id', sellerId).single();
            setProfile(data);
            // Mock stats for the profile header to match Image 1
            setStats({ revenue: 0, views: 0, likes: 1, followers: 0 });
        };
        fetchData();
    }, [sellerId]);

    const tabs = [
        { name: '대시보드', href: `/${locale}/admin/sellers/${sellerId}/dashboard`, isActive: pathname.includes('/dashboard') || pathname === `/${locale}/admin/sellers/${sellerId}` },
        { name: '상품 관리', href: `/${locale}/admin/sellers/${sellerId}/products`, isActive: pathname.includes('/products') },
        { name: '주문 및 배송', href: `/${locale}/admin/sellers/${sellerId}/orders`, isActive: pathname.includes('/orders') },
        { name: '클레임 & CS', href: `/${locale}/admin/sellers/${sellerId}/cs`, isActive: pathname.includes('/cs') },
        { name: '매출 관리', href: `/${locale}/admin/sellers/${sellerId}/sales`, isActive: pathname.includes('/sales') },
        { name: '정산 관리', href: `/${locale}/admin/sellers/${sellerId}/settlements`, isActive: pathname.includes('/settlements') }
    ];

    if (!profile) return <div className="p-10">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#FAF9F6]">
            {/* Minimal Header for Back Navigation */}
            <div className="bg-white border-b border-stone-200 px-6 py-4">
                <Link href={`/${locale}/admin/sellers`} className="inline-flex items-center gap-2 text-sm text-stone-500 font-bold hover:text-stone-900 transition-colors">
                    <ArrowLeft size={16} />
                    판매자 리스트로 돌아가기
                </Link>
            </div>

            {/* Profile Header (From Image 1) */}
            <div className="max-w-4xl mx-auto px-4 pt-12 pb-8">
                <div className="text-center mb-8">
                    <div className="w-24 h-24 mx-auto bg-stone-100 rounded-full border border-stone-200 shadow-sm flex items-center justify-center overflow-hidden mb-4 text-stone-400 font-black text-2xl">
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                        ) : (
                            profile.display_name?.charAt(0).toUpperCase() || 'C'
                        )}
                    </div>
                    <h1 className="text-2xl font-black text-stone-800 mb-1">
                        {profile.display_name || sellerId}
                    </h1>
                </div>

                {/* Stats row from Image 1 */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm text-center border border-stone-100">
                        <div className="text-2xl font-black text-stone-800 mb-1">{stats.revenue}</div>
                        <div className="text-xs text-stone-400 font-bold">크레딧 판매</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm text-center border border-stone-100">
                        <div className="text-2xl font-black text-stone-800 mb-1">{stats.views}</div>
                        <div className="text-xs text-stone-400 font-bold">조회수</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm text-center border border-stone-100">
                        <div className="text-2xl font-black text-rose-500 mb-1">{stats.likes}</div>
                        <div className="text-xs text-rose-300 font-bold">좋아요</div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm text-center border border-stone-100">
                        <div className="text-2xl font-black text-indigo-500 mb-1">{stats.followers}</div>
                        <div className="text-xs text-indigo-300 font-bold">팔로워</div>
                    </div>
                </div>

                {/* Horizontal Tabs */}
                <div className="flex items-center justify-center gap-2 mb-8 border-b border-stone-200 pb-px">
                    {tabs.map(tab => (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
                                tab.isActive 
                                    ? 'border-stone-900 text-stone-900' 
                                    : 'border-transparent text-stone-400 hover:text-stone-600'
                            }`}
                        >
                            {tab.name}
                        </Link>
                    ))}
                </div>

                {/* Tab Content (Seller Center Information) */}
                <div className="bg-transparent">
                    {children}
                </div>
            </div>
        </div>
    );
}
