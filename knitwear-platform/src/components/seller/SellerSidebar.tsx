'use client';

import React, { useState } from 'react';
import { 
    LayoutDashboard, 
    ShoppingBag, 
    Truck, 
    AlertCircle, 
    Receipt, 
    Settings, 
    Menu, 
    X, 
    Store,
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { SellerTab } from '@/app/[locale]/seller/page';

interface SellerSidebarProps {
    activeTab: SellerTab;
    setActiveTab: (tab: SellerTab) => void;
    locale: string;
    userEmail: string;
}

export function SellerSidebar({ activeTab, setActiveTab, locale, userEmail }: SellerSidebarProps) {
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { id: 'dashboard', label: locale === 'ko' ? '대시보드' : 'Dashboard', icon: LayoutDashboard },
        { id: 'products', label: locale === 'ko' ? '상품 관리' : 'Products', icon: ShoppingBag },
        { id: 'orders', label: locale === 'ko' ? '주문 및 배송' : 'Orders & Shipping', icon: Truck },
        { id: 'claims', label: locale === 'ko' ? '클레임 & CS' : 'Claims & CS', icon: AlertCircle },
        { id: 'settlement', label: locale === 'ko' ? '정산 관리' : 'Settlements', icon: Receipt },
        { id: 'settings', label: locale === 'ko' ? '상점 & 배송 설정' : 'Shop Settings', icon: Settings },
    ] as const;

    const handleTabChange = (tabId: SellerTab) => {
        setActiveTab(tabId);
        setIsOpen(false);
    };

    return (
        <>
            {/* Mobile Header */}
            <header className="md:hidden w-full bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                <div className="flex items-center gap-2">
                    <Store className="text-[#8FBC8F] w-6 h-6" />
                    <span className="font-sans font-black text-stone-800 text-lg">byKnit Seller</span>
                </div>
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 text-stone-600 hover:text-stone-800 hover:bg-stone-50 rounded-xl transition-all"
                >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {/* Backdrop for Mobile */}
            {isOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-40 transition-all"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Navigation */}
            <aside className={`
                fixed md:static inset-y-0 left-0 w-72 bg-white border-r border-stone-100 z-50 p-6 flex flex-col justify-between transition-transform duration-300 md:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="space-y-8">
                    {/* Brand Identity */}
                    <div className="hidden md:flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#E8F0E8] flex items-center justify-center text-[#556B2F]">
                            <Store size={22} />
                        </div>
                        <div>
                            <span className="font-sans font-black text-stone-800 text-xl block leading-tight">byKnit Seller</span>
                            <span className="text-xs text-stone-400 font-medium">{locale === 'ko' ? '판매자 센터' : 'Partner Console'}</span>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleTabChange(item.id)}
                                    className={`
                                        w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all
                                        ${isActive 
                                            ? 'bg-[#E8F0E8] text-[#556B2F] shadow-inner-soft' 
                                            : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'}
                                    `}
                                >
                                    <Icon size={18} className={isActive ? 'text-[#556B2F]' : 'text-stone-400'} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Footer Section */}
                <div className="space-y-4 pt-6 border-t border-stone-100">
                    <div className="px-4">
                        <span className="text-xs text-stone-400 block font-medium">Logged in as</span>
                        <span className="text-sm font-bold text-stone-700 truncate block max-w-full" title={userEmail}>
                            {userEmail}
                        </span>
                    </div>

                    <Link 
                        href={`/${locale}/marketplace/dashboard`}
                        className="flex items-center gap-2.5 px-4 py-3 w-full text-stone-500 hover:text-stone-800 hover:bg-stone-50 rounded-2xl text-xs font-bold transition-all"
                    >
                        <ArrowLeft size={16} />
                        <span>{locale === 'ko' ? '디자이너 콘솔로 이동' : 'Back to Designer Console'}</span>
                    </Link>
                </div>
            </aside>
        </>
    );
}
