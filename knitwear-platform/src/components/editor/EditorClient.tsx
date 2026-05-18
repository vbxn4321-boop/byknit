'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import {
    Paintbrush, Eraser, Pipette, Download, Save,
    Plus, Minus, Grid3X3, RotateCcw, ZoomIn, ZoomOut,
    FileDown, Trash2
} from 'lucide-react';
import { useEditorPersistence } from '@/hooks/useEditorPersistence';
import { generatePatternPDF, generateProductDescription } from '@/utils/pdfGenerator';

interface GridCell {
    color: string;
    symbol: string;
}

const KNITTING_SYMBOLS: Record<string, { symbol: string; name: string }> = {
    '#FFFFFF': { symbol: '□', name: 'knit' },
    '#4A3F35': { symbol: '■', name: 'purl' },
    '#E8B4B8': { symbol: '○', name: 'yarnOver' },
    '#A7C4A0': { symbol: '/', name: 'k2tog' },
    '#F5D0C5': { symbol: '\\', name: 'ssk' },
    '#D4979C': { symbol: '⟨', name: 'cableLeft' },
    '#8FB085': { symbol: '⟩', name: 'cableRight' },
};

const CROCHET_SYMBOLS: Record<string, { symbol: string; name: string }> = {
    // Basic Stitches
    '#FFFFFF': { symbol: '○', name: 'chain' },           // 사슬뜨기 (ch)
    '#4A3F35': { symbol: '•', name: 'slipStitch' },      // 빠진코 (sl st)
    '#E8B4B8': { symbol: '×', name: 'singleCrochet' },   // 짧은뜨기 (sc)
    '#A7C4A0': { symbol: 'T', name: 'halfDouble' },      // 중장뜨기 (hdc)
    '#F5D0C5': { symbol: '⊥', name: 'doubleCrochet' },   // 장뜨기 (dc)
    '#D4979C': { symbol: '⧖', name: 'trebleCrochet' },   // 한길긴뜨기 (tr)
    '#8FB085': { symbol: '⧗', name: 'doubleTreble' },    // 두길긴뜨기 (dtr)
    // Decrease Stitches
    '#C4A7A7': { symbol: '∧', name: 'sc2tog' },          // 짧은뜨기 2코모아뜨기
    '#A7C4C4': { symbol: '∨', name: 'dc2tog' },          // 장뜨기 2코모아뜨기
    // Textured Stitches
    '#D4D479': { symbol: '⬮', name: 'puff' },            // 퍼프스티치
    '#C79CD4': { symbol: '◉', name: 'bobble' },          // 보블스티치
    '#9CD4C7': { symbol: '⊙', name: 'popcorn' },         // 팝콘스티치
    // Special Stitches
    '#D49C9C': { symbol: '⌒', name: 'picot' },           // 피코뜨기
    '#9C9CD4': { symbol: '⊃', name: 'shell' },           // 셸스티치
};

const KNITTING_PALETTE = Object.keys(KNITTING_SYMBOLS);
const CROCHET_PALETTE = Object.keys(CROCHET_SYMBOLS);

interface EditorClientProps {
    locale: string;
}

import { PublishPatternModal } from '@/components/marketplace/PublishPatternModal';

export function EditorClient({ locale }: EditorClientProps) {
    const t = useTranslations('Editor');
    const searchParams = useSearchParams();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { saveSession, loadSession, clearSession, loadAIImport, hasAIImport } = useEditorPersistence();

    // Editor Mode: 'knitting' (대바늘) or 'crochet' (코바늘)
    const [editorMode, setEditorMode] = useState<'knitting' | 'crochet'>('knitting');
    const activeSymbols = editorMode === 'knitting' ? KNITTING_SYMBOLS : CROCHET_SYMBOLS;
    const activePalette = editorMode === 'knitting' ? KNITTING_PALETTE : CROCHET_PALETTE;

    const [width, setWidth] = useState(32);
    const [height, setHeight] = useState(40);
    const [cellSize, setCellSize] = useState(16);
    const [grid, setGrid] = useState<GridCell[][]>([]);
    const [selectedColor, setSelectedColor] = useState('#FFFFFF');
    const [tool, setTool] = useState<'brush' | 'eraser' | 'picker'>('brush');
    const [isDrawing, setIsDrawing] = useState(false);
    const [showSymbols, setShowSymbols] = useState(true);
    const [showGrid, setShowGrid] = useState(true);
    const [patternName, setPatternName] = useState('Untitled Pattern');
    const [hasChanges, setHasChanges] = useState(false);
    const [showRestoreDialog, setShowRestoreDialog] = useState(false);
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [fileToPublish, setFileToPublish] = useState<File | null>(null);
    const [publishDescription, setPublishDescription] = useState('');

    // Initialize grid or restore session
    useEffect(() => {
        const importParam = searchParams.get('import');

        // Check for AI import first
        if (importParam === 'ai' && hasAIImport()) {
            const aiData = loadAIImport();
            if (aiData) {
                setWidth(aiData.width);
                setHeight(aiData.height);

                // Convert AI grid (number indices) to GridCell grid
                const newGrid = aiData.grid.map((row: number[]) =>
                    row.map((colorIndex: number) => {
                        const color = aiData.palette[colorIndex] || '#FFFFFF';
                        return {
                            color,
                            symbol: KNITTING_SYMBOLS[color.toUpperCase()]?.symbol || '●',
                        };
                    })
                );
                setGrid(newGrid);
                setPatternName('AI Generated Pattern');
                return;
            }
        }

        // Check for saved session
        const savedSession = loadSession();
        if (savedSession && savedSession.grid.length > 0) {
            setShowRestoreDialog(true);
            return;
        }

        // Initialize empty grid
        initializeEmptyGrid();
    }, [searchParams]);

    const initializeEmptyGrid = useCallback(() => {
        const newGrid = Array(height).fill(null).map(() =>
            Array(width).fill(null).map(() => ({
                color: '#FFFFFF',
                symbol: '□',
            }))
        );
        setGrid(newGrid);
        setHasChanges(false);
    }, [width, height]);

    const restoreSession = useCallback(() => {
        const savedSession = loadSession();
        if (savedSession) {
            setWidth(savedSession.width);
            setHeight(savedSession.height);
            setGrid(savedSession.grid);
            setPatternName(savedSession.name);
        }
        setShowRestoreDialog(false);
    }, [loadSession]);

    const discardSession = useCallback(() => {
        clearSession();
        initializeEmptyGrid();
        setShowRestoreDialog(false);
    }, [clearSession, initializeEmptyGrid]);

    // Re-initialize grid when dimensions change
    useEffect(() => {
        if (!showRestoreDialog && grid.length === 0) {
            initializeEmptyGrid();
        }
    }, [width, height, showRestoreDialog, grid.length, initializeEmptyGrid]);

    // Auto-save with debounce
    useEffect(() => {
        if (!hasChanges || grid.length === 0) return;

        const timer = setTimeout(() => {
            saveSession({
                name: patternName,
                width,
                height,
                grid,
                palette: activePalette,
            });
        }, 1000);

        return () => clearTimeout(timer);
    }, [grid, patternName, width, height, hasChanges, saveSession]);

    // Render canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || grid.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = width * cellSize;
        canvas.height = height * cellSize;

        // Clear canvas
        ctx.fillStyle = '#FDF8F3';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw cells
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cell = grid[y]?.[x];
                if (!cell) continue;

                // Fill cell background
                ctx.fillStyle = cell.color;
                ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

                // Draw symbol
                if (showSymbols && cell.symbol) {
                    ctx.fillStyle = cell.color === '#FFFFFF' || cell.color === '#F5D0C5' ? '#4A3F35' : '#FFFFFF';
                    ctx.font = `${cellSize * 0.7}px monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(
                        cell.symbol,
                        x * cellSize + cellSize / 2,
                        y * cellSize + cellSize / 2
                    );
                }

                // Draw grid lines
                if (showGrid) {
                    ctx.strokeStyle = '#E8DED5';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
            }
        }
    }, [grid, width, height, cellSize, showSymbols, showGrid]);

    // Paint cell
    const paintCell = useCallback((clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = Math.floor(((clientX - rect.left) * scaleX) / cellSize);
        const y = Math.floor(((clientY - rect.top) * scaleY) / cellSize);

        if (x >= 0 && x < width && y >= 0 && y < height) {
            if (tool === 'picker') {
                const cell = grid[y][x];
                setSelectedColor(cell.color);
                setTool('brush');
                return;
            }

            setGrid(prev => {
                const newGrid = prev.map(row => [...row]);
                const color = tool === 'eraser' ? '#FFFFFF' : selectedColor;
                const symbolInfo = activeSymbols[color] || { symbol: '●', name: 'custom' };
                newGrid[y][x] = {
                    color,
                    symbol: symbolInfo.symbol,
                };
                return newGrid;
            });
            setHasChanges(true);
        }
    }, [selectedColor, cellSize, width, height, tool, grid]);

    // Event handlers
    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setIsDrawing(true);
        const point = 'touches' in e ? e.touches[0] : e;
        paintCell(point.clientX, point.clientY);
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();
        const point = 'touches' in e ? e.touches[0] : e;
        paintCell(point.clientX, point.clientY);
    };

    const handleEnd = () => setIsDrawing(false);

    // Publish Pattern (Generate PDF and open Modal)
    const handlePublish = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        try {
            const imgData = canvas.toDataURL('image/png');

            // 1. Generate High-Quality PDF
            const pdfFile = await generatePatternPDF(
                imgData,
                {
                    title: patternName,
                    width,
                    height,
                    palette: activePalette,
                },
                activeSymbols
            );

            // 2. Generate Product Description
            const description = generateProductDescription(
                {
                    title: patternName,
                    width,
                    height,
                    palette: activePalette,
                },
                activeSymbols
            );

            setFileToPublish(pdfFile);
            setPublishDescription(description);
            setShowPublishModal(true);

        } catch (error) {
            console.error('Failed to generate PDF', error);
            alert('Failed to generate PDF for publishing.');
        }
    };

    // Export as PNG
    const exportPNG = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = `${patternName.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    // Reset grid
    const resetGrid = () => {
        if (confirm('Are you sure you want to clear the canvas?')) {
            initializeEmptyGrid();
            clearSession();
        }
    };

    // Resize grid
    const resizeGrid = (newWidth: number, newHeight: number) => {
        setWidth(newWidth);
        setHeight(newHeight);

        const newGrid = Array(newHeight).fill(null).map((_, y) =>
            Array(newWidth).fill(null).map((_, x) => {
                if (y < grid.length && x < grid[0]?.length) {
                    return grid[y][x];
                }
                return { color: '#FFFFFF', symbol: '□' };
            })
        );
        setGrid(newGrid);
        setHasChanges(true);
    };

    return (
        <div className="min-h-screen bg-cream-50 pb-20">
            {/* Restore Dialog */}
            {showRestoreDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-brown-700/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-md mx-4 shadow-soft-lg">
                        <h2 className="text-xl font-bold text-brown-700 mb-2">Restore Previous Work?</h2>
                        <p className="text-brown-600 mb-6">
                            We found an unsaved pattern from your last session. Would you like to restore it?
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={discardSession}
                                className="flex-1 btn-secondary"
                            >
                                Start Fresh
                            </button>
                            <button
                                onClick={restoreSession}
                                className="flex-1 btn-primary"
                            >
                                Restore
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white border-b border-tan-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <input
                                type="text"
                                value={patternName}
                                onChange={(e) => {
                                    setPatternName(e.target.value);
                                    setHasChanges(true);
                                }}
                                className="text-2xl font-bold text-brown-700 bg-transparent border-none focus:outline-none focus:ring-0"
                            />
                            <p className="text-sm text-brown-600/70">
                                {hasChanges ? 'Auto-saving...' : 'All changes saved'}
                            </p>
                        </div>

                        {/* Mode Toggle: Knitting / Crochet */}
                        <div className="inline-flex p-1 rounded-full bg-cream-100 border border-tan-200">
                            <button
                                onClick={() => setEditorMode('knitting')}
                                className={`px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${editorMode === 'knitting'
                                    ? 'bg-white text-brown-700 shadow-soft'
                                    : 'text-stone-500 hover:text-stone-700'
                                    }`}
                            >
                                🧶 {t('modeKnitting')}
                            </button>
                            <button
                                onClick={() => setEditorMode('crochet')}
                                className={`px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${editorMode === 'crochet'
                                    ? 'bg-white text-brown-700 shadow-soft'
                                    : 'text-stone-500 hover:text-stone-700'
                                    }`}
                            >
                                🪝 {t('modeCrochet')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid lg:grid-cols-[1fr_280px] gap-6">
                    {/* Canvas Area */}
                    <div className="space-y-4">
                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center gap-2 p-4 rounded-2xl bg-white border border-tan-200 shadow-soft">
                            {/* Tools */}
                            <div className="flex items-center gap-1 pr-4 border-r border-tan-200">
                                <button
                                    onClick={() => setTool('brush')}
                                    className={`p-2.5 rounded-xl transition-all ${tool === 'brush' ? 'bg-rose-300 text-white shadow-soft' : 'text-brown-600 hover:bg-cream-100'
                                        }`}
                                    title={t('tools.brush')}
                                >
                                    <Paintbrush className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setTool('eraser')}
                                    className={`p-2.5 rounded-xl transition-all ${tool === 'eraser' ? 'bg-rose-300 text-white shadow-soft' : 'text-brown-600 hover:bg-cream-100'
                                        }`}
                                    title={t('tools.eraser')}
                                >
                                    <Eraser className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setTool('picker')}
                                    className={`p-2.5 rounded-xl transition-all ${tool === 'picker' ? 'bg-rose-300 text-white shadow-soft' : 'text-brown-600 hover:bg-cream-100'
                                        }`}
                                    title={t('tools.picker')}
                                >
                                    <Pipette className="w-5 h-5" />
                                </button>
                            </div>

                            {/* View Options */}
                            <div className="flex items-center gap-1 px-4 border-r border-tan-200">
                                <button
                                    onClick={() => setShowGrid(!showGrid)}
                                    className={`p-2.5 rounded-xl transition-all ${showGrid ? 'bg-sage-300 text-white shadow-soft' : 'text-brown-600 hover:bg-cream-100'
                                        }`}
                                    title="Toggle Grid"
                                >
                                    <Grid3X3 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setCellSize(Math.min(32, cellSize + 4))}
                                    className="p-2.5 rounded-xl text-brown-600 hover:bg-cream-100 transition-all"
                                    title="Zoom In"
                                >
                                    <ZoomIn className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setCellSize(Math.max(8, cellSize - 4))}
                                    className="p-2.5 rounded-xl text-brown-600 hover:bg-cream-100 transition-all"
                                    title="Zoom Out"
                                >
                                    <ZoomOut className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={resetGrid}
                                    className="p-2.5 rounded-xl text-brown-600 hover:bg-cream-100 transition-all"
                                    title="Clear Canvas"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={exportPNG}
                                    className="px-4 py-2 rounded-xl text-brown-600 font-bold hover:bg-cream-100 transition-all flex items-center gap-2"
                                >
                                    <FileDown className="w-4 h-4" />
                                    {t('export.png')}
                                </button>
                                <button
                                    onClick={handlePublish}
                                    className="btn-primary flex items-center gap-2 py-2 px-4 shadow-rose-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    {t('onboarding.step5.title')}
                                </button>
                            </div>
                        </div>

                        {/* Canvas */}
                        <div className="overflow-auto rounded-2xl bg-white border border-tan-200 shadow-soft p-4">
                            <canvas
                                ref={canvasRef}
                                onMouseDown={handleStart}
                                onMouseMove={handleMove}
                                onMouseUp={handleEnd}
                                onMouseLeave={handleEnd}
                                onTouchStart={handleStart}
                                onTouchMove={handleMove}
                                onTouchEnd={handleEnd}
                                className="cursor-crosshair touch-none mx-auto rounded-lg"
                                style={{ maxWidth: '100%', height: 'auto' }}
                            />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Grid Size */}
                        <div className="p-5 rounded-2xl bg-white border border-tan-200 shadow-soft">
                            <h3 className="font-semibold text-brown-700 mb-4">{t('gridSize')}</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-brown-600">{t('width')} ({width})</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <button
                                            onClick={() => resizeGrid(Math.max(8, width - 4), height)}
                                            className="p-1.5 rounded-lg bg-cream-100 text-brown-600 hover:bg-cream-dark"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <input
                                            type="range"
                                            min="8"
                                            max="100"
                                            value={width}
                                            onChange={(e) => resizeGrid(Number(e.target.value), height)}
                                            className="flex-1 accent-rose-300"
                                        />
                                        <button
                                            onClick={() => resizeGrid(Math.min(100, width + 4), height)}
                                            className="p-1.5 rounded-lg bg-cream-100 text-brown-600 hover:bg-cream-dark"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-brown-600">{t('height')} ({height})</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <button
                                            onClick={() => resizeGrid(width, Math.max(8, height - 4))}
                                            className="p-1.5 rounded-lg bg-cream-100 text-brown-600 hover:bg-cream-dark"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <input
                                            type="range"
                                            min="8"
                                            max="100"
                                            value={height}
                                            onChange={(e) => resizeGrid(width, Number(e.target.value))}
                                            className="flex-1 accent-rose-300"
                                        />
                                        <button
                                            onClick={() => resizeGrid(width, Math.min(100, height + 4))}
                                            className="p-1.5 rounded-lg bg-cream-100 text-brown-600 hover:bg-cream-dark"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Color Palette */}
                        <div className="p-5 rounded-2xl bg-white border border-tan-200 shadow-soft">
                            <h3 className="font-semibold text-brown-700 mb-4">{t('symbols')}</h3>
                            <div className="grid grid-cols-4 gap-2">
                                {activePalette.map((color) => {
                                    const info = activeSymbols[color];
                                    return (
                                        <button
                                            key={color}
                                            onClick={() => {
                                                setSelectedColor(color);
                                                setTool('brush');
                                            }}
                                            className={`aspect-square rounded-xl flex items-center justify-center text-lg font-mono transition-all border-2 ${selectedColor === color
                                                ? 'ring-2 ring-rose-300 ring-offset-2 scale-110 border-rose-300'
                                                : 'border-tan-200 hover:scale-105'
                                                }`}
                                            style={{ backgroundColor: color }}
                                            title={t(`stitchSymbols.${info.name}`)}
                                        >
                                            <span className={color === '#FFFFFF' || color === '#F5D0C5' ? 'text-brown-700' : 'text-white'}>
                                                {info.symbol}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="p-5 rounded-2xl bg-white border border-tan-200 shadow-soft">
                            <h3 className="font-semibold text-brown-700 mb-3">Legend</h3>
                            <div className="space-y-2 text-sm">
                                {activePalette.map((color) => {
                                    const info = activeSymbols[color];
                                    return (
                                        <div key={color} className="flex items-center gap-2">
                                            <div
                                                className="w-7 h-7 rounded-lg flex items-center justify-center font-mono border border-tan-200"
                                                style={{ backgroundColor: color }}
                                            >
                                                <span className={color === '#FFFFFF' || color === '#F5D0C5' ? 'text-brown-700' : 'text-white'}>
                                                    {info.symbol}
                                                </span>
                                            </div>
                                            <span className="text-brown-600">{t(`stitchSymbols.${info.name}`)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {showPublishModal && (
                <PublishPatternModal
                    isOpen={showPublishModal}
                    onClose={() => setShowPublishModal(false)}
                    locale={locale}
                    initialFile={fileToPublish}
                    initialData={{ description: publishDescription }}
                />
            )}
        </div>
    );
}
