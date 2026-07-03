'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { User } from '@supabase/supabase-js';
import {
    Upload, Image as ImageIcon, MessageSquare, Sparkles,
    AlertTriangle, Send, Loader2, Download, Settings2, PenTool, Coins, Lock, ArrowLeft
} from 'lucide-react';
import { useEditorPersistence } from '@/hooks/useEditorPersistence';
import { jsPDF } from 'jspdf';
import { quantizeImage } from '@/utils/imageProcessing';
import { createClient } from '@/utils/supabase/client';
import { deductCredits } from '@/app/actions/credits';
import FabricToPatternTab from './FabricToPatternTab';

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
    const [mode, setMode] = useState<'select' | 'chart' | 'written'>('select');
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

    const handleBack = () => setMode('select');

    const getHeaderInfo = () => {
        if (mode === 'chart') {
            return {
                title: t('imageToChart.title'),
                subtitle: t('imageToChart.description')
            };
        }
        if (mode === 'written') {
            return {
                title: t('fabricToPattern.title'),
                subtitle: t('fabricToPattern.description')
            };
        }
        return {
            title: t('title'),
            subtitle: t('fabricToPattern.selectBranchDesc')
        };
    };

    const header = getHeaderInfo();
    const isKo = locale === 'ko';

    return (
        <div className="min-h-screen bg-cream-50 pb-20 relative">
            {/* Header */}
            <div className="bg-gradient-to-b from-cream-100 to-cream-50 py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-sage-300 shadow-soft mb-6">
                        <Sparkles className="w-4 h-4 text-sage-400" />
                        <span className="text-sm text-brown-600 font-medium">AI-Powered</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-brown-700 mb-6">{header.title}</h1>
                    <p className="text-brown-600 text-lg mb-4">{header.subtitle}</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {mode === 'select' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        {/* Credits Balance Display */}
                        <div className="flex justify-end">
                            <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full border border-tan-200 shadow-soft text-sm text-brown-700 font-bold">
                                <Coins className="w-4.5 h-4.5 text-amber-500" />
                                <span>{credits} {isKo ? '크레딧 보유 중' : 'Credits Available'}</span>
                            </div>
                        </div>

                        {/* Side-by-side Selection Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Card 1: Grid Colorwork Chart */}
                            <div 
                                onClick={() => setMode('chart')}
                                className="group card-cozy bg-white border border-tan-200 rounded-3xl p-8 hover:shadow-soft-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer text-left"
                            >
                                <div>
                                    <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-6 shadow-sm group-hover:scale-105 transition-transform">
                                        <ImageIcon className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-xl font-bold text-brown-800 mb-3 group-hover:text-rose-500 transition-colors">
                                        {t('fabricToPattern.cardChartTitle')}
                                    </h3>
                                    <p className="text-sm text-brown-500 leading-relaxed">
                                        {t('fabricToPattern.cardChartDesc')}
                                    </p>
                                </div>
                                <div className="inline-flex items-center gap-1.5 text-rose-500 font-bold hover:text-rose-600 transition-colors text-sm mt-8">
                                    <span>{isKo ? '바로 가기' : 'Get Started'}</span>
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </div>
                            </div>

                            {/* Card 2: Fabric Written Pattern */}
                            <div 
                                onClick={() => setMode('written')}
                                className="group card-cozy bg-white border border-tan-200 rounded-3xl p-8 hover:shadow-soft-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer text-left"
                            >
                                <div>
                                    <div className="w-14 h-14 rounded-2xl bg-sage-50 border border-sage-100 flex items-center justify-center text-sage-600 mb-6 shadow-sm group-hover:scale-105 transition-transform">
                                        <PenTool className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-xl font-bold text-brown-800 mb-3 group-hover:text-sage-600 transition-colors">
                                        {t('fabricToPattern.cardWrittenTitle')}
                                    </h3>
                                    <p className="text-sm text-brown-500 leading-relaxed">
                                        {t('fabricToPattern.cardWrittenDesc')}
                                    </p>
                                </div>
                                <div className="inline-flex items-center gap-1.5 text-sage-600 font-bold hover:text-sage-700 transition-colors text-sm mt-8">
                                    <span>{isKo ? '바로 가기' : 'Get Started'}</span>
                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {mode === 'chart' && (
                    <div className="space-y-6">
                        <button
                            onClick={handleBack}
                            className="inline-flex items-center gap-2 text-brown-600 hover:text-rose-500 font-bold transition-colors cursor-pointer mb-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>{t('fabricToPattern.backToSelect')}</span>
                        </button>
                        <ImageToChartTab locale={locale} credits={credits} user={user} />
                    </div>
                )}

                {mode === 'written' && (
                    <FabricToPatternTab 
                        locale={locale} 
                        credits={credits} 
                        user={user} 
                        onBack={handleBack} 
                    />
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
    const [removeBackground, setRemoveBackground] = useState(false);
    const [settings, setSettings] = useState({
        targetWidth: 50,
        targetHeight: 50,
        maxColors: 8,
    });

    const processFile = (file: File) => {
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
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            processFile(file);
        } else {
            console.warn('Dropped item is not an image file');
        }
    };

    const handleConvert = async () => {
        if (!image) return;


        setIsConverting(true);

        try {
            let sourceImage = image;

            if (removeBackground) {
                try {
                    // Create an Image to resize before passing to imgly (prevents WASM OOM)
                    const tempImg = new Image();
                    tempImg.src = image;
                    await new Promise<void>((resolve, reject) => {
                        tempImg.onload = () => resolve();
                        tempImg.onerror = reject;
                    });
                    
                    const MAX_SIZE = 1024;
                    let rw = tempImg.width;
                    let rh = tempImg.height;
                    if (rw > MAX_SIZE || rh > MAX_SIZE) {
                        const ratio = Math.min(MAX_SIZE / rw, MAX_SIZE / rh);
                        rw = Math.round(rw * ratio);
                        rh = Math.round(rh * ratio);
                    }
                    
                    const rc = document.createElement('canvas');
                    rc.width = rw;
                    rc.height = rh;
                    const rctx = rc.getContext('2d');
                    if (rctx) {
                        rctx.drawImage(tempImg, 0, 0, rw, rh);
                        const blobInput = await new Promise<Blob>((res) => rc.toBlob((b) => res(b!), 'image/png'));
                        
                        const { removeBackground: imglyRemoveBackground } = await import('@imgly/background-removal');
                        const blob = await imglyRemoveBackground(blobInput);
                        sourceImage = URL.createObjectURL(blob);
                    }
                } catch (e: any) {
                    console.error('Background removal failed', e);
                    alert("AI 배경 제거 중 오류가 발생했습니다: " + (e?.message || '알 수 없는 오류'));
                }
            }

            const img = new Image();
            if (sourceImage.startsWith('http') || sourceImage.startsWith('blob:')) {
                img.crossOrigin = 'anonymous';
            }

            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
                img.src = sourceImage;
            });

            // Auto-crop to bounding box of non-transparent pixels if background was removed
            let cropX = 0, cropY = 0, cropW = img.width, cropH = img.height;
            if (removeBackground) {
                const trimCanvas = document.createElement('canvas');
                trimCanvas.width = img.width;
                trimCanvas.height = img.height;
                const trimCtx = trimCanvas.getContext('2d', { willReadFrequently: true });
                if (trimCtx) {
                    trimCtx.drawImage(img, 0, 0);
                    const trimData = trimCtx.getImageData(0, 0, img.width, img.height).data;
                    let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
                    for (let y = 0; y < img.height; y++) {
                        for (let x = 0; x < img.width; x++) {
                            const alpha = trimData[(y * img.width + x) * 4 + 3];
                            if (alpha > 0) {
                                if (x < minX) minX = x;
                                if (x > maxX) maxX = x;
                                if (y < minY) minY = y;
                                if (y > maxY) maxY = y;
                            }
                        }
                    }
                    if (maxX >= minX && maxY >= minY) {
                        cropX = minX;
                        cropY = minY;
                        cropW = maxX - minX + 1;
                        cropH = maxY - minY + 1;
                    }
                }
            }

            // Calculate dimensions
            let targetWidth = settings.targetWidth;
            let targetHeight = settings.targetHeight;

            if (maintainAspectRatio) {
                const aspectRatio = cropW / cropH;
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

            // Clear offscreen canvas first to preserve image transparency
            offscreenCtx.clearRect(0, 0, img.width, img.height);
            offscreenCtx.drawImage(img, 0, 0);



            // Draw the image onto the target resizing canvas
            // Disable smoothing for sharp pixelation (prevents color bleeding artifacts)
            // Use 'photo' (smooth) for complex images to avoid aliasing artifacts
            // Use 'pixel' (sharp) for pixel art to preserve edges
            tempCtx.imageSmoothingEnabled = conversionMode === 'photo';

            // Boost contrast and saturation slightly to make pixel art colors pop and reduce muddy interpolation
            if (conversionMode === 'photo') {
                tempCtx.filter = 'contrast(1.15) saturate(1.2)';
            } else {
                tempCtx.filter = 'contrast(1.05) saturate(1.1)';
            }

            // Draw with cropping applied
            tempCtx.drawImage(offscreenCanvas, cropX, cropY, cropW, cropH, 0, 0, targetWidth, targetHeight);
            
            // Reset filter
            tempCtx.filter = 'none';

            const imageData = tempCtx.getImageData(0, 0, targetWidth, targetHeight);
            const pixels = imageData.data;

            // Use K-Means quantization for better color selection
            const { palette, grid } = quantizeImage(
                pixels,
                targetWidth,
                targetHeight,
                settings.maxColors,
                false // Already processed at high resolution!
            );

            // Cleanup blob URL if we created one
            if (removeBackground && sourceImage.startsWith('blob:')) {
                URL.revokeObjectURL(sourceImage);
            }

            // Preview conversion is FREE - credits are only deducted on export/editor import

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
                if (colorIdx === -1) {
                    // Draw subtle checkerboard pattern for transparent cells
                    const isEven = (Math.floor(x / 2) + Math.floor(y / 2)) % 2 === 0;
                    ctx.fillStyle = isEven ? '#F8FAFC' : '#E2E8F0';
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize + 0.5, cellSize + 0.5);
                } else {
                    ctx.fillStyle = result.palette[colorIdx] || '#FFFFFF';
                    // Solid pixels without gaps for cleaner preview
                    // Add slight overlap (0.5) to prevent sub-pixel rendering gaps
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize + 0.5, cellSize + 0.5);
                }
            }
        }
    }, [result]);

    const handleEditInEditor = async () => {
        if (!result) return;
        
        const isDemo = typeof window !== 'undefined' && (window as any).isDemoActive;
        if (!isDemo && credits < 50) {
            alert(locale === 'ko' ? '크레딧이 부족합니다.' : 'Insufficient credits.');
            return;
        }

        try {
            if (!isDemo) {
                await deductCredits(user?.id!, 50, 'AI Editor Import');
            }
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
        
        const isDemo = typeof window !== 'undefined' && (window as any).isDemoActive;
        if (!isDemo && credits < 50) {
            alert(locale === 'ko' ? '크레딧이 부족합니다.' : 'Insufficient credits.');
            return;
        }

        const canvas = generateExportCanvas();
        if (!canvas) return;

        try {
            if (!isDemo) {
                await deductCredits(user?.id!, 50, `AI Export (${exportFormat.toUpperCase()})`);
            }
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

    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).startConverterDemo = () => {
                (window as any).isDemoActive = true;
                localStorage.setItem('hasSeenEditorTour', 'true');
                
                // Cleanup old overlays/cursors
                const oldCursor = document.getElementById('demo-fake-cursor');
                if (oldCursor) oldCursor.remove();
                const oldSubtitle = document.getElementById('demo-subtitle');
                if (oldSubtitle) oldSubtitle.remove();

                // Create subtitle
                const subtitle = document.createElement('div');
                subtitle.id = 'demo-subtitle';
                subtitle.style.position = 'fixed';
                subtitle.style.bottom = '120px';
                subtitle.style.left = '50%';
                subtitle.style.transform = 'translateX(-50%)';
                subtitle.style.backgroundColor = 'transparent';
                subtitle.style.color = '#4A3525';
                subtitle.style.textShadow = '0 2px 10px rgba(255,255,255,0.8)';
                subtitle.style.padding = '16px 32px';
                subtitle.style.borderRadius = '32px';
                subtitle.style.fontSize = '32px';
                subtitle.style.fontWeight = '800';
                subtitle.style.zIndex = '99999';
                subtitle.style.fontFamily = 'var(--font-nunito), sans-serif';
                subtitle.innerText = "원하는 이미지를 업로드하세요";
                document.body.appendChild(subtitle);

                // Create fake cursor
                const cursor = document.createElement('div');
                cursor.id = 'demo-fake-cursor';
                cursor.style.position = 'fixed';
                cursor.style.width = '36px';
                cursor.style.height = '36px';
                cursor.style.zIndex = '100000';
                cursor.style.pointerEvents = 'none';
                cursor.innerHTML = `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.04c.45 0 .67-.54.35-.85L5.85 3.21a.5.5 0 0 0-.35-.15.5.5 0 0 0-.5.5z" fill="white" stroke="black" stroke-width="1.5" stroke-linejoin="round"/>
</svg>`;
                document.body.appendChild(cursor);

                // Start position
                const startX = window.innerWidth / 2;
                const startY = window.innerHeight / 2;
                cursor.style.left = startX + 'px';
                cursor.style.top = startY + 'px';

                const moveCursor = (x: number, y: number, duration: number = 150) => {
                    return new Promise<void>(resolve => {
                        cursor.style.transition = `left ${duration}ms linear, top ${duration}ms linear`;
                        cursor.style.left = x + 'px';
                        cursor.style.top = y + 'px';
                        setTimeout(resolve, duration);
                    });
                };

                const clickCursor = () => {
                    return new Promise<void>(resolve => {
                        cursor.style.transform = 'scale(0.8)';
                        
                        // Ripple animation
                        const ripple = document.createElement('div');
                        ripple.style.position = 'fixed';
                        ripple.style.left = cursor.style.left;
                        ripple.style.top = cursor.style.top;
                        ripple.style.width = '40px';
                        ripple.style.height = '40px';
                        ripple.style.marginLeft = '-20px';
                        ripple.style.marginTop = '-20px';
                        ripple.style.borderRadius = '50%';
                        ripple.style.backgroundColor = 'rgba(139, 90, 43, 0.3)';
                        ripple.style.border = '2px solid rgba(139, 90, 43, 0.7)';
                        ripple.style.zIndex = '100001';
                        ripple.style.pointerEvents = 'none';
                        ripple.style.transition = 'transform 250ms cubic-bezier(0.1, 0.8, 0.3, 1), opacity 250ms ease-out';
                        ripple.style.transform = 'scale(0.1)';
                        document.body.appendChild(ripple);
                        
                        ripple.offsetHeight;
                        
                        ripple.style.transform = 'scale(2)';
                        ripple.style.opacity = '0';
                        
                        setTimeout(() => ripple.remove(), 250);

                        setTimeout(() => {
                            cursor.style.transform = 'scale(1)';
                            setTimeout(resolve, 100);
                        }, 100);
                    });
                };

                // Helper to draw the cute bear face dynamically
                const drawSampleImage = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 120;
                    canvas.height = 120;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return '';

                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, 120, 120);

                    // Ears
                    ctx.fillStyle = '#8B5A2B';
                    ctx.beginPath();
                    ctx.arc(30, 40, 18, 0, Math.PI * 2);
                    ctx.arc(90, 40, 18, 0, Math.PI * 2);
                    ctx.fill();

                    // Inner Ears
                    ctx.fillStyle = '#F3A3B0';
                    ctx.beginPath();
                    ctx.arc(30, 40, 10, 0, Math.PI * 2);
                    ctx.arc(90, 40, 10, 0, Math.PI * 2);
                    ctx.fill();

                    // Head
                    ctx.fillStyle = '#8B5A2B';
                    ctx.beginPath();
                    ctx.arc(60, 70, 36, 0, Math.PI * 2);
                    ctx.fill();

                    // Muzzle
                    ctx.fillStyle = '#FDF6EC';
                    ctx.beginPath();
                    ctx.arc(60, 80, 16, 0, Math.PI * 2);
                    ctx.fill();

                    // Eyes
                    ctx.fillStyle = '#4A4A4A';
                    ctx.beginPath();
                    ctx.arc(45, 65, 4, 0, Math.PI * 2);
                    ctx.arc(75, 65, 4, 0, Math.PI * 2);
                    ctx.fill();

                    // Nose
                    ctx.beginPath();
                    ctx.arc(60, 76, 5, 0, Math.PI * 2);
                    ctx.fill();

                    return canvas.toDataURL();
                };

                // Run sequence
                setTimeout(async () => {
                    // 1. Move to Upload Dropzone (0.5s to 2.5s)
                    const dropzone = document.querySelector('div[class*="aspect-square"][class*="border-dashed"]') as HTMLElement;
                    if (dropzone) {
                        const dzRect = dropzone.getBoundingClientRect();
                        await moveCursor(dzRect.left + dzRect.width / 2, dzRect.top + dzRect.height / 2, 800);
                        await clickCursor();
                        
                        // Inject sample bear image
                        const dataUrl = drawSampleImage();
                        setImage(dataUrl);
                        setResult(null);

                        // Extract image and set aspect ratio
                        const img = new Image();
                        img.onload = () => {
                            const ratio = img.width / img.height;
                            setImageAspectRatio(ratio);
                            setSettings(prev => ({
                                ...prev,
                                targetHeight: Math.round(prev.targetWidth / ratio)
                            }));
                        };
                        img.src = dataUrl;
                    }

                    await new Promise(r => setTimeout(r, 1000));

                    // 2. Adjust targetWidth (2.5s to 4.5s)
                    subtitle.innerText = "격자 크기와 실의 색상 수를 자유롭게 조절";
                    
                    const inputs = Array.from(document.querySelectorAll('input[type="range"]'));
                    const widthSlider = inputs[0] as HTMLInputElement;
                    const colorSlider = inputs[2] as HTMLInputElement;

                    if (widthSlider) {
                        const wsRect = widthSlider.getBoundingClientRect();
                        // Move cursor to start of slider
                        await moveCursor(wsRect.left + 20, wsRect.top + wsRect.height / 2, 600);
                        
                        // Drag simulation: move to 45 (approx 35% of the way)
                        const dragWidth = Math.floor(wsRect.width * 0.35);
                        await moveCursor(wsRect.left + dragWidth, wsRect.top + wsRect.height / 2, 800);
                        
                        setSettings(prev => {
                            const ratio = imageAspectRatio || 1;
                            return {
                                ...prev,
                                targetWidth: 45,
                                targetHeight: Math.round(45 / ratio)
                            };
                        });
                    }

                    await new Promise(r => setTimeout(r, 500));

                    // 3. Adjust maxColors (4.5s to 6.5s)
                    if (colorSlider) {
                        const csRect = colorSlider.getBoundingClientRect();
                        await moveCursor(csRect.left + 20, csRect.top + csRect.height / 2, 600);
                        
                        // Drag simulation: move to 6 colors (approx 25% of the way)
                        const dragWidth = Math.floor(csRect.width * 0.25);
                        await moveCursor(csRect.left + dragWidth, csRect.top + csRect.height / 2, 800);
                        
                        setSettings(prev => ({
                            ...prev,
                            maxColors: 6
                        }));
                    }

                    await new Promise(r => setTimeout(r, 800));

                    // 4. Click Convert Button (6.5s to 9.0s)
                    subtitle.innerText = "클릭 한 번으로 뜨개 도안 차트 자동 변환 완료!";
                    
                    const convertBtn = Array.from(document.querySelectorAll('button')).find(b => 
                        b.textContent?.includes('변환') || b.textContent?.includes('Convert')
                    ) as HTMLElement;

                    if (convertBtn) {
                        const cbRect = convertBtn.getBoundingClientRect();
                        await moveCursor(cbRect.left + cbRect.width / 2, cbRect.top + cbRect.height / 2, 500);
                        await clickCursor();
                        
                        // Programmatic convert call
                        setIsConverting(true);
                        setTimeout(() => {
                            // Create grid mapping representing a bear
                            const targetWidth = 45;
                            const targetHeight = 45;
                            
                            // Sample palette of 5 colors
                            const palette = ['#FFFFFF', '#8B5A2B', '#F3A3B0', '#FDF6EC', '#4A4A4A'];
                            
                            // Create a simple bear head pattern inside the grid
                            const grid = Array(targetHeight).fill(null).map(() => Array(targetWidth).fill(0));
                            
                            // Drawing shapes mathematically inside the grid
                            const centerC = Math.floor(targetWidth / 2);
                            const centerR = Math.floor(targetHeight / 2) + 2;
                            const headRadius = 13;
                            
                            // Fill bear head
                            for (let r = 0; r < targetHeight; r++) {
                                for (let c = 0; c < targetWidth; c++) {
                                    // Distance from head center
                                    const distHead = Math.sqrt((r - centerR) ** 2 + (c - centerC) ** 2);
                                    if (distHead < headRadius) {
                                        grid[r][c] = 1; // Brown
                                    }
                                    
                                    // Left Ear
                                    const distLeftEar = Math.sqrt((r - (centerR - 11)) ** 2 + (c - (centerC - 10)) ** 2);
                                    if (distLeftEar < 6) {
                                        grid[r][c] = distLeftEar < 3 ? 2 : 1; // Pink inner, Brown outer
                                    }
                                    
                                    // Right Ear
                                    const distRightEar = Math.sqrt((r - (centerR - 11)) ** 2 + (c - (centerC + 10)) ** 2);
                                    if (distRightEar < 6) {
                                        grid[r][c] = distRightEar < 3 ? 2 : 1; // Pink inner, Brown outer
                                    }
                                    
                                    // Muzzle
                                    const distMuzzle = Math.sqrt(((r - (centerR + 3)) * 1.3) ** 2 + (c - centerC) ** 2);
                                    if (distMuzzle < 5.5) {
                                        grid[r][c] = 3; // Cream
                                    }
                                    
                                    // Left Eye
                                    const distLeftEye = Math.sqrt((r - (centerR - 2)) ** 2 + (c - (centerC - 5)) ** 2);
                                    if (distLeftEye < 1.2) {
                                        grid[r][c] = 4; // Gray
                                    }
                                    
                                    // Right Eye
                                    const distRightEye = Math.sqrt((r - (centerR - 2)) ** 2 + (c - (centerC + 5)) ** 2);
                                    if (distRightEye < 1.2) {
                                        grid[r][c] = 4; // Gray
                                    }
                                    
                                    // Nose
                                    const distNose = Math.sqrt(((r - centerR) * 1.5) ** 2 + (c - centerC) ** 2);
                                    if (distNose < 1.6) {
                                        grid[r][c] = 4; // Gray
                                    }
                                }
                            }
                            
                            setResult({
                                width: targetWidth,
                                height: targetHeight,
                                palette,
                                grid
                            });
                            setIsConverting(false);
                        }, 1200);
                    }

                    // Wait for conversion preview to show (loader: 1.2s + cushion: 1.3s = 2.5s)
                    await new Promise(r => setTimeout(r, 2500));

                    // 5. Click Edit in Editor Button (9.0s to 12.0s)
                    subtitle.innerText = "강력한 도안 에디터에서 편집을 마치고 고화질 PNG로 다운로드하세요.";
                    
                    const editBtn = Array.from(document.querySelectorAll('button')).find(b => 
                        b.textContent?.includes('에디터') || b.textContent?.includes('Editor')
                    ) as HTMLElement;

                    if (editBtn) {
                        const ebRect = editBtn.getBoundingClientRect();
                        await moveCursor(ebRect.left + ebRect.width / 2, ebRect.top + ebRect.height / 2, 600);
                        await clickCursor();
                        
                        // Store result and trigger routing
                        saveAIImport({
                            width: 45,
                            height: 45,
                            palette: ['#FFFFFF', '#8B5A2B', '#F3A3B0', '#FDF6EC', '#4A4A4A'],
                            grid: result?.grid || Array(45).fill(null).map(() => Array(45).fill(0)) // fallback
                        });
                        
                        router.push(`/${locale}/editor?import=ai`);
                        
                        // Let page transition, then start Editor saving sequence
                        setTimeout(() => {
                            // Check if editor demo is ready
                            const checkAndStartEditorSave = () => {
                                const saveBtn = Array.from(document.querySelectorAll('button')).find(b => 
                                    b.innerText.includes('저장') || b.innerText.includes('Save')
                                ) as HTMLElement;
                                
                                if (saveBtn) {
                                    // Custom visual sequence in the editor (13s to 24s)
                                    (async () => {
                                        // Update subtitle in editor
                                        const editSubtitle = document.getElementById('demo-subtitle');
                                        if (editSubtitle) editSubtitle.innerText = "에디터에서 나만의 맞춤형 뜨개 도안을 완성해 보세요!";
                                        
                                        // Move cursor to Save
                                        const sbRect = saveBtn.getBoundingClientRect();
                                        await moveCursor(sbRect.left + sbRect.width / 2, sbRect.top + sbRect.height / 2, 800);
                                        await clickCursor();
                                        saveBtn.click();
                                        
                                        // Move to Export
                                        await new Promise(r => setTimeout(r, 1200));
                                        const exportBtn = (document.getElementById('tour-export') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('내보내기') || b.innerText.includes('Export'))) as HTMLElement;
                                        if (exportBtn) {
                                            const ebRect2 = exportBtn.getBoundingClientRect();
                                            await moveCursor(ebRect2.left + ebRect2.width / 2, ebRect2.top + ebRect2.height / 2, 600);
                                            await clickCursor();
                                            exportBtn.click();
                                        }
                                        
                                        // Move to PNG
                                        await new Promise(r => setTimeout(r, 1200));
                                        const pngBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('PNG')) as HTMLElement;
                                        if (pngBtn) {
                                            const pbRect = pngBtn.getBoundingClientRect();
                                            await moveCursor(pbRect.left + pbRect.width / 2, pbRect.top + pbRect.height / 2, 600);
                                            await clickCursor();
                                            pngBtn.click();
                                        }

                                        // Keep showing for 3 seconds
                                        await new Promise(r => setTimeout(r, 3000));
                                        
                                        // Clean up editor demo
                                        const editorCursor = document.getElementById('demo-fake-cursor');
                                        if (editorCursor) editorCursor.remove();
                                        if (editSubtitle) editSubtitle.remove();
                                        (window as any).isDemoActive = false;
                                    })();
                                } else {
                                    // Retry in 200ms
                                    setTimeout(checkAndStartEditorSave, 200);
                                }
                            };
                            checkAndStartEditorSave();
                        }, 1000);
                    }
                }, 500);
            };
        }
    }, [setImage, setResult, setSettings, setImageAspectRatio, imageAspectRatio, result, saveAIImport, router, locale]);

    return (
        <div className="space-y-6">

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Upload Section */}
                <div className="space-y-4">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
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
                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="removeBackground"
                                    checked={removeBackground}
                                    onChange={(e) => setRemoveBackground(e.target.checked)}
                                    className="accent-rose-300 w-4 h-4"
                                />
                                <label htmlFor="removeBackground" className="text-sm text-brown-600 cursor-pointer select-none">
                                    {t('removeBackground')}
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
                            className="w-full btn-primary disabled:bg-none disabled:bg-stone-250 disabled:text-stone-400 disabled:shadow-none disabled:opacity-100 flex items-center justify-center gap-2 py-3 disabled:cursor-not-allowed group relative"
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
                                            <span>-50</span>
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
                                            <span>-50</span>
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
