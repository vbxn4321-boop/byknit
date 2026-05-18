'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, FileText, PenTool, Upload, Loader2, Wand2 } from 'lucide-react';
import { analyzePattern } from '@/app/actions/analyze';
import { PublishPatternModal } from './PublishPatternModal';

interface CreateProductButtonProps {
    locale: string;
}

export function CreateProductButton({ locale }: CreateProductButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [analyzedData, setAnalyzedData] = useState<any>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Toggle Dropdown
    const toggleDropdown = () => setIsOpen(!isOpen);

    // Handle Click Outside (Simple version)
    // In a real app, use useClickOutside hook. For now, rely on backdrop or blur.

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsOpen(false);
        setSelectedFile(file);
        // Open modal immediately to prevent "not opening" issue
        setShowPublishModal(true);
        // We can optionally trigger analysis here or let the user do it in the modal if we move logic.
        // For now, let's try to run analysis but don't block the modal interaction if possible?
        // Actually, if modal is open, we can't show the separate loading overlay easily unless we keep state.
        // Let's rely on the modal's internal form. The auto-fill is nice but fragility is bad.

        // Attempt analysis for auto-fill, but don't block?
        // Or just let it be empty?
        // User didn't ask for AI analysis explicitly, just "Existing Pattern Upload".
        // I will keep it simple: Open modal.
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Main Button */}
            <button
                onClick={toggleDropdown}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 transition-all shadow-sm active:scale-95"
            >
                <Plus className="w-4 h-4" />
                {locale === 'ko' ? '새로 만들기' : 'Create New'}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-tan-100 p-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                        <Link
                            href={`/${locale}/editor`}
                            className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-rose-50 group transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 group-hover:bg-rose-200">
                                <PenTool className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-brown-800">{locale === 'ko' ? '에디터로 만들기' : 'Use Editor'}</p>
                                <p className="text-xs text-brown-400">{locale === 'ko' ? '직접 도안 그리기' : 'Draw pattern'}</p>
                            </div>
                        </Link>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-sage-50 group transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-sage-100 flex items-center justify-center text-sage-600 group-hover:bg-sage-200">
                                <FileText className="w-4 h-4" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-brown-800">{locale === 'ko' ? '기존 도안 올리기' : 'Upload PDF'}</p>
                                <p className="text-xs text-brown-400">{locale === 'ko' ? 'AI 자동 분석' : 'AI Analysis'}</p>
                            </div>
                        </button>
                    </div>
                </>
            )}

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                className="hidden"
                onChange={handleFileUpload}
            />

            {/* Analysis Loading Overlay */}
            {isAnalyzing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 text-center max-w-sm mx-4 animate-in zoom-in-95 shadow-2xl">
                        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <Wand2 className="w-8 h-8 text-rose-500" />
                        </div>
                        <h3 className="text-xl font-black text-brown-800 mb-2">
                            {locale === 'ko' ? '도안 분석 중...' : 'Analyzing Pattern...'}
                        </h3>
                        <p className="text-brown-500 text-sm mt-1">
                            {locale === 'ko'
                                ? 'AI가 도안을 분석 중입니다. 결과가 정확하지 않을 수 있으니 등록 전 반드시 확인해주세요.'
                                : 'AI is analyzing your pattern. Results may vary, please verify before publishing.'}
                        </p>
                    </div>
                </div>
            )}

            {/* Publish Modal with Auto-filled Data */}
            {showPublishModal && (
                <PublishPatternModal
                    isOpen={showPublishModal}
                    onClose={() => {
                        setShowPublishModal(false);
                        setAnalyzedData(null);
                        setSelectedFile(null);
                    }}
                    locale={locale}
                    initialFile={selectedFile}
                    initialData={analyzedData}
                />
            )}
        </div>
    );
}
