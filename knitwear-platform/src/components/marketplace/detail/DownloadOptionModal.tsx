'use client';

import { useState } from 'react';
import { Download, AlertTriangle, X } from 'lucide-react';

interface DownloadOptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDownload: (lang: 'ko' | 'en') => void;
    locale: string;
}

export function DownloadOptionModal({ isOpen, onClose, onDownload, locale }: DownloadOptionModalProps) {
    const [agreed, setAgreed] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-tan-50 px-6 py-4 flex items-center justify-between border-b border-tan-100">
                    <h3 className="font-bold text-lg text-brown-800 flex items-center gap-2">
                        <Download size={20} className="text-orange-500" />
                        {locale === 'ko' ? '도안 다운로드' : 'Download Pattern'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Copyright Warning */}
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                            <div className="text-sm text-red-700 leading-relaxed">
                                <p className="font-bold mb-1">
                                    {locale === 'ko' ? '저작권 경고' : 'Copyright Warning'}
                                </p>
                                {locale === 'ko'
                                    ? '본 도안의 무단 복제, 배포, 판매는 법적으로 금지되어 있습니다. 개인적인 용도로만 사용해 주세요.'
                                    : 'Unauthorized reproduction, distribution, or sale of this pattern is strictly prohibited. Personal use only.'}
                            </div>
                        </div>
                    </div>

                    {/* Agreement Checkbox */}
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-orange-200 cursor-pointer transition-colors mb-6 group">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="w-5 h-5 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                        />
                        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                            {locale === 'ko' ? '네, 동의합니다.' : 'I agree to the copyright terms.'}
                        </span>
                    </label>

                    {/* Download Buttons */}
                    <div className="space-y-3">
                        <button
                            disabled={!agreed}
                            onClick={() => onDownload('ko')}
                            className="w-full py-3.5 rounded-xl bg-brown-600 hover:bg-brown-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold transition-all shadow-md active:scale-[0.98]"
                        >
                            {locale === 'ko' ? '한국어 도안 다운로드' : 'Download Korean Ver.'}
                        </button>
                        <button
                            disabled={!agreed}
                            onClick={() => onDownload('en')}
                            className="w-full py-3.5 rounded-xl bg-white border-2 border-brown-200 hover:border-brown-400 text-brown-700 disabled:border-gray-200 disabled:text-gray-400 font-bold transition-all active:scale-[0.98]"
                        >
                            {locale === 'ko' ? '영어 도안 다운로드' : 'Download English Ver.'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
