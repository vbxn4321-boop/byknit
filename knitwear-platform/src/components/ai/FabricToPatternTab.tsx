'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { User } from '@supabase/supabase-js';
import { 
    Upload, Image as ImageIcon, Sparkles, Loader2, Lock, Unlock, 
    FileText, Copy, Check, ArrowLeft, Coins, AlertTriangle, Download 
} from 'lucide-react';
import { analyzeFabricTexture, unlockFabricPattern } from '@/app/actions/analyze';
import { jsPDF } from 'jspdf';

interface FabricToPatternTabProps {
    locale: string;
    user: User | null;
    credits: number;
    onBack: () => void;
}

export default function FabricToPatternTab({ locale, user, credits: initialCredits, onBack }: FabricToPatternTabProps) {
    const t = useTranslations('ai.fabricToPattern');
    const tCommon = useTranslations('common');
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [image, setImage] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [credits, setCredits] = useState(initialCredits);
    
    // Inputs
    const [craftType, setCraftType] = useState<'knitting' | 'crochet'>('knitting');
    const [needleSize, setNeedleSize] = useState('');
    const [yarnWeight, setYarnWeight] = useState('');
    
    // States
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any | null>(null);
    
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [fullContent, setFullContent] = useState<any | null>(null);
    
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Sync credits when prop changes
    useEffect(() => {
        setCredits(initialCredits);
    }, [initialCredits]);

    const processFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            setImage(e.target?.result as string);
            setFile(file);
            setError(null);
            setAnalysisResult(null);
            setIsUnlocked(false);
            setFullContent(null);
        };
        reader.readAsDataURL(file);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            processFile(file);
        }
    };

    const handleAnalyze = async () => {
        if (!image) return;
        setIsAnalyzing(true);
        setError(null);
        
        try {
            const res = await analyzeFabricTexture({
                imageBase64: image,
                craftType,
                needleSize,
                yarnWeight
            });

            if (res.success && res.data) {
                setAnalysisResult(res.data);
            } else {
                setError(res.error || 'Failed to analyze fabric');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleUnlock = async () => {
        if (!analysisResult) return;
        setIsUnlocking(true);
        setError(null);

        try {
            const res = await unlockFabricPattern(analysisResult.id);

            if (res.success && res.fullContent) {
                setFullContent(res.fullContent);
                setIsUnlocked(true);
                // Update local credits display
                setCredits(prev => Math.max(0, prev - 50));
            } else {
                setError(res.error || 'Failed to unlock pattern');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred');
        } finally {
            setIsUnlocking(false);
        }
    };

    const handleCopy = () => {
        if (!fullContent) return;
        const text = locale === 'ko' ? fullContent.ko : fullContent.en;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadPDF = () => {
        if (!fullContent || !analysisResult) return;
        const doc = new jsPDF();
        const isKo = locale === 'ko';
        
        const title = isKo ? `byKnit AI 분석 도안: ${analysisResult.stitchPattern}` : `byKnit AI Pattern: ${analysisResult.stitchPattern}`;
        const contentText = isKo ? fullContent.ko : fullContent.en;

        doc.setFontSize(18);
        doc.text(title, 14, 22);
        
        doc.setFontSize(11);
        doc.text(`Needles: ${analysisResult.recommendedNeedles}`, 14, 32);
        doc.text(`Yarn: ${analysisResult.recommendedYarn}`, 14, 38);
        
        doc.line(14, 42, 196, 42);

        doc.setFontSize(10);
        // Split text to fit width
        const splitText = doc.splitTextToSize(contentText.replace(/#/g, ''), 180);
        doc.text(splitText, 14, 50);

        doc.save(`${analysisResult.stitchPattern.replace(/\s+/g, '_')}_pattern.pdf`);
    };

    const isKo = locale === 'ko';

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="inline-flex items-center gap-2 text-brown-600 hover:text-rose-500 font-bold transition-colors cursor-pointer"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>{t('backToSelect')}</span>
                </button>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-tan-200 shadow-sm text-sm text-brown-700 font-bold">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span>{credits} {tCommon('credits')}</span>
                </div>
            </div>

            <div className="grid md:grid-cols-[1fr_320px] gap-8 items-start">
                {/* Left Panel: Upload / Preview / Result */}
                <div className="space-y-6">
                    {/* Error Banner */}
                    {error && (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-800 text-sm">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
                            <p className="font-medium">{error}</p>
                        </div>
                    )}

                    {!analysisResult ? (
                        /* Step 1: Upload & Input Metas */
                        <div className="bg-white rounded-3xl border border-tan-200 shadow-soft p-6 md:p-8 space-y-6">
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-brown-800 mb-2">{t('title')}</h2>
                                <p className="text-sm text-brown-500">{t('description')}</p>
                            </div>

                            {/* Dropzone */}
                            <div
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors relative ${
                                    image ? 'border-sage-300 bg-sage-50/10' : 'border-tan-200 hover:bg-stone-50'
                                }`}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />

                                {image ? (
                                    <div className="relative aspect-video max-w-sm mx-auto overflow-hidden rounded-xl shadow-md">
                                        <img src={image} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="w-12 h-12 rounded-full bg-cream-100 flex items-center justify-center mx-auto text-rose-400">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-brown-800">{t('uploadPrompt')}</p>
                                            <p className="text-xs text-brown-400 mt-1">PNG, JPG, JPEG (Max 10MB)</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Options */}
                            <div className="space-y-4 pt-4 border-t border-tan-100">
                                <h3 className="font-bold text-brown-800 text-sm">{t('metaSettings')}</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Craft Type */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-brown-600">{t('craftType')}</label>
                                        <div className="grid grid-cols-2 gap-2 bg-tan-50 p-1 rounded-xl">
                                            <button
                                                type="button"
                                                onClick={() => setCraftType('knitting')}
                                                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                                                    craftType === 'knitting' ? 'bg-white text-rose-500 shadow-sm' : 'text-brown-500 hover:text-brown-700'
                                                }`}
                                            >
                                                {t('knitting')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setCraftType('crochet')}
                                                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                                                    craftType === 'crochet' ? 'bg-white text-rose-500 shadow-sm' : 'text-brown-500 hover:text-brown-700'
                                                }`}
                                            >
                                                {t('crochet')}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Needle Size */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-brown-600">{t('needleSize')}</label>
                                        <input
                                            type="text"
                                            value={needleSize}
                                            onChange={(e) => setNeedleSize(e.target.value)}
                                            placeholder={t('needlePlaceholder')}
                                            className="w-full input-cozy py-2.5 text-xs bg-tan-50/50"
                                        />
                                    </div>
                                </div>

                                {/* Yarn Weight */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-brown-600">{t('yarnWeight')}</label>
                                    <input
                                        type="text"
                                        value={yarnWeight}
                                        onChange={(e) => setYarnWeight(e.target.value)}
                                        placeholder={t('yarnPlaceholder')}
                                        className="w-full input-cozy py-2.5 text-xs bg-tan-50/50"
                                    />
                                </div>
                            </div>

                            {/* Trigger button */}
                            <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || !image}
                                className="w-full btn-primary py-4 font-bold rounded-2xl shadow-soft disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>{t('analyzing')}</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5 text-white/90" />
                                        <span>{t('analyze')}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        /* Step 2: Show Diagnostic Summary & Preview / Unlock */
                        <div className="space-y-6">
                            {/* Diagnostic Card */}
                            <div className="bg-white rounded-3xl border border-tan-200 shadow-soft p-6 grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <span className="text-[10px] font-bold text-brown-400 uppercase tracking-wider block mb-1">{t('detectedStitch')}</span>
                                    <span className="font-extrabold text-brown-700 text-sm sm:text-base leading-tight block">{analysisResult.stitchPattern}</span>
                                </div>
                                <div className="border-x border-tan-100">
                                    <span className="text-[10px] font-bold text-brown-400 uppercase tracking-wider block mb-1">{t('recNeedles')}</span>
                                    <span className="font-extrabold text-brown-700 text-sm sm:text-base leading-tight block">{analysisResult.recommendedNeedles}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-brown-400 uppercase tracking-wider block mb-1">{t('recYarn')}</span>
                                    <span className="font-extrabold text-brown-700 text-sm sm:text-base leading-tight block">{analysisResult.recommendedYarn}</span>
                                </div>
                            </div>

                            {/* Content Display Panel */}
                            <div className="bg-white rounded-3xl border border-tan-200 shadow-soft overflow-hidden relative min-h-[300px] flex flex-col justify-between">
                                {/* Header */}
                                <div className="bg-tan-50/50 border-b border-tan-200 px-6 py-4 flex items-center justify-between">
                                    <h3 className="font-bold text-brown-800 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-rose-400" />
                                        <span>{isUnlocked ? t('unlockedTitle') : t('previewTitle')}</span>
                                    </h3>
                                    {isUnlocked && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleCopy}
                                                className="p-2 hover:bg-tan-100 rounded-lg text-brown-500 hover:text-rose-500 transition-colors"
                                                title={t('copyClipboard')}
                                            >
                                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={handleDownloadPDF}
                                                className="p-2 hover:bg-tan-100 rounded-lg text-brown-500 hover:text-rose-500 transition-colors"
                                                title={t('downloadPDF')}
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Body */}
                                <div className="p-6 flex-1 text-left relative overflow-hidden">
                                    {isUnlocked && fullContent ? (
                                        /* Unlocked Full Markdown View */
                                        <div className="prose prose-sm prose-brown max-w-none whitespace-pre-wrap font-sans">
                                            {isKo ? fullContent.ko : fullContent.en}
                                        </div>
                                    ) : (
                                        /* Locked Preview Snippet with Blur Overlay */
                                        <div className="relative">
                                            {/* Preview Text */}
                                            <div className="space-y-4 opacity-50 select-none pb-40">
                                                <h4 className="font-bold text-brown-800">{t('previewTitle')}</h4>
                                                <p className="text-sm text-brown-600 italic">
                                                    {isKo ? analysisResult.preview.ko : analysisResult.preview.en}
                                                </p>
                                                <p className="text-sm text-brown-400">
                                                    4단: ... 5단: ... (50 크레딧 결제 시 잠금해제)
                                                </p>
                                            </div>

                                            {/* Blur & Lock Overlay */}
                                            <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-white via-white/80 to-transparent flex flex-col items-center justify-end p-8 text-center pb-12">
                                                <div className="bg-white rounded-3xl border border-tan-200 p-6 max-w-md shadow-xl space-y-4 scale-95 md:scale-100">
                                                    <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-500 shadow-sm animate-pulse-soft">
                                                        <Lock className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-brown-800 text-base">{t('previewTitle')}</h4>
                                                        <p className="text-xs text-brown-500 mt-1 leading-relaxed">{t('previewDesc')}</p>
                                                    </div>

                                                    <button
                                                        onClick={handleUnlock}
                                                        disabled={isUnlocking}
                                                        className="w-full btn-primary py-3 px-4 font-bold text-sm rounded-xl shadow-soft flex items-center justify-center gap-2 cursor-pointer"
                                                    >
                                                        {isUnlocking ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                <span>Unlocking...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Unlock className="w-4 h-4 text-white/90" />
                                                                <span>{t('unlockBtn', { credits: 50 })}</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Sidebar (Original Image Preview / Instructions) */}
                <div className="space-y-6">
                    {/* Image Preview inside Sidebar */}
                    {image && (
                        <div className="bg-white rounded-2xl border border-tan-200 shadow-soft p-4">
                            <h4 className="text-xs font-bold text-brown-400 uppercase tracking-wider mb-2">{t('uploadPrompt')}</h4>
                            <div className="aspect-square rounded-xl overflow-hidden shadow-inner border border-tan-100 relative">
                                <img src={image} alt="Fabric Preview" className="w-full h-full object-cover" />
                                {analysisResult && !isUnlocked && (
                                    <div className="absolute inset-0 bg-brown-900/30 backdrop-blur-[2px] flex items-center justify-center text-white">
                                        <Lock className="w-8 h-8 opacity-65" />
                                    </div>
                                )}
                            </div>
                            {analysisResult && (
                                <button
                                    onClick={() => {
                                        setAnalysisResult(null);
                                        setIsUnlocked(false);
                                        setFullContent(null);
                                        setImage(null);
                                        setFile(null);
                                    }}
                                    className="w-full mt-3 py-2 border border-rose-200 hover:bg-rose-50 text-rose-500 rounded-xl font-bold text-xs transition-all cursor-pointer"
                                >
                                    {isKo ? '다시 올리기' : 'Reset & Upload New'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* How-to-use Card */}
                    <div className="bg-white rounded-2xl border border-tan-200 shadow-soft p-5 text-left space-y-4">
                        <h4 className="text-sm font-black text-stone-800 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-rose-400" />
                            {isKo ? '직물 분석 200% 활용법' : 'How to get best results'}
                        </h4>
                        <ul className="space-y-3 text-xs text-brown-600 list-disc list-inside pl-1 leading-relaxed">
                            <li>{isKo ? '바늘 굵기와 코수를 선명하게 볼 수 있는 밝은 조명 아래 접사 촬영된 사진을 사용해 주세요.' : 'Use a close-up photo taken under bright lighting that clearly shows individual stitches.'}</li>
                            <li>{isKo ? '사용하시는 실 종류와 바늘 호수를 입력하면 게이지(콧수/단수) 계산 정밀도가 올라갑니다.' : 'Entering the yarn type and needle size helps calculating the row/stitch gauge accurately.'}</li>
                            <li>{isKo ? '맛보기로 AI 진단 조직과 일부 도안 단수가 정확한지 확인한 후 잠금 해제하시는 것을 권장합니다.' : 'Verify if the stitch type matches in preview before spending your credits to unlock.'}</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
