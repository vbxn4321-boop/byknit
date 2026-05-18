'use client';

import { useState } from 'react';
import { PublishPatternModal } from './PublishPatternModal';

export function CreatePatternButton({ locale }: { locale: string }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="text-sm font-bold text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-full transition-all"
            >
                {locale === 'ko' ? '새로 만들기' : 'Create New'}
            </button>
            <PublishPatternModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                locale={locale}
            />
        </>
    );
}
