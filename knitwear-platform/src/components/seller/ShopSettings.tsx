'use client';

import React, { useState } from 'react';
import { 
    Settings, 
    Truck, 
    Store, 
    Check, 
    Save, 
    Phone,
    MapPin,
    Heart
} from 'lucide-react';

export function ShopSettings({ locale }: { locale: string }) {
    // Brand Config states
    const [shopName, setShopName] = useState('차도운의 손뜨개 공방');
    const [shopBio, setShopBio] = useState('한 코 한 코 정성을 담아 뜨개실과 소품을 판매하는 감성 크래프트 샵입니다.');
    const [csContact, setCsContact] = useState('02-1234-5678');
    const [shopLogo, setShopLogo] = useState('https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=150&auto=format&fit=crop');

    // Shipping Config states
    const [baseShippingFee, setBaseShippingFee] = useState('3000');
    const [freeShippingThreshold, setFreeShippingThreshold] = useState('50000');
    const [extraRegionalFee, setExtraRegionalFee] = useState('3000');

    const [isSaved, setIsSaved] = useState(false);

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <form onSubmit={handleSaveSettings} className="space-y-8 animate-fadeIn">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-stone-800 font-sans">
                        {locale === 'ko' ? '상점 및 배송비 설정' : 'Shop & Shipping Settings'}
                    </h1>
                    <p className="text-stone-500 text-sm mt-1">
                        {locale === 'ko' ? '브랜드 로고와 소개글 등 상점 정보를 변경하고, 기본 배송비 정책을 설정합니다.' : 'Edit brand profile and configure default shipping fee policies.'}
                    </p>
                </div>
                <button
                    type="submit"
                    className={`
                        px-6 py-3.5 rounded-2xl font-bold text-xs shadow-soft flex items-center justify-center gap-1.5 transition-all hover:-translate-y-0.5
                        ${isSaved 
                            ? 'bg-[#556B2F] text-white' 
                            : 'bg-stone-850 hover:bg-stone-900 text-white'}
                    `}
                >
                    {isSaved ? (
                        <>
                            <Check size={14} />
                            <span>{locale === 'ko' ? '설정 저장 완료!' : 'Settings Saved!'}</span>
                        </>
                    ) : (
                        <>
                            <Save size={14} />
                            <span>{locale === 'ko' ? '모든 설정 저장하기' : 'Save All Settings'}</span>
                        </>
                    )}
                </button>
            </div>

            {/* Split layout: Left Store Profile, Right Shipping config */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Store Profile Card */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-soft space-y-6">
                    <div className="flex items-center gap-2 border-b border-stone-50 pb-3">
                        <Store size={18} className="text-[#8FBC8F]" />
                        <h2 className="text-base font-bold text-stone-800">{locale === 'ko' ? '브랜드 프로필 설정' : 'Brand Profile'}</h2>
                    </div>

                    <div className="space-y-5">
                        {/* Logo Image */}
                        <div className="flex items-center gap-5 bg-stone-50 p-4 rounded-2xl border border-stone-100/50">
                            <img 
                                src={shopLogo} 
                                alt={shopName} 
                                className="w-16 h-16 rounded-2xl object-cover border border-stone-100 shadow-soft"
                            />
                            <div>
                                <span className="text-xs font-bold text-stone-400 block mb-1.5">{locale === 'ko' ? '상점 로고 이미지' : 'Store Logo'}</span>
                                <input 
                                    type="url"
                                    value={shopLogo}
                                    onChange={(e) => setShopLogo(e.target.value)}
                                    className="px-3 py-1.5 bg-white border border-stone-100 rounded-xl text-[10px] text-stone-500 font-bold outline-none focus:bg-stone-50 w-64 md:w-80 truncate"
                                />
                            </div>
                        </div>

                        {/* Store Name */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-400 block">{locale === 'ko' ? '상점 이름 *' : 'Store Name *'}</label>
                            <input 
                                type="text"
                                required
                                value={shopName}
                                onChange={(e) => setShopName(e.target.value)}
                                className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold text-stone-700 outline-none focus:bg-white transition-colors"
                            />
                        </div>

                        {/* Store Bio */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-400 block">{locale === 'ko' ? '상점 한 줄 소개' : 'Store Description'}</label>
                            <textarea 
                                value={shopBio}
                                onChange={(e) => setShopBio(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold text-stone-700 outline-none focus:bg-white transition-colors leading-relaxed"
                            />
                        </div>

                        {/* CS contact */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-400 flex items-center gap-1">
                                <Phone size={12} />
                                <span>{locale === 'ko' ? '고객센터 연락처 *' : 'CS Contact *'}</span>
                            </label>
                            <input 
                                type="text"
                                required
                                value={csContact}
                                onChange={(e) => setCsContact(e.target.value)}
                                className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold text-stone-700 outline-none focus:bg-white transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Shipping config Card */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-100 shadow-soft space-y-6">
                    <div className="flex items-center gap-2 border-b border-stone-50 pb-3">
                        <Truck size={18} className="text-[#8FBC8F]" />
                        <h2 className="text-base font-bold text-stone-800">{locale === 'ko' ? '배송 정책 설정' : 'Shipping Policy'}</h2>
                    </div>

                    <div className="space-y-5">
                        {/* Base shipping fee */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-400 block">
                                {locale === 'ko' ? '기본 배송비 (원) *' : 'Base Shipping Fee (KRW) *'}
                            </label>
                            <input 
                                type="number"
                                required
                                value={baseShippingFee}
                                onChange={(e) => setBaseShippingFee(e.target.value)}
                                className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold text-stone-700 outline-none focus:bg-white transition-colors"
                            />
                        </div>

                        {/* Conditional Free shipping */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-400 block">
                                {locale === 'ko' ? '무료 배송 기준금액 (원) *' : 'Free Shipping Threshold (KRW) *'}
                            </label>
                            <input 
                                type="number"
                                required
                                value={freeShippingThreshold}
                                onChange={(e) => setFreeShippingThreshold(e.target.value)}
                                className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold text-stone-700 outline-none focus:bg-white transition-colors"
                            />
                            <span className="text-[10px] text-stone-400 block font-semibold pl-1">
                                {locale === 'ko' ? '* 설정 금액 이상 구매 시 기본 배송비가 0원으로 적용됩니다.' : '* Purchase above this limit will waive the base shipping fee.'}
                            </span>
                        </div>

                        {/* Regional shipping fee */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-stone-400 flex items-center gap-1">
                                <MapPin size={12} />
                                <span>{locale === 'ko' ? '제주 / 도서산간 추가 배송비 (원) *' : 'Extra Island/Regional Fee (KRW) *'}</span>
                            </label>
                            <input 
                                type="number"
                                required
                                value={extraRegionalFee}
                                onChange={(e) => setExtraRegionalFee(e.target.value)}
                                className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded-2xl text-xs font-bold text-stone-700 outline-none focus:bg-white transition-colors"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
