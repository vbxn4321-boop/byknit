'use client';

import { useState, useEffect } from 'react';
import { Download, AlertTriangle, X, Sparkles, ExternalLink } from 'lucide-react';

interface DownloadOptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDownload: (lang: 'ko' | 'en') => void;
    locale: string;
    isFree: boolean;
}

export function DownloadOptionModal({ isOpen, onClose, onDownload, locale, isFree }: DownloadOptionModalProps) {
    const [agreed, setAgreed] = useState(false);
    const [timeLeft, setTimeLeft] = useState(isFree ? 15 : 0);
    const [progress, setProgress] = useState(100);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setTimeLeft(isFree ? 15 : 0);
            setProgress(100);
            setAgreed(false);
        }
    }, [isOpen, isFree]);

    // Timer logic
    useEffect(() => {
        if (!isOpen || !isFree || timeLeft <= 0) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                const next = prev - 1;
                setProgress((next / 15) * 100);
                return next;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen, isFree, timeLeft]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-stone-50 px-6 py-4 flex items-center justify-between border-b border-stone-100">
                    <h3 className="font-bold text-lg text-stone-800 flex items-center gap-2">
                        <Download size={20} className="text-orange-500" />
                        {locale === 'ko' ? '도안 다운로드' : 'Download Pattern'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 max-h-[85vh] overflow-y-auto">
                    {/* Advertisement Section (Only for Free Patterns) */}
                    {isFree && (
                        <div className="relative overflow-hidden rounded-xl border border-stone-200 bg-stone-50 p-4 mb-6 shadow-sm">
                            {/* Ad Label */}
                            <div className="absolute top-2 right-3 text-[9px] font-bold text-stone-400 tracking-wider uppercase select-none">
                                {locale === 'ko' ? '광고 / 스폰서' : 'AD / SPONSOR'}
                            </div>

                            {/* Progress bar */}
                            {timeLeft > 0 && (
                                <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-orange-400 to-amber-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
                            )}

                            {/* Mock Google AdSense Container */}
                            <div className="mt-2 mb-3 py-3 px-4 rounded-lg bg-white border border-dashed border-stone-300 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                                <div className="absolute inset-0 bg-stone-50/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                <Sparkles className="w-5 h-5 text-amber-500 mb-1.5 animate-pulse" />
                                <div className="text-[11px] font-bold text-stone-700 mb-0.5">
                                    {locale === 'ko' ? 'Google AdSense 광고 영역' : 'Google AdSense Ad Area'}
                                </div>
                                <div className="text-[10px] text-stone-400 leading-normal max-w-[280px]">
                                    {locale === 'ko' 
                                        ? '도메인 승인 및 구글 심사 완료 후 맞춤형 타겟 광고가 자동으로 연동됩니다.' 
                                        : 'Custom targeted ads will appear here automatically after AdSense approval.'}
                                </div>
                            </div>

                            {/* Self-hosted Special Promotion (Interactive & Practical) */}
                            <a 
                                href={`/${locale}/marketplace?filter=official`} 
                                target="_blank"
                                rel="noreferrer"
                                className="block py-2.5 px-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/15 hover:to-orange-500/15 border border-orange-200/50 transition-all group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-extrabold text-orange-600 tracking-tight flex items-center gap-1">
                                            🔥 {locale === 'ko' ? '바이니트 공식 특가 추천 상품' : 'byKnit Official Hot Deal'}
                                        </span>
                                        <span className="text-[10px] font-medium text-stone-600 mt-0.5">
                                            {locale === 'ko' 
                                                ? '초저가 감성 수제 니트 액세서리 완성품 3,900원부터!' 
                                                : 'Handmade knit accessories starting at only $2.99!'}
                                        </span>
                                    </div>
                                    <ExternalLink size={12} className="text-orange-500 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </a>

                            {/* Countdown indicator */}
                            <div className="mt-3 text-center">
                                {timeLeft > 0 ? (
                                    <div className="text-[11px] font-semibold text-stone-500 flex items-center justify-center gap-1">
                                        <span className="inline-block w-4 h-4 rounded-full border-2 border-stone-300 border-t-orange-500 animate-spin mr-1" />
                                        {locale === 'ko' 
                                            ? `무료 도안 다운로드 대기 중... (${timeLeft}초)` 
                                            : `Waiting for free download... (${timeLeft}s)`}
                                    </div>
                                ) : (
                                    <div className="text-[11px] font-extrabold text-emerald-600 animate-bounce">
                                        ✨ {locale === 'ko' ? '광고 확인 완료! 다운로드가 활성화되었습니다.' : 'Ad watched! Download is now unlocked.'}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Copyright Warning */}
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 mb-5">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={20} />
                            <div className="text-xs text-rose-700 leading-relaxed">
                                <p className="font-bold mb-1">
                                    {locale === 'ko' ? '저작권 및 배포 주의사항' : 'Copyright & Distribution Warning'}
                                </p>
                                {locale === 'ko'
                                    ? '본 도안의 무단 복제, 수정, 배포 및 상업적 목적의 무단 이용은 법적으로 엄격히 금지되어 있습니다. 개인적인 창작 용도로만 사용해 주세요.'
                                    : 'Unauthorized reproduction, modification, distribution, or commercial use of this pattern is strictly prohibited. Personal use only.'}
                            </div>
                        </div>
                    </div>

                    {/* Agreement Checkbox */}
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 hover:border-orange-200 cursor-pointer transition-colors mb-6 group">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="w-5 h-5 text-orange-500 rounded border-stone-300 focus:ring-orange-500 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-stone-700 group-hover:text-stone-900 transition-colors select-none">
                            {locale === 'ko' ? '위의 저작권 경고 및 주의사항에 동의합니다.' : 'I agree to the copyright and distribution terms.'}
                        </span>
                    </label>

                    {/* Download Buttons */}
                    <div className="space-y-2.5">
                        <button
                            disabled={!agreed || timeLeft > 0}
                            onClick={() => onDownload('ko')}
                            className="w-full py-3 rounded-xl bg-stone-950 hover:bg-stone-800 disabled:bg-stone-100 disabled:text-stone-400 text-white text-sm font-bold transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <Download size={16} />
                            {timeLeft > 0 
                                ? (locale === 'ko' ? `한국어 도안 다운로드 (${timeLeft}초 대기)` : `Download Korean Ver. (${timeLeft}s)`)
                                : (locale === 'ko' ? '한국어 도안 다운로드' : 'Download Korean Ver.')
                            }
                        </button>
                        <button
                            disabled={!agreed || timeLeft > 0}
                            onClick={() => onDownload('en')}
                            className="w-full py-3 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-800 disabled:bg-stone-50 disabled:border-stone-100 disabled:text-stone-400 text-sm font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <Download size={16} />
                            {timeLeft > 0 
                                ? (locale === 'ko' ? `영어 도안 다운로드 (${timeLeft}초 대기)` : `Download English Ver. (${timeLeft}s)`)
                                : (locale === 'ko' ? '영어 도안 다운로드' : 'Download English Ver.')
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
