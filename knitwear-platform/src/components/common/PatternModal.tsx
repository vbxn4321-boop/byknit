'use client';

import { X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { User } from '@supabase/supabase-js';

// Dynamic import to break circular dependency: PatternDetailClient -> ProductReviews -> ReviewList -> PatternModal -> PatternDetailClient
const PatternDetailClient = dynamic(() => import('@/components/marketplace/PatternDetailClient').then(mod => mod.PatternDetailClient), {
    loading: () => <div className="h-full flex items-center justify-center">Loading component...</div>
});

interface PatternModalProps {
    patternId: string;
    locale: string;
    user: User | null;
    onClose: () => void;
}

export function PatternModal({ patternId, locale, user, onClose }: PatternModalProps) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[85vh] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button - Sticky */}
                <div className="absolute top-4 right-4 z-50">
                    <button
                        onClick={onClose}
                        className="bg-white/90 backdrop-blur p-2 rounded-full shadow-lg hover:bg-white transition-all text-brown-700 hover:text-rose-500"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <PatternDetailClient
                        patternId={patternId}
                        locale={locale}
                        user={user}
                        isModal={true}
                    />
                </div>
            </div>
        </div>
    );
}
