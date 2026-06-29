'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Sparkles, ArrowRightLeft, Copy, Check, Lock,
    Bookmark, FileDown, BookOpen, AlertCircle, RefreshCw,
    History, Trash2, FolderHeart, Calendar, HelpCircle, X
} from 'lucide-react';
import { translateText } from '@/app/actions/translate';
import { deductCredits } from '@/app/actions/credits';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';

interface SavedTranslation {
    id: string;
    source: string;
    translated: string;
    lang: 'ko' | 'en';
    createdAt: string;
}

interface TranslatorClientProps {
    locale: string;
    user: User | null;
    isTabMode?: boolean;
}

export function TranslatorClient({ locale, user, isTabMode = false }: TranslatorClientProps) {
    const router = useRouter();
    const [sourceText, setSourceText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [targetLang, setTargetLang] = useState<'ko' | 'en'>('ko');
    const [isTranslating, setIsTranslating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showNudge, setShowNudge] = useState(false);
    const [savedTranslations, setSavedTranslations] = useState<SavedTranslation[]>([]);
    const [showGuide, setShowGuide] = useState(true);

    const handleAuthCheck = () => {
        alert(locale === 'ko'
            ? '🔒 로그인이 필요한 장치입니다. 이 도구(AI 도안 번역기)를 사용하시려면 먼저 로그인을 완료해 주세요.'
            : '🔒 Login Required. Please log in to unlock and use the AI Pattern Translator.'
        );
        router.push(`/${locale}/login`);
    };

    // 1. Restore pending translation on return from signup/login
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const pending = localStorage.getItem('pending_translation');
            if (pending) {
                try {
                    const parsed = JSON.parse(pending);
                    setSourceText(parsed.source || '');
                    setTranslatedText(parsed.translated || '');
                    setTargetLang(parsed.targetLang || 'ko');
                    localStorage.removeItem('pending_translation');

                    // If user is now logged in, automatically save it to their library
                    if (user) {
                        saveToLibraryLocal(parsed.source, parsed.translated, parsed.targetLang);
                    }
                } catch (e) {
                    console.error('Failed to parse pending translation:', e);
                }
            }
        }
    }, [user]);

    // 2. Load saved translations library for logged in user
    useEffect(() => {
        loadSavedTranslations();
    }, [user]);

    const loadSavedTranslations = () => {
        if (typeof window !== 'undefined') {
            const key = user ? `byknit_saved_translations_${user.id}` : `byknit_saved_translations_guest`;
            const saved = localStorage.getItem(key);
            if (saved) {
                try {
                    setSavedTranslations(JSON.parse(saved));
                } catch (e) {
                    console.error('Failed to parse saved translations:', e);
                }
            } else {
                setSavedTranslations([]);
            }
        }
    };

    const saveToLibraryLocal = (source: string, translated: string, lang: 'ko' | 'en') => {
        if (!user) {
            handleAuthCheck();
            return;
        }

        const key = `byknit_saved_translations_${user.id}`;
        const newTrans: SavedTranslation = {
            id: Math.random().toString(36).substring(2, 15),
            source,
            translated,
            lang,
            createdAt: new Date().toISOString()
        };

        const existing = localStorage.getItem(key);
        let list: SavedTranslation[] = [];
        if (existing) {
            try {
                list = JSON.parse(existing);
            } catch (e) {
                console.error(e);
            }
        }

        // Avoid exact duplicates
        list = [newTrans, ...list.filter(t => t.source.trim() !== source.trim())];
        localStorage.setItem(key, JSON.stringify(list));
        setSavedTranslations(list);

        // Show success alert
        alert(locale === 'ko'
            ? '🎉 번역 도안이 나의 보관함 서재에 성공적으로 보관되었습니다!'
            : '🎉 Pattern translation successfully saved to your Library!');
    };

    const handleDeleteTranslation = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;
        if (confirm(locale === 'ko' ? '이 번역 기록을 보관함에서 삭제하시겠습니까?' : 'Delete this translation from your Library?')) {
            const key = `byknit_saved_translations_${user.id}`;
            const updated = savedTranslations.filter(t => t.id !== id);
            localStorage.setItem(key, JSON.stringify(updated));
            setSavedTranslations(updated);
        }
    };

    const handleLoadTranslation = (item: SavedTranslation) => {
        setSourceText(item.source);
        setTranslatedText(item.translated);
        setTargetLang(item.lang);
        setShowNudge(false);
        window.scrollTo({ top: 150, behavior: 'smooth' });
    };

    // Load template patterns to help users test easily
    const samplePatterns = {
        en: "Row 1 (RS): Sl 1, k 2, * yo, k2tog, k 3 *; rep from * to * to last 3 sts, k 3.\nRow 2 (WS): Sl 1, p to end.\nRow 3: Sl 1, k 4, * yo, k2tog, k 3 *; rep from * to * to last st, k 1.",
        ko: "1단 (겉면): 걸러뜨기 1코, 겉뜨기 2코, * 바늘비우기, 왼코 겹치기, 겉뜨기 3코 *; *부터 *까지 마지막 3코 전까지 반복, 겉뜨기 3코.\n2단 (안면): 걸러뜨기 1코, 안뜨기 끝까지.\n3단: 걸러뜨기 1코, 겉뜨기 4코, * 바늘비우기, 왼코 겹치기, 겉뜨기 3코 *; *부터 *까지 마지막 1코 전까지 반복, 겉뜨기 1코."
    };

    const handleTranslate = async () => {
        if (!user) {
            handleAuthCheck();
            return;
        }
        if (!sourceText.trim()) return;
        setIsTranslating(true);
        try {
            // Deduct exactly 1 coin for logged-in users before translating
            if (user) {
                try {
                    await deductCredits(
                        user.id,
                        1,
                        locale === 'ko' ? 'AI 도안 번역' : 'AI Pattern Translation'
                    );
                } catch (creditError: any) {
                    if (creditError.message === 'Insufficient credits') {
                        alert(locale === 'ko'
                            ? '크레딧이 부족합니다! 😢\n커뮤니티 활동(글쓰기 +50 크레딧) 등을 통해 크레딧을 충전해 주세요.'
                            : 'Insufficient credits! 😢\nPlease earn credits by writing posts (+50 credits) or through other community activities.'
                        );
                        return;
                    }
                    throw creditError;
                }
            }

            const result = await translateText(sourceText, targetLang);
            setTranslatedText(result);
            // Show registration nudge to non-logged in users after successful translation
            if (!user) {
                setShowNudge(true);
            }
        } catch (error) {
            console.error('Translation error:', error);
            alert(locale === 'ko' ? '번역 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' : 'An error occurred during translation. Please try again.');
        } finally {
            setIsTranslating(false);
        }
    };

    const handleCopy = () => {
        if (!translatedText) return;
        navigator.clipboard.writeText(translatedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadPDF = async () => {
        if (!user) {
            handleAuthCheck();
            return;
        }

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const bottomMargin = 20;
        const contentWidth = pageWidth - (margin * 2);

        // Helper to render Korean text as image in PDF
        const renderTextAsImage = async (text: string, x: number, y: number, fontSize: number, color: string, isBold: boolean, align: 'left' | 'center' = 'left') => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const scale = 4;
            const fontWeight = isBold ? 'bold' : 'normal';
            const fontStr = `${fontWeight} ${fontSize * scale}px "Pretendard", "Noto Sans KR", Arial, sans-serif`;
            ctx.font = fontStr;

            const metrics = ctx.measureText(text);
            const textWidth = metrics.width / (scale * 3.5);

            let drawX = x;
            if (align === 'center') drawX = x - (textWidth / 2);

            canvas.width = metrics.width + 40;
            canvas.height = (fontSize * scale) * 1.5;

            ctx.font = fontStr;
            ctx.fillStyle = color;
            ctx.textBaseline = 'top';
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillText(text, 10, 0);

            const imgData = canvas.toDataURL('image/png');
            const pdfW = canvas.width / (scale * 3.5);
            const pdfH = canvas.height / (scale * 3.5);

            doc.addImage(imgData, 'PNG', drawX, y, pdfW, pdfH);
        };

        // Helper to draw wrapped multiline text
        const drawMultilineText = async (plainText: string, startX: number, startY: number, fontSize: number, color: string, maxWidth: number) => {
            // Filter out empty lines to control spacing programmatically
            const paragraphs = plainText.split('\n').map(p => p.trim()).filter(Boolean);
            let currentY = startY;
            const lineHeight = fontSize * 1.6;

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return currentY;

            const scale = 4;
            const canvasMaxWidth = maxWidth * scale * 3.5;

            const isBigHeader = (text: string) => {
                const trimmed = text.trim().replace(/^###\s*/, '');
                return trimmed.startsWith('시작 부분') || 
                       trimmed.startsWith('제작 방법') ||
                       text.trim().startsWith('###');
            };

            const isSubHeader = (text: string) => {
                const trimmed = text.trim();
                return /^(?:\d+[\s\.\)]|🔘|✨|⚡|🚀|✦|★|☆|■)/u.test(trimmed) || 
                       trimmed.startsWith('단추 달기') ||
                       trimmed.startsWith('도안 설명') ||
                       trimmed.startsWith('번역 결과');
            };

            for (let idx = 0; idx < paragraphs.length; idx++) {
                const para = paragraphs[idx];
                const isBig = isBigHeader(para);
                const isSub = isSubHeader(para);
                const isHeader = isBig || isSub;

                // Spacing before big headers ONLY (except the first one)
                if (isBig && idx > 0) {
                    currentY += lineHeight * 1.2; // 2-3 lines gap before new big sections
                }

                const fontStr = `${isHeader ? 'bold' : 'normal'} ${fontSize * scale}px "Pretendard", "Noto Sans KR", Arial, sans-serif`;
                ctx.font = fontStr;

                const lines: string[] = [];
                let currentLine = '';

                for (let i = 0; i < para.length; i++) {
                    const char = para[i];
                    const testLine = currentLine + char;
                    const metrics = ctx.measureText(testLine);

                    if (metrics.width > canvasMaxWidth && currentLine !== '') {
                        lines.push(currentLine);
                        currentLine = char;
                    } else {
                        currentLine = testLine;
                    }
                }
                if (currentLine !== '') {
                    lines.push(currentLine);
                }

                for (const line of lines) {
                    if (currentY + lineHeight > pageHeight - bottomMargin) {
                        doc.addPage();
                        currentY = 20;
                    }

                    await renderTextAsImage(line, startX, currentY, fontSize, color, isHeader);
                    currentY += lineHeight;
                }
            }
            return currentY;
        };

        // Draw Title
        await renderTextAsImage("byKnit AI Translated Pattern", margin, 20, 20, '#543e35', true);
        
        // Draw Date
        const dateStr = `Date: ${new Date().toLocaleDateString()}`;
        await renderTextAsImage(dateStr, margin, 32, 10, '#8a7366', false);

        // Draw translated text with automatic wrapping and page breaks
        await drawMultilineText(translatedText, margin, 45, 11, '#333333', contentWidth);

        // Add Watermark & Footer to all pages
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            
            // Draw simple footer
            await renderTextAsImage(`Page ${i} of ${pageCount} • Powered by byKnit`, pageWidth / 2, pageHeight - 12, 8, '#888888', false, 'center');
            
            // Draw simple watermark
            if (user?.email) {
                const watermarkText = `Licensed to ${user.email}`;
                doc.setTextColor(180, 180, 180);
                doc.setFontSize(8);
                doc.text(watermarkText, pageWidth / 2, 6, { align: 'center' });
                doc.text(watermarkText, pageWidth / 2, pageHeight - 6, { align: 'center' });
            }
        }

        doc.save("byknit-translated-pattern.pdf");
    };

    const handleNudgeAction = () => {
        // Save the translated text locally so user doesn't lose it upon signup
        if (typeof window !== 'undefined') {
            localStorage.setItem('pending_translation', JSON.stringify({
                source: sourceText,
                translated: translatedText,
                targetLang
            }));
        }
        router.push(`/${locale}/signup?redirect=translator`);
    };

    const toggleLanguage = () => {
        setTargetLang(prev => prev === 'ko' ? 'en' : 'ko');
        setSourceText('');
        setTranslatedText('');
        setShowNudge(false);
    };

    const loadSample = () => {
        setSourceText(targetLang === 'ko' ? samplePatterns.en : samplePatterns.ko);
        setTranslatedText('');
        setShowNudge(false);
    };

    const content = (
        <div className={isTabMode ? "space-y-6 relative" : "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10"}>
            {/* Translator Controller Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl border border-tan-200 shadow-soft mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-lg bg-cream-100 text-xs font-bold text-brown-600 border border-tan-200">
                        {locale === 'ko'
                            ? (targetLang === 'ko' ? 'English (영문 도안)' : '한국어 (국문 도안)')
                            : (targetLang === 'ko' ? 'English Pattern' : 'Korean Pattern')}
                    </div>
                    <button
                        onClick={toggleLanguage}
                        className="p-2 rounded-full hover:bg-cream-100 text-brown-500 transition-colors border border-tan-200 bg-white"
                        title="Toggle translation direction"
                    >
                        <ArrowRightLeft className="w-4 h-4" />
                    </button>
                    <div className="px-3 py-1.5 rounded-lg bg-cream-100 text-xs font-bold text-brown-600 border border-tan-200">
                        {locale === 'ko'
                            ? (targetLang === 'ko' ? '한국어 (국문 해설)' : 'English (US/UK Pattern)')
                            : (targetLang === 'ko' ? 'Korean Translation' : 'English Translation')}
                    </div>
                </div>

                <button
                    onClick={loadSample}
                    className="text-xs font-semibold text-rose-400 hover:text-rose-500 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-rose-50/50 border border-rose-100"
                >
                    <BookOpen className="w-3.5 h-3.5" />
                    {locale === 'ko' ? '샘플 도안 채우기' : 'Load Sample Pattern'}
                </button>
            </div>

            {showGuide && (
                <div className="bg-gradient-to-r from-rose-50 to-cream-50/50 p-6 rounded-3xl border border-rose-100 shadow-rose-sm space-y-4 relative animate-in fade-in slide-in-from-top-3 duration-300">
                    <button
                        onClick={() => setShowGuide(false)}
                        className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-600 hover:bg-rose-100/50 transition-colors"
                        title="Close guide"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2 text-brown-800 border-b border-tan-100 pb-2">
                        <HelpCircle className="w-5 h-5 text-rose-400" />
                        <h3 className="font-extrabold text-base">
                            {locale === 'ko' ? '🧶 뜨개인을 위한 3초 사용 설명서' : '🧶 Knitter\'s 3-Second Quick Guide'}
                        </h3>
                    </div>

                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 pr-6">
                        <div className="space-y-2 p-4 rounded-2xl bg-white/70 border border-tan-100/50 shadow-sm">
                            <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center font-bold text-xs">1</div>
                            <h4 className="text-sm font-bold text-brown-800">
                                {locale === 'ko' ? '원문 도안 복사' : 'Copy Original Pattern'}
                            </h4>
                            <p className="text-xs text-brown-600 leading-relaxed">
                                {locale === 'ko'
                                    ? 'Ravelry 등 영문 도안에서 복잡한 약어로 된 단(Row)을 드래그하여 복사하세요.'
                                    : 'Drag and copy standard abbreviation lines (e.g. Row 1: k2, p2...) from Ravelry.'}
                            </p>
                        </div>

                        <div className="space-y-2 p-4 rounded-2xl bg-white/70 border border-tan-100/50 shadow-sm">
                            <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center font-bold text-xs">2</div>
                            <h4 className="text-sm font-bold text-brown-800">
                                {locale === 'ko' ? '방향 확인하기' : 'Verify Direction'}
                            </h4>
                            <p className="text-xs text-brown-600 leading-relaxed">
                                {locale === 'ko'
                                    ? '기본값은 영문 ➡️ 한글입니다. 국문을 영문으로 바꾸려면 중앙의 ⇆ 버튼을 누르세요.'
                                    : 'Default is EN ➡️ KO. Click the central ⇆ button if you want to translate KO ➡️ EN.'}
                            </p>
                        </div>

                        <div className="space-y-2 p-4 rounded-2xl bg-white/70 border border-tan-100/50 shadow-sm">
                            <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center font-bold text-xs">3</div>
                            <h4 className="text-sm font-bold text-brown-800">
                                {locale === 'ko' ? '정밀 분석 시작' : 'AI Translate'}
                            </h4>
                            <p className="text-xs text-brown-600 leading-relaxed">
                                {locale === 'ko'
                                    ? '왼쪽 패널에 붙여넣고 번역기 버튼을 누르면 AI가 기호 약어들을 한글 전용 뜨개식 정형어로 해독합니다.'
                                    : 'Paste and click Translate. Our custom engine parses craft abbreviations into clean terms.'}
                            </p>
                        </div>

                        <div className="space-y-2 p-4 rounded-2xl bg-white/70 border border-tan-100/50 shadow-sm">
                            <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center font-bold text-xs">4</div>
                            <h4 className="text-sm font-bold text-brown-800">
                                {locale === 'ko' ? '보관 및 인쇄' : 'Save & Print'}
                            </h4>
                            <p className="text-xs text-brown-600 leading-relaxed">
                                {locale === 'ko'
                                    ? '해석된 결과는 내 보관함에 영구 저장하거나 인쇄용 PDF로 다운받아 뜨개 곁에 두고 활용하세요!'
                                    : 'Save translation to library for permanent sync, or download cleanly styled PDF for offline crafting.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Double Panel */}
            <div className="grid lg:grid-cols-2 gap-6 items-stretch">
                {/* Left: Input Panel */}
                <div className="flex flex-col rounded-3xl bg-white border border-tan-200 shadow-soft overflow-hidden min-h-[480px]">
                    <div className="bg-cream-50/60 px-6 py-4 border-b border-tan-100 flex items-center justify-between">
                        <span className="text-sm font-bold text-brown-700">
                            {locale === 'ko'
                                ? (targetLang === 'ko' ? '영어 원문 도안 입력' : '한국어 원문 도안 입력')
                                : (targetLang === 'ko' ? 'English Original Pattern' : 'Korean Original Pattern')}
                        </span>
                        <span className="text-xs text-brown-500 font-medium">
                            {sourceText.length} {locale === 'ko' ? '자' : 'chars'}
                        </span>
                    </div>
                    <div className="flex-1 flex flex-col p-6">
                        <textarea
                            value={sourceText}
                            onChange={(e) => setSourceText(e.target.value)}
                            placeholder={targetLang === 'ko'
                                ? (locale === 'ko' ? "여기에 영문 도안을 붙여넣으세요...\n\n예: Row 1 (RS): K2, p2, yo, k2tog..." : "Paste English pattern here...\n\nExample: Row 1 (RS): Sl 1, k 2, * yo, k2tog, k 3 *...")
                                : (locale === 'ko' ? "여기에 한국어 도안을 붙여넣으세요...\n\n예: 1단 (겉면): 겉뜨기 2코, 안뜨기 2코..." : "Paste Korean pattern here...\n\nExample: 1단 (겉면): 걸러뜨기 1코, 겉뜨기 2코...")}
                            className="w-full flex-1 min-h-[300px] outline-none resize-none text-brown-700 placeholder-brown-400/50 text-sm leading-relaxed"
                        />

                        <button
                            onClick={handleTranslate}
                            disabled={isTranslating || !sourceText.trim()}
                            className="w-full btn-primary py-3.5 mt-4 flex items-center justify-center gap-2 font-bold shadow-rose-sm disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {isTranslating ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    <span>{locale === 'ko' ? '뜨개 도안 정밀 분석 중...' : 'Analyzing pattern...'}</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    <span>{locale === 'ko' ? 'AI 뜨개 도안 번역하기' : 'AI Translate Pattern'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right: Output Panel */}
                <div className="flex flex-col rounded-3xl bg-white border border-tan-200 shadow-soft overflow-hidden min-h-[480px] relative">
                    <div className="bg-cream-50/60 px-6 py-4 border-b border-tan-100 flex items-center justify-between">
                        <span className="text-sm font-bold text-brown-700">
                            {locale === 'ko' ? 'AI 실시간 번역 결과' : 'AI Translation Result'}
                        </span>
                        {translatedText && (
                            <button
                                onClick={handleCopy}
                                className="p-1.5 rounded-lg hover:bg-cream-100 text-brown-500 hover:text-brown-700 transition-all flex items-center gap-1.5 text-xs font-semibold"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 text-green-500 animate-in zoom-in-50" />
                                        <span className="text-green-600">{locale === 'ko' ? '복사 완료' : 'Copied'}</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>{locale === 'ko' ? '결과 복사' : 'Copy Result'}</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col p-6">
                        {translatedText ? (
                            <div className="flex-1 flex flex-col justify-between">
                                <div className="whitespace-pre-wrap text-sm text-brown-700 leading-relaxed font-sans min-h-[250px] select-text">
                                    {translatedText}
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-3 mt-6 border-t border-tan-100 pt-4">
                                    <button
                                        onClick={() => saveToLibraryLocal(sourceText, translatedText, targetLang)}
                                        className="btn-secondary py-3 flex items-center justify-center gap-2 text-xs font-bold shadow-sm"
                                    >
                                        <Bookmark className="w-4 h-4" />
                                        <span>{locale === 'ko' ? '내 보관함에 저장' : 'Save to Library'}</span>
                                    </button>
                                    <button
                                        onClick={handleDownloadPDF}
                                        className="btn-secondary py-3 flex items-center justify-center gap-2 text-xs font-bold shadow-sm"
                                    >
                                        <FileDown className="w-4 h-4" />
                                        <span>{locale === 'ko' ? '인쇄용 PDF 다운' : 'Export to PDF'}</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                <div className="w-16 h-16 rounded-2xl bg-cream-50 flex items-center justify-center border border-tan-100 text-tan-300 mb-4">
                                    <Sparkles className="w-8 h-8" />
                                </div>
                                <h3 className="text-sm font-bold text-brown-600 mb-1">
                                    {locale === 'ko' ? '번역 대기 중' : 'Waiting for Translation'}
                                </h3>
                                <p className="text-xs text-brown-500 max-w-xs leading-normal">
                                    {locale === 'ko'
                                        ? '왼쪽 창에 영문 도안을 붙여넣고 AI 번역하기 버튼을 누르면 정밀 해석이 여기에 표시됩니다.'
                                        : 'Paste a pattern into the left panel and click Translate to see the specialized result here.'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Conversion Nudge Overlay (Slide Up Card) */}
                    {showNudge && !user && (
                        <div className="absolute inset-x-4 bottom-4 p-5 rounded-2xl bg-gradient-to-r from-brown-600 to-brown-700 text-white shadow-xl border border-brown-500 animate-in slide-in-from-bottom-5 duration-500 z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="space-y-1 text-center sm:text-left">
                                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                                    <Lock className="w-4 h-4 text-rose-300 animate-bounce" />
                                    <h4 className="font-bold text-sm text-rose-100">
                                        {locale === 'ko' ? '평생 잃어버리지 마세요! 🧶' : 'Never Lose Your Work! 🧶'}
                                    </h4>
                                </div>
                                <p className="text-xs text-cream-100 max-w-md leading-relaxed">
                                    {locale === 'ko'
                                        ? '3초 간편가입만 하시면 이 정밀 번역본을 개인 보관함에 평생 소장하고 깔끔한 인쇄용 PDF로 다운받을 수 있습니다.'
                                        : 'Sign up in 3 seconds to keep this custom translation in your personal Library forever and download as PDF.'}
                                </p>
                            </div>
                            <button
                                onClick={handleNudgeAction}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-300 to-peach-200 hover:from-rose-400 hover:to-peach-300 text-brown-800 font-extrabold text-xs shadow-md transition-all active:scale-[0.97] whitespace-nowrap"
                            >
                                {locale === 'ko' ? '3초 만에 무료 가입하기' : 'Free 3-Second Sign Up'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. My Saved Translations Library (History) */}
            {user && savedTranslations.length > 0 && (
                <div className="mt-12 space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
                    <div className="flex items-center gap-2 text-brown-700 border-b border-tan-200 pb-2">
                        <FolderHeart className="w-5 h-5 text-rose-400" />
                        <h3 className="font-bold text-base">
                            {locale === 'ko' ? '나의 저장된 뜨개 번역 서재' : 'My Saved Translation Library'}
                        </h3>
                        <span className="text-xs bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full font-black">
                            {savedTranslations.length}
                        </span>
                    </div>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {savedTranslations.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => handleLoadTranslation(item)}
                                className="bg-white p-5 rounded-2xl border border-tan-200 shadow-sm hover:shadow-md hover:border-rose-200 transition-all cursor-pointer group flex flex-col justify-between min-h-[140px]"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[10px] text-brown-400 font-medium">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded bg-cream-100 text-brown-600 font-bold border border-tan-100">
                                            {item.lang === 'ko' ? 'EN ➡️ KO' : 'KO ➡️ EN'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-brown-700 font-bold line-clamp-2 leading-relaxed">
                                        {item.source}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between border-t border-tan-100 pt-3 mt-3">
                                    <span className="text-[10px] text-rose-400 font-bold group-hover:underline">
                                        {locale === 'ko' ? '보관함에서 불러오기' : 'Restore Pattern'}
                                    </span>
                                    <button
                                        onClick={(e) => handleDeleteTranslation(item.id, e)}
                                        className="p-1 rounded-lg hover:bg-red-50 text-brown-400 hover:text-red-500 transition-colors"
                                        title="Delete translation"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Warning Context */}
            <div className="mt-8 flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200/60 shadow-soft">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <h4 className="text-xs font-bold text-amber-700">
                        {locale === 'ko' ? 'AI 번역 참고 유의사항' : 'AI Translation Information'}
                    </h4>
                    <p className="text-[11px] text-amber-600 leading-normal">
                        {locale === 'ko'
                            ? '본 AI 번역기는 대바늘/코바늘 전문 약어 및 서술형 패턴 해설에 완벽하게 맞춤 설계되었으나, 원문 도안 자체의 오타나 기형적 표현으로 인해 일부 미세한 오류가 존재할 수 있습니다. 뜨개질 시작 전에 항상 치수와 게이지를 확인해 주세요.'
                            : 'Our translator is highly optimized for standard craft terminology. However, please review sizing and gauge details before knitting as original formatting errors may occasionally carry over.'}
                    </p>
                </div>
            </div>
        </div>
    );

    if (isTabMode) {
        return content;
    }

    return (
        <div className="min-h-screen bg-cream-50 pb-20 relative">
            {/* Decorative Top Arch */}
            <div className="bg-gradient-to-b from-cream-100 to-cream-50 py-12 border-b border-tan-100">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-sage-300 shadow-soft mb-2">
                        <Sparkles className="w-4 h-4 text-sage-400 animate-pulse" />
                        <span className="text-xs text-brown-600 font-semibold uppercase tracking-wider">AI Translation Laboratory</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-brown-700 tracking-tight">
                        {locale === 'ko' ? 'AI 뜨개 도안 번역기' : 'AI Knitwear Pattern Translator'}
                    </h1>
                    <p className="text-brown-600 text-md sm:text-lg max-w-2xl mx-auto font-medium">
                        {locale === 'ko'
                            ? '구글 번역도 포기한 서술형 영문 도안 약어를 완벽하게 분석하여 직관적인 한국어 용어로 번역해 줍니다.'
                            : 'Translate specialized knitting patterns between Korean and English with craft-specific accuracy.'}
                    </p>
                </div>
            </div>
            {content}
        </div>
    );
}
