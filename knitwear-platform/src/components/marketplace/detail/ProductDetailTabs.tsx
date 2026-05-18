'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface ProductDetailTabsProps {
    detailContent: React.ReactNode;
    reviewContent: React.ReactNode;
    qnaContent: React.ReactNode;
    reviewCount?: number;
    qnaCount?: number;
    locale: string;
}

export function ProductDetailTabs({
    detailContent,
    reviewContent,
    qnaContent,
    reviewCount = 0,
    qnaCount = 0,
    locale
}: ProductDetailTabsProps) {
    const [activeTab, setActiveTab] = useState<'detail' | 'review' | 'qna'>('detail');

    const tabs = [
        { id: 'detail', label: locale === 'ko' ? '상세정보' : 'Detail Info' },
        { id: 'review', label: locale === 'ko' ? `리뷰 (${reviewCount})` : `Reviews (${reviewCount})` },
        { id: 'qna', label: locale === 'ko' ? `문의 (${qnaCount})` : `Inquiries (${qnaCount})` },
    ] as const;

    return (
        <div className="w-full">
            {/* Tab Headers */}
            <div className="flex border-b border-gray-200 mb-8 sticky top-[72px] bg-white z-30">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-4 text-sm md:text-base font-bold text-center transition-colors relative ${activeTab === tab.id
                                ? 'text-brown-800'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brown-800" />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[300px]">
                {activeTab === 'detail' && (
                    <div className="animate-in fade-in duration-300">
                        {detailContent}
                    </div>
                )}
                {activeTab === 'review' && (
                    <div className="animate-in fade-in duration-300">
                        {reviewContent}
                    </div>
                )}
                {activeTab === 'qna' && (
                    <div className="animate-in fade-in duration-300">
                        {qnaContent}
                    </div>
                )}
            </div>
        </div>
    );
}
