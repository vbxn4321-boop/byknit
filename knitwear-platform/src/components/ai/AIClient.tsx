'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { User } from '@supabase/supabase-js';
import {
    Upload, Image as ImageIcon, MessageSquare, Sparkles,
    AlertTriangle, Send, Loader2, Download, Settings2, PenTool, Coins, Lock
} from 'lucide-react';
import { useEditorPersistence } from '@/hooks/useEditorPersistence';
import { jsPDF } from 'jspdf';
import { quantizeImage } from '@/utils/imageProcessing';
import { createClient } from '@/utils/supabase/client';
import { deductCredits } from '@/app/actions/credits';

interface ConversionResult {
    grid: number[][];
    palette: string[];
    width: number;
    height: number;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    gridData?: ConversionResult;
}

interface AIClientProps {
    locale: string;
    user: User | null;
    initialCredits: number;
}

export function AIClient({ locale, user, initialCredits }: AIClientProps) {
    const t = useTranslations('ai');
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'image' | 'chat'>('image');
    const [credits, setCredits] = useState(initialCredits || 0);

    // Realtime credit updates
    useEffect(() => {
        if (!user) return;
        const supabase = createClient();
        const channel = supabase
            .channel('ai_credits')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
                (payload) => {
                    if (payload.new && 'credits' in payload.new) {
                        setCredits(payload.new.credits as number);
                    }
                }
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user]);

    return (
        <div className="min-h-screen bg-cream-50 pb-20 relative">
            {/* Header */}
            <div className="bg-gradient-to-b from-cream-100 to-cream-50 py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-sage-300 shadow-soft mb-6">
                        <Sparkles className="w-4 h-4 text-sage-400" />
                        <span className="text-sm text-brown-600 font-medium">AI-Powered</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-brown-700 mb-6">{t('title')}</h1>
                    <p className="text-brown-600 text-lg mb-8">{t('imageToChart.description')}</p>
                </div>
            </div>

            {/* AI Warning */}
            {user && (
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 animate-in fade-in duration-300">
                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-soft">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-medium text-amber-700">{t('warning.title')}</h3>
                            <p className="text-sm text-amber-600 mt-1">{t('warning.message')}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {!user ? (
                    <div className="max-w-md mx-auto my-8 p-8 rounded-3xl bg-white border border-tan-200 shadow-soft text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto shadow-rose-sm">
                            <Lock className="w-8 h-8 text-rose-400 animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-extrabold text-brown-800">
                                {locale === 'ko' ? '🔒 로그인이 필요한 장치입니다' : '🔒 Login Required'}
                            </h2>
                            <p className="text-sm text-brown-600 leading-relaxed">
                                {locale === 'ko' 
                                    ? '이 도구(차트 변환기)를 사용하시려면 먼저 로그인을 완료해 주세요.' 
                                    : 'Please log in to your account to unlock and use the AI Chart Converter.'}
                            </p>
                        </div>
                        <div className="pt-2">
                            <button
                                onClick={() => router.push(`/${locale}/login`)}
                                className="inline-flex items-center justify-center w-full px-6 py-3 rounded-full bg-gradient-to-r from-rose-400 to-peach-400 text-white font-bold hover:shadow-rose-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                            >
                                {locale === 'ko' ? '로그인 하러 가기' : 'Go to Login'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <ImageToChartTab locale={locale} credits={credits} user={user} />
                )}
            </div>
        </div>
    );
}

function ImageToChartTab({ locale, credits, user }: { locale: string, credits: number, user: User | null }) {
    const t = useTranslations('ai.imageToChart');
    const router = useRouter();
    const { saveAIImport } = useEditorPersistence();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [image, setImage] = useState<string | null>(null);
    const [isConverting, setIsConverting] = useState(false);
    const [result, setResult] = useState<ConversionResult | null>(null);
    const [exportFormat, setExportFormat] = useState<'png' | 'jpg' | 'pdf'>('png');
    const [showGridInExport, setShowGridInExport] = useState(true);
    const [showNumbersInExport, setShowNumbersInExport] = useState(true);
    const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
    const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
    const [conversionMode, setConversionMode] = useState<'photo' | 'pixel'>('photo');
    const [settings, setSettings] = useState({
        targetWidth: 50,
        targetHeight: 50,
        maxColors: 8,
    });

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const resultStr = e.target?.result as string;
                setImage(resultStr);
                setResult(null);

                // Load image to get initial aspect ratio
                const img = new Image();
                img.onload = () => {
                    const ratio = img.width / img.height;
                    setImageAspectRatio(ratio);
                    // Initial sync
                    setSettings(prev => ({
                        ...prev,
                        targetHeight: Math.round(prev.targetWidth / ratio)
                    }));
                };
                img.src = resultStr;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleConvert = async () => {
        if (!image) return;

        // Check credits before starting
        const cost = 100;
        if (credits < cost) {
            alert(locale === 'ko' ? '코인이 부족합니다. (필요: 100)' : 'Insufficient credits. (Need: 100)');
            return;
        }

        setIsConverting(true);

        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
                img.src = image;
            });

            // Calculate dimensions
            let targetWidth = settings.targetWidth;
            let targetHeight = settings.targetHeight;

            if (maintainAspectRatio) {
                const aspectRatio = img.width / img.height;
                targetHeight = Math.round(settings.targetWidth / aspectRatio);

                if (targetHeight > settings.targetHeight) {
                    targetHeight = settings.targetHeight;
                    targetWidth = Math.round(settings.targetHeight * aspectRatio);
                }
            }

            targetWidth = Math.max(5, targetWidth);
            targetHeight = Math.max(5, targetHeight);

            // Create a temporary canvas for pixel data extraction
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
            if (!tempCtx) throw new Error('Could not get canvas context');

            tempCanvas.width = targetWidth;
            tempCanvas.height = targetHeight;

            // Offscreen canvas for flattening transparency
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = img.width;
            offscreenCanvas.height = img.height;
            const offscreenCtx = offscreenCanvas.getContext('2d');
            if (!offscreenCtx) throw new Error('Could not get offscreen context');

            // Fill white on offscreen canvas first
            offscreenCtx.fillStyle = '#FFFFFF';
            offscreenCtx.fillRect(0, 0, img.width, img.height);
            offscreenCtx.drawImage(img, 0, 0);

            // Draw the flattened image onto the target resizing canvas
            // Disable smoothing for sharp pixelation (prevents color bleeding artifacts)
            // Use 'photo' (smooth) for complex images to avoid aliasing artifacts
            // Use 'pixel' (sharp) for pixel art to preserve edges
            tempCtx.imageSmoothingEnabled = conversionMode === 'photo';

            tempCtx.drawImage(offscreenCanvas, 0, 0, targetWidth, targetHeight);

            const imageData = tempCtx.getImageData(0, 0, targetWidth, targetHeight);
            const pixels = imageData.data;

            // Use K-Means quantization for better color selection
            const { palette, grid } = quantizeImage(
                pixels,
                targetWidth,
                targetHeight,
                settings.maxColors
            );

            // Deduct credits after successful conversion
            await deductCredits(user?.id!, 100, 'AI Image Conversion');

            setResult({
                width: targetWidth,
                height: targetHeight,
                palette,
                grid
            });
        } catch (error) {
            console.error('Conversion error:', error);
            if (error instanceof Error && error.message === 'Insufficient credits') {
                alert(locale === 'ko' ? '크레딧이 부족합니다.' : 'Insufficient credits.');
            } else {
                alert(locale === 'ko' ? '이미지 변환 중 오류가 발생했습니다.' : 'An error occurred during conversion.');
            }
        } finally {
            setIsConverting(false);
        }
    };

    // Draw Preview
    useEffect(() => {
        if (!canvasRef.current || !result) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const containerSize = Math.min(canvas.parentElement?.clientWidth || 400, canvas.parentElement?.clientHeight || 400) - 32;
        const cellSize = Math.floor(containerSize / Math.max(result.width, result.height));

        canvas.width = result.width * cellSize;
        canvas.height = result.height * cellSize;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < result.height; y++) {
            for (let x = 0; x < result.width; x++) {
                const colorIdx = result.grid[y][x];
                ctx.fillStyle = result.palette[colorIdx] || '#FFFFFF';
                // Solid pixels without gaps for cleaner preview
                // Add slight overlap (0.5) to prevent sub-pixel rendering gaps
                ctx.fillRect(x * cellSize, y * cellSize, cellSize + 0.5, cellSize + 0.5);
            }
        }
    }, [result]);

    const handleEditInEditor = async () => {
        if (!result) return;
        if (credits < 10) {
            alert(locale === 'ko' ? '코인이 부족합니다.' : 'Insufficient credits.');
            return;
        }

        try {
            await deductCredits(user?.id!, 10, 'AI Editor Import');
            saveAIImport(result);
            router.push(`/${locale}/editor?import=ai`);
        } catch (error) {
            console.error('Error deducting credits:', error);
            alert(locale === 'ko' ? '크레딧 차감 중 오류가 발생했습니다.' : 'Error deducting credits.');
        }
    };

    const generateExportCanvas = () => {
        if (!result) return null;

        const cellSize = 30; // Larger for high quality export
        const margin = showNumbersInExport ? 60 : 20;
        const exportCanvas = document.createElement('canvas');
        const ctx = exportCanvas.getContext('2d');
        if (!ctx) return null;

        exportCanvas.width = result.width * cellSize + margin * 2;
        exportCanvas.height = result.height * cellSize + margin * 2;

        // Background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

        // Styling for numbers
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw cells and numbers
        for (let y = 0; y < result.height; y++) {
            for (let x = 0; x < result.width; x++) {
                const posX = x * cellSize + margin;
                const posY = y * cellSize + margin;
                const colorIdx = result.grid[y][x];

                // Cell
                ctx.fillStyle = result.palette[colorIdx] || '#FFFFFF';
                ctx.fillRect(posX, posY, cellSize, cellSize);

                // Grid lines (if enabled)
                if (showGridInExport) {
                    ctx.strokeStyle = '#E2E8F0';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(posX, posY, cellSize, cellSize);
                }

                // Row numbers
                if (showNumbersInExport && x === 0) {
                    ctx.fillStyle = '#64748B';
                    ctx.fillText((result.height - y).toString(), margin / 2, posY + cellSize / 2);
                }

                // Column numbers
                if (showNumbersInExport && y === 0) {
                    ctx.fillStyle = '#64748B';
                    ctx.fillText((x + 1).toString(), posX + cellSize / 2, margin / 2);
                }
            }
        }

        // Project Title
        ctx.fillStyle = '#1E293B';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Knitting Pattern Chart', exportCanvas.width / 2, exportCanvas.height - margin / 2);

        return exportCanvas;
    };

    const handleDownload = async () => {
        if (!result) return;
        if (credits < 10) {
            alert(locale === 'ko' ? '크레딧이 부족합니다.' : 'Insufficient credits.');
            return;
        }

        const canvas = generateExportCanvas();
        if (!canvas) return;

        try {
            await deductCredits(user?.id!, 10, `AI Export (${exportFormat.toUpperCase()})`);
            if (exportFormat === 'pdf') {
                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                const pdf = new jsPDF({
                    orientation: canvas.width > canvas.height ? 'l' : 'p',
                    unit: 'px',
                    format: [canvas.width, canvas.height]
                });
                pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
                pdf.save('pattern.pdf');
            } else {
                const link = document.createElement('a');
                link.download = `pattern.${exportFormat}`;
                link.href = canvas.toDataURL(exportFormat === 'jpg' ? 'image/jpeg' : 'image/png');
                link.click();
            }
        } catch (error) {
            console.error('Error deducting credits:', error);
            alert(locale === 'ko' ? '크레딧 차감 중 오류가 발생했습니다.' : 'Error deducting credits.');
        }
    };

    return (
        <div className="space-y-6">

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Upload Section */}
                <div className="space-y-4">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative aspect-square rounded-3xl border-2 border-dashed transition-all cursor-pointer ${image
                            ? 'border-rose-300 bg-rose-300/5'
                            : 'border-tan-200 bg-white hover:border-rose-300'
                            }`}
                    >
                        {image ? (
                            <img src={image} alt="Uploaded" className="w-full h-full object-contain rounded-3xl" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-cream-100 flex items-center justify-center">
                                    <Upload className="w-8 h-8 text-brown-600" />
                                </div>
                                <p className="text-brown-600 text-center px-4">{t('dragDrop')}</p>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </div>

                    {/* Settings */}
                    <div className="p-5 rounded-2xl bg-white border border-tan-200 shadow-soft space-y-4">
                        <div className="flex items-center gap-2 text-brown-700 font-semibold">
                            <Settings2 className="w-4 h-4" />
                            {t('settings')}
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-sm text-brown-600">{t('targetWidth')}: {settings.targetWidth}</label>
                                <input
                                    type="range"
                                    min="10"
                                    max="150"
                                    value={settings.targetWidth}
                                    onChange={(e) => {
                                        const newWidth = Number(e.target.value);
                                        setSettings(prev => ({
                                            ...prev,
                                            targetWidth: newWidth,
                                            // Auto-update height if ratio locked
                                            targetHeight: (maintainAspectRatio && imageAspectRatio)
                                                ? Math.round(newWidth / imageAspectRatio)
                                                : prev.targetHeight
                                        }));
                                    }}
                                    className="w-full accent-rose-300"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-brown-600">{t('targetHeight')}: {settings.targetHeight}</label>
                                <input
                                    type="range"
                                    min="10"
                                    max="150"
                                    value={settings.targetHeight}
                                    onChange={(e) => {
                                        const newHeight = Number(e.target.value);
                                        setSettings(prev => ({
                                            ...prev,
                                            targetHeight: newHeight,
                                            // Auto-update width if ratio locked
                                            targetWidth: (maintainAspectRatio && imageAspectRatio)
                                                ? Math.round(newHeight * imageAspectRatio)
                                                : prev.targetWidth
                                        }));
                                    }}
                                    className="w-full accent-rose-300"
                                />
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="maintainAspectRatio"
                                    checked={maintainAspectRatio}
                                    onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                                    className="accent-rose-300 w-4 h-4"
                                />
                                <label htmlFor="maintainAspectRatio" className="text-sm text-brown-600 cursor-pointer select-none">
                                    {t('maintainAspectRatio')}
                                </label>
                            </div>
                            <div>
                                <label className="text-sm text-brown-600">{t('conversionMode')}</label>
                                <select
                                    value={conversionMode}
                                    onChange={(e) => setConversionMode(e.target.value as 'photo' | 'pixel')}
                                    className="input-cozy text-sm py-2 w-full mt-1"
                                >
                                    <option value="photo">{t('modePhoto')}</option>
                                    <option value="pixel">{t('modePixel')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-brown-600">{t('maxColors')}: {settings.maxColors}</label>
                                <input
                                    type="range"
                                    min="2"
                                    max="20"
                                    value={settings.maxColors}
                                    onChange={(e) => setSettings(prev => ({ ...prev, maxColors: Number(e.target.value) }))}
                                    className="w-full accent-rose-300"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleConvert}
                            disabled={!image || isConverting}
                            className="w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed group relative"
                        >
                            {isConverting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {t('converting')}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                                    <span>{t('convert')}</span>
                                </>
                            )}
                            <div className="absolute top-[-10px] right-[-10px] flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-[11px] font-black border-2 border-white text-amber-700 shadow-lg">
                                <Coins className="w-3.5 h-3.5 text-amber-500" />
                                <span>-100</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Result Section */}
                <div className="space-y-4">
                    <div className="aspect-square rounded-3xl bg-white border border-tan-200 shadow-soft overflow-hidden flex flex-col">
                        {result && (
                            <div className="bg-cream-50 px-4 py-2 border-b border-tan-100 flex justify-between items-center text-xs text-brown-600">
                                <span className="font-medium">{t('resultInfo', { width: result.width, height: result.height })}</span>
                                <span>{t('stitchCount', { count: result.grid.flat().filter(c => c !== -1).length })}</span>
                            </div>
                        )}
                        {result ? (
                            <div className="w-full flex-1 p-4 flex items-center justify-center bg-white min-h-0">
                                <canvas
                                    ref={canvasRef}
                                    className="max-w-full max-h-full rounded-lg shadow-sm"
                                    style={{ imageRendering: 'pixelated' }}
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <p className="text-brown-600/50">Chart preview will appear here</p>
                            </div>
                        )}
                    </div>

                    {result && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Palette */}
                            <div className="p-4 rounded-2xl bg-white border border-tan-200 shadow-soft">
                                <p className="text-sm text-brown-600 mb-2 font-medium">{t('paletteInfo', { count: result.palette.length })}</p>
                                <div className="flex gap-2 flex-wrap">
                                    {result.palette.map((color, i) => (
                                        <div
                                            key={i}
                                            className="w-8 h-8 rounded-xl border border-tan-200 shadow-soft hover:scale-110 transition-transform cursor-help"
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Export Options */}
                            <div className="p-4 rounded-2xl bg-white border border-tan-200 shadow-soft space-y-4">
                                <p className="text-sm text-brown-600 font-medium">{t('exportOptions')}</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs text-brown-500">{t('format')}</label>
                                        <select
                                            value={exportFormat}
                                            onChange={(e) => setExportFormat(e.target.value as any)}
                                            className="input-cozy text-sm py-2"
                                        >
                                            <option value="png">{t('png')}</option>
                                            <option value="jpg">{t('jpg')}</option>
                                            <option value="pdf">{t('pdf')}</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-2 justify-end">
                                        <label className="flex items-center gap-2 cursor-pointer text-sm text-brown-700">
                                            <input
                                                type="checkbox"
                                                className="accent-rose-300"
                                                checked={showGridInExport}
                                                onChange={(e) => setShowGridInExport(e.target.checked)}
                                            />
                                            {t('showGrid')}
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-sm text-brown-700">
                                            <input
                                                type="checkbox"
                                                className="accent-rose-300"
                                                checked={showNumbersInExport}
                                                onChange={(e) => setShowNumbersInExport(e.target.checked)}
                                            />
                                            {t('showNumbers')}
                                        </label>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 pt-2">
                                    <button
                                        onClick={handleDownload}
                                        className="btn-secondary w-full flex items-center justify-center gap-2 py-3 shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
                                    >
                                        <Download className="w-5 h-5" />
                                        <span>{t('download')}</span>
                                        <div className="flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full bg-amber-50 text-[10px] font-bold border border-amber-200 text-amber-600 shadow-sm transition-transform group-hover:scale-105">
                                            <Coins className="w-3 h-3 text-amber-500" />
                                            <span>-10</span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={handleEditInEditor}
                                        className="btn-primary w-full flex items-center justify-center gap-2 py-3 whitespace-nowrap shadow-rose-sm hover:translate-y-[-1px] transition-all active:scale-[0.98] group"
                                    >
                                        <PenTool className="w-5 h-5" />
                                        <span>{t('editInEditor')}</span>
                                        <div className="flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full bg-amber-50 text-[10px] font-bold border border-amber-200 text-amber-600 shadow-sm transition-transform group-hover:scale-105">
                                            <Coins className="w-3 h-3 text-amber-500" />
                                            <span>-10</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ChatToPatternTab({ locale, credits }: { locale: string, credits: number }) {
    const t = useTranslations('ai.chatToPattern');
    const router = useRouter();
    const { saveAIImport } = useEditorPersistence();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const examples = [
        t('examples.ex1'),
        t('examples.ex2'),
        t('examples.ex3'),
    ];

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        if (credits < 1) {
            alert(locale === 'ko' ? '크레딧이 부족합니다.' : 'Insufficient credits.');
            return;
        }

        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input, locale }),
            });

            if (response.ok) {
                const data = await response.json();

                const aiResponse: ChatMessage = {
                    role: 'assistant',
                    content: data.instructions || data.message,
                    gridData: data.grid ? {
                        grid: data.grid,
                        palette: data.palette || ['#FFFFFF', '#4A3F35'],
                        width: data.width || 20,
                        height: data.height || 10,
                    } : undefined,
                };
                setMessages(prev => [...prev, aiResponse]);
            } else if (response.status === 402) {
                alert(locale === 'ko' ? '크레딧이 부족합니다.' : 'Insufficient credits.');
            } else {
                const mockResponse: ChatMessage = {
                    role: 'assistant',
                    content: `I'd love to help you create a pattern for "${input}"!

Here's a basic suggestion:

**재료 (Materials):**
- 실: 워스티드 중량 (약 200g)
- 바늘: 5mm (US 8)
- 게이지: 10cm당 18코 x 24단

**도안 요약:**
1. 코잡기 80코
2. 고무뜨기 (겉2, 안2) 5cm
3. 본문 패턴 시작...

⚠️ AI 생성 도안입니다. 실제 제작 전 검증이 필요합니다.`,
                    gridData: {
                        grid: Array(10).fill(null).map(() =>
                            Array(20).fill(null).map(() => Math.floor(Math.random() * 4))
                        ),
                        palette: ['#FFFFFF', '#4A3F35', '#E8B4B8', '#A7C4A0'],
                        width: 20,
                        height: 10,
                    },
                };
                setMessages(prev => [...prev, mockResponse]);
            }
        } catch (error) {
            console.error('Chat error:', error);
        }

        setIsLoading(false);
    };

    const handleEditInEditor = (gridData: ConversionResult) => {
        saveAIImport(gridData);
        router.push(`/${locale}/editor?import=ai`);
    };

    const handleExample = (example: string) => {
        setInput(example);
    };

    return (
        <div className="space-y-6">
            <p className="text-brown-600 text-center">{t('description')}</p>

            {/* Chat Container */}
            <div className="rounded-3xl bg-white border border-tan-200 shadow-soft overflow-hidden">
                {/* Messages */}
                <div className="h-[500px] overflow-y-auto p-4 space-y-4 bg-cream-50">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <MessageSquare className="w-12 h-12 text-tan-200 mb-4" />
                            <p className="text-brown-600 mb-6">{t('examples.title')}</p>
                            <div className="flex flex-wrap justify-center gap-2">
                                {examples.map((example, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleExample(example)}
                                        className="px-4 py-2 rounded-full bg-white border border-tan-200 text-sm text-brown-600 hover:border-rose-300 hover:bg-cream-100 transition-all shadow-soft"
                                    >
                                        {example}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, i) => (
                            <div key={i} className="space-y-2">
                                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                            ? 'bg-gradient-to-r from-rose-300 to-peach-200 text-white'
                                            : 'bg-white border border-tan-200 text-brown-700 shadow-soft'
                                            }`}
                                    >
                                        <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                                    </div>
                                </div>

                                {msg.gridData && (
                                    <div className="flex justify-start">
                                        <div className="max-w-[80%] p-4 rounded-2xl bg-white border border-tan-200 shadow-soft space-y-3">
                                            <p className="text-sm text-brown-600 font-medium">{t('preview')}:</p>
                                            <div
                                                className="grid gap-px bg-tan-200 rounded-lg overflow-hidden"
                                                style={{
                                                    gridTemplateColumns: `repeat(${msg.gridData.width}, 1fr)`,
                                                    maxWidth: '300px'
                                                }}
                                            >
                                                {msg.gridData.grid.flat().map((colorIndex, j) => (
                                                    <div
                                                        key={j}
                                                        className="aspect-square"
                                                        style={{ backgroundColor: msg.gridData!.palette[colorIndex] || '#FFFFFF' }}
                                                    />
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => handleEditInEditor(msg.gridData!)}
                                                className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-cream-50 border border-tan-200 text-sm font-medium text-brown-700 hover:bg-white hover:border-rose-300 transition-all shadow-sm active:scale-[0.98]"
                                            >
                                                <PenTool className="w-4 h-4" />
                                                <span>{t('editInEditor')}</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-tan-200 rounded-2xl px-4 py-3 shadow-soft">
                                <Loader2 className="w-5 h-5 animate-spin text-rose-300" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="border-t border-tan-200 p-4 bg-white">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={t('placeholder')}
                            className="input-cozy flex-1"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="btn-primary px-5 py-2.5 disabled:opacity-50 flex items-center gap-2 shadow-rose-sm hover:translate-y-[-1px] transition-all active:scale-[0.95] group"
                        >
                            <Send className="w-5 h-5" />
                            <div className="h-4 w-px bg-white/30 mx-0.5" />
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-[10px] font-bold border border-amber-200 text-amber-600 shadow-sm transition-transform group-hover:scale-105">
                                <Coins className="w-3 h-3 text-amber-500" />
                                <span>-1</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
