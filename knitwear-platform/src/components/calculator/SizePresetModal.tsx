'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, User, Users } from 'lucide-react';
import { WOMENS_STANDARD, MENS_STANDARD, SizeKey } from '@/utils/knittingMath';

interface SizePresetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (measurements: { chest: number; neck: number; armLength: number }) => void;
}

export function SizePresetModal({ isOpen, onClose, onSelect }: SizePresetModalProps) {
    const t = useTranslations('calculator.sizeModal');
    const [gender, setGender] = useState<'women' | 'men'>('women');

    if (!isOpen) return null;

    const standards = gender === 'women' ? WOMENS_STANDARD : MENS_STANDARD;

    const handleSelect = (size: SizeKey) => {
        onSelect(standards[size]);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-tan-100">
                    <h2 className="text-xl font-bold text-brown-700">
                        {t('title')} <span className="text-stone-400 text-sm font-normal ml-1">(CYC Standard)</span>
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-cream-100 text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Gender Toggle */}
                <div className="p-5 border-b border-tan-100">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setGender('women')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${gender === 'women'
                                ? 'bg-rose-100 text-rose-600 border-2 border-rose-200'
                                : 'bg-cream-50 text-stone-500 border-2 border-transparent hover:bg-cream-100'
                                }`}
                        >
                            <User className="w-4 h-4" />
                            {t('women')}
                        </button>
                        <button
                            onClick={() => setGender('men')}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${gender === 'men'
                                ? 'bg-blue-100 text-blue-600 border-2 border-blue-200'
                                : 'bg-cream-50 text-stone-500 border-2 border-transparent hover:bg-cream-100'
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            {t('men')}
                        </button>
                    </div>
                </div>

                {/* Size Options */}
                <div className="p-5 grid grid-cols-2 gap-3">
                    {(Object.keys(standards) as SizeKey[]).map((size) => (
                        <button
                            key={size}
                            onClick={() => handleSelect(size)}
                            className="p-4 rounded-2xl border-2 border-tan-200 hover:border-rose-300 hover:bg-rose-50/50 transition-all text-left group"
                        >
                            <div className="text-2xl font-bold text-brown-700 group-hover:text-rose-500 transition-colors">
                                {size}
                            </div>
                            <div className="text-xs text-stone-400 mt-1 space-y-0.5">
                                <div>{t('chest')}: {standards[size].chest}cm</div>
                                <div>{t('neck')}: {standards[size].neck}cm</div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-5 bg-cream-50 border-t border-tan-100">
                    <p className="text-xs text-stone-400 text-center">
                        {t('disclaimer')}
                    </p>
                </div>
            </div>
        </div>
    );
}
