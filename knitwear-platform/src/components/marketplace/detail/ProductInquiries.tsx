'use client';

import { useState } from 'react';
import { MessageCircle, Lock } from 'lucide-react';

interface ProductInquiriesProps {
    patternId: string;
    locale: string;
}

export function ProductInquiries({ patternId, locale }: ProductInquiriesProps) {
    const [inquiries, setInquiries] = useState<any[]>([]); // Mock data for now

    const handleWriteInquiry = () => {
        alert(locale === 'ko' ? '문의하기 기능이 곧 제공될 예정입니다.' : 'Inquiry feature is coming soon.');
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {locale === 'ko' ? '상품문의' : 'Inquiries'}
                        <span className="text-brown-500 ml-1">({inquiries.length})</span>
                    </h3>
                    <p className="text-sm text-gray-500">
                        {locale === 'ko' ? '상품에 대한 궁금한 점을 남겨주세요.' : 'Ask questions about the product.'}
                    </p>
                </div>
                <button
                    onClick={handleWriteInquiry}
                    className="px-5 py-2.5 border-2 border-brown-800 text-brown-800 text-sm font-bold rounded-xl hover:bg-brown-50 transition-colors flex items-center gap-2"
                >
                    <MessageCircle size={16} />
                    {locale === 'ko' ? '문의하기' : 'Ask Question'}
                </button>
            </div>

            {/* Empty State / List */}
            {inquiries.length === 0 ? (
                <div className="py-16 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <MessageCircle size={32} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">
                        {locale === 'ko' ? '아직 등록된 문의가 없습니다.' : 'No inquiries yet.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Mock Inquiries would be mapped here */}
                </div>
            )}
        </div>
    );
}
