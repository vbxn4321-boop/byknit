'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations, useLocale } from 'next-intl';
import {
    Save, Download, Undo, Redo, ZoomIn, ZoomOut,
    Trash2, Eraser, MousePointer2, Hand,
    PaintBucket, Plus, ChevronDown, Check, X,
    FileText, Image as ImageIcon,
    Settings,
    HelpCircle, Info, Pipette, Paintbrush,
    ShoppingBag,
    BoxSelect, SquareDashed,
    Loader2,
    Shapes, Hexagon, Circle as CircleIcon, Triangle, Square, Star as StarIcon, Heart, Coins
} from 'lucide-react';
import dynamic from 'next/dynamic';
import jsPDF from 'jspdf';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { saveGridProject, publishPattern } from '@/app/actions/editor';
import { deductCredits } from '@/app/actions/credits';


// Taxonomy Definitions
const CATEGORY_TAXONOMY = {
    clothing: {
        label: { en: 'Clothing', ko: '의류' },
        sub: [
            { id: 'sweater', label: { en: 'Sweater/Pullover', ko: '스웨터/풀오버' } },
            { id: 'cardigan', label: { en: 'Cardigan', ko: '가디건' } },
            { id: 'vest', label: { en: 'Vest', ko: '조끼/베스트' } },
            { id: 'top', label: { en: 'Top/Tee', ko: '상의/티셔츠' } },
            { id: 'dress', label: { en: 'Dress/Skirt', ko: '원피스/스커트' } },
            { id: 'outer', label: { en: 'Coat/Jacket', ko: '아우터/코트' } },
            { id: 'intimates', label: { en: 'Intimates/Swim', ko: '속옷/수영복' } },
        ]
    },
    accessory: {
        label: { en: 'Accessories', ko: '액세서리/잡화' },
        sub: [
            { id: 'scarf', label: { en: 'Scarf/Cowl', ko: '목도리/워머' } },
            { id: 'shawl', label: { en: 'Shawl/Wrap', ko: '숄/랩' } },
            { id: 'hat', label: { en: 'Hat/Beanie', ko: '모자/비니' } },
            { id: 'gloves', label: { en: 'Gloves/Mittens', ko: '장갑/워머' } },
            { id: 'socks', label: { en: 'Socks/Footwear', ko: '양말/신발' } },
            { id: 'bag', label: { en: 'Bag/Purse', ko: '가방/파우치' } },
            { id: 'jewelry', label: { en: 'Headwear/Jewelry', ko: '헤어/주얼리' } },
        ]
    },
    home: {
        label: { en: 'Home/Living', ko: '홈/리빙' },
        sub: [
            { id: 'blanket', label: { en: 'Blanket', ko: '담요/블랭킷' } },
            { id: 'cushion', label: { en: 'Cushion', ko: '쿠션' } },
            { id: 'scrubber', label: { en: 'Scrubber', ko: '수세미' } },
            { id: 'coaster', label: { en: 'Coaster/Mat', ko: '코스터/매트' } },
            { id: 'basket', label: { en: 'Basket/Storage', ko: '바구니/정리함' } },
            { id: 'cover', label: { en: 'Cover/Case', ko: '커버/케이스' } },
            { id: 'etc', label: { en: 'Etc', ko: '기타' } },
        ]
    },
    baby: {
        label: { en: 'Baby/Kids', ko: '유아/아동' },
        sub: [
            { id: 'baby_clothes', label: { en: 'Baby Clothes', ko: '의류' } },
            { id: 'baby_hat', label: { en: 'Hat/Bonnet', ko: '모자/보넷' } },
            { id: 'baby_socks', label: { en: 'Socks/Booties', ko: '양말/신발' } },
            { id: 'baby_blanket', label: { en: 'Baby Blanket', ko: '겉싸개/담요' } },
            { id: 'baby_etc', label: { en: 'Etc', ko: '기타' } },
        ]
    },
    toy_hobby: {
        label: { en: 'Toys & Hobbies', ko: '장난감/취미' },
        sub: [
            { id: 'doll', label: { en: 'Doll/Toy', ko: '인형' } },
            { id: 'amigurumi', label: { en: 'Amigurumi', ko: '아미구루미' } },
            { id: 'ornament', label: { en: 'Ornament', ko: '장식품/오너먼트' } },
        ]
    },
    pet: {
        label: { en: 'Pets', ko: '애완동물' },
        sub: [
            { id: 'pet_clothes', label: { en: 'Pet Clothes', ko: '강아지/고양이 옷' } },
            { id: 'pet_toy', label: { en: 'Pet Toy', ko: '장난감' } },
            { id: 'pet_access', label: { en: 'Pet Accessories', ko: '액세서리' } },
        ]
    },
    other: {
        label: { en: 'Others', ko: '기타' },
        sub: [
            { id: 'pattern_component', label: { en: 'Component/Stitch Pattern', ko: '패턴/스티치 (부분)' } },
            { id: 'chart', label: { en: 'Chart Only', ko: '차트/도안' } },
            { id: 'button', label: { en: 'Button/Component', ko: '단추/부자재' } },
            { id: 'etc', label: { en: 'Etc', ko: '기타' } },
        ]
    }
};

const YARN_WEIGHTS = [
    { id: 'lace', label: 'Lace (레이스)' },
    { id: 'fingering', label: 'Fingering (핑거링/4ply)' },
    { id: 'sport', label: 'Sport (스포트/5ply)' },
    { id: 'dk', label: 'DK (DK/8ply)' },
    { id: 'worsted', label: 'Worsted (워스티드/10ply)' },
    { id: 'bulky', label: 'Bulky (벌키/12ply)' },
    { id: 'super_bulky', label: 'Super Bulky (슈퍼 벌키)' },
];

import { StitchSymbolDef, GridCell, GridCellData, GridSize, YarnPart } from './types';
import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingOverlay } from './OnboardingOverlay';
import { useEditorPersistence } from '@/hooks/useEditorPersistence';
import { NeedleSelector } from '../common/NeedleSelector';
import { UnitInput } from '../common/UnitInput';

// Dynamically import Konva components to avoid SSR issues
const Stage = dynamic(() => import('react-konva').then(mod => mod.Stage), { ssr: false });
const Layer = dynamic(() => import('react-konva').then(mod => mod.Layer), { ssr: false });
const Line = dynamic(() => import('react-konva').then(mod => mod.Line), { ssr: false });
const Rect = dynamic(() => import('react-konva').then(mod => mod.Rect), { ssr: false });
const Text = dynamic(() => import('react-konva').then(mod => mod.Text), { ssr: false });
const Circle = dynamic(() => import('react-konva').then(mod => mod.Circle), { ssr: false });
const Group = dynamic(() => import('react-konva').then(mod => mod.Group), { ssr: false });

import GridCanvas from './GridCanvas';
import RichTextEditor from '../common/RichTextEditor';

interface GridEditorProps {
    initialGrid?: GridCellData[][];
    initialSize?: GridSize;
    user: User | null;
    initialProject?: any;
    autoPublish?: boolean;
}

import { ImageCropper } from './ImageCropper';

export default function GridEditor({ initialGrid, initialSize, user, initialProject, autoPublish }: GridEditorProps) {
    const t = useTranslations('Studio');
    const tEditor = useTranslations('Editor');
    const tPublish = useTranslations('Publish');
    const locale = useLocale();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const [customAlert, setCustomAlert] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
        onCancel?: () => void;
    } | null>(null);

    const handleAuthCheck = (e: React.MouseEvent) => {
        if (!user) {
            e.preventDefault();
            e.stopPropagation();
            setCustomAlert({
                title: locale === 'ko' ? '로그인 필요' : 'Login Required',
                message: t('authRequired') || 'Authentication required',
                onConfirm: () => {
                    router.push('/login');
                }
            });
        }
    };


    // Cloud State
    const [projectId, setProjectId] = useState<string | null>(initialProject?.id || null);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [showPublishModal, setShowPublishModal] = useState(autoPublish || false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [showPublishSuccess, setShowPublishSuccess] = useState(false);
    const [publishedPatternId, setPublishedPatternId] = useState<string | null>(null);

    const [isDirty, setIsDirty] = useState(false);

    // Move Source State (for visual hide during drag)
    const [moveSource, setMoveSource] = useState<{ startRow: number, endRow: number, startCol: number, endCol: number } | null>(null);

    // Image Cropping State
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [croppingTarget, setCroppingTarget] = useState<'main' | 'new_sub' | number | null>(null);

    // Unit State
    const [yardageUnit, setYardageUnit] = useState<'m' | 'yd'>('m');
    const YARD_TO_METER = 0.9144;

    const [publishMetadata, setPublishMetadata] = useState<{
        title: string;
        price: number;
        craftType: 'knitting' | 'crochet' | 'mixed' | 'other';
        category: string;
        subcategory?: string;
        difficulty: string;
        briefDescription: string;      // Product description (shown on page)
        detailedDescription: string;   // Written pattern (PDF only)
        imageUrl?: string;
        additionalImages?: string[];
        yarnWeight?: string;
        yardage?: number | string;
        needles: string;               // Required
        gaugeStitches: number | string;         // Required - stitches per 10cm
        gaugeRows: number | string;             // Required - rows per 10cm
        usedColors?: string[];         // Actual colors used in grid
        hashtags: string[];            // Required: min 3, max 10
        yarnParts?: YarnPart[];        // Dynamic yarn parts
        sizeParts?: { id: string; name: string; detail: string }[];
    }>({
        title: '',
        price: 0,
        craftType: 'knitting',
        category: 'clothing',
        difficulty: 'intermediate',
        briefDescription: '',
        detailedDescription: '',
        imageUrl: undefined,
        additionalImages: [],
        needles: '',
        gaugeStitches: 22,
        gaugeRows: 30,
        usedColors: [],
        hashtags: [],
        yarnParts: [],
        sizeParts: []
    });



    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, target: 'main' | 'new_sub' | number) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempImage(reader.result as string);
                setCroppingTarget(target);
            };
            reader.readAsDataURL(file);
        }
        // Reset input
        e.target.value = '';
    };

    // ... existing effects


    // Grid State
    const [gridSize, setGridSize] = useState<GridSize>(initialProject ? { cols: initialProject.width, rows: initialProject.height } : (initialSize || { cols: 40, rows: 40 }));
    const [gridData, setGridData] = useState<GridCellData[][]>(initialProject ? initialProject.grid_data : (initialGrid || Array(40).fill(null).map(() => Array(40).fill({ color: '#ffffff', symbolId: null }))));

    // Local state for Grid Size inputs to allow flexible editing
    const [localCols, setLocalCols] = useState(gridSize.cols.toString());
    const [localRows, setLocalRows] = useState(gridSize.rows.toString());

    // Sync local state when external grid size changes
    useEffect(() => {
        setLocalCols(gridSize.cols.toString());
        setLocalRows(gridSize.rows.toString());
    }, [gridSize.cols, gridSize.rows]);

    // History for Undo/Redo
    const [history, setHistory] = useState<GridCellData[][][]>([gridData]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // Initialize with project data if provided
    useEffect(() => {
        if (initialProject) {
            setCustomColors(initialProject.palette || []);
            // If we have autoPublish, the modal state is already set by useState
        }
    }, [initialProject]);

    // Tools & Selection
    const [activeTool, setActiveTool] = useState<'symbol' | 'paint' | 'eraser' | 'move' | 'shape' | 'selection' | 'bucket' | 'eyedropper'>('symbol');
    const [activeShape, setActiveShape] = useState<'circle' | 'square' | 'triangle' | 'star' | 'heart'>('circle');
    const [shapeMode, setShapeMode] = useState<'outline' | 'fill'>('outline');
    const [shapeRotation, setShapeRotation] = useState<number>(0);
    const handleTypeRef = useRef<'resize' | 'rotate' | null>(null);
    const [shapePreview, setShapePreview] = useState<{ startRow: number; startCol: number; endRow: number; endCol: number } | null>(null);
    const [isShapeMenuOpen, setIsShapeMenuOpen] = useState(false);
    const [isBucketMenuOpen, setIsBucketMenuOpen] = useState(false);
    const [shapeApplyTarget, setShapeApplyTarget] = useState<'both' | 'color' | 'symbol'>('both');
    const [showTransformationHint, setShowTransformationHint] = useState(false);

    const [isSimultaneousDraw, setIsSimultaneousDraw] = useState(false);
    const [bucketMode, setBucketMode] = useState<'both' | 'color' | 'symbol'>('both');
    const [eyedropperMode, setEyedropperMode] = useState<'both' | 'color' | 'symbol'>('both');
    const previousToolRef = useRef<string>('symbol');

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedSymbol, setSelectedSymbol] = useState<string>('knit');
    const [selectedColor, setSelectedColor] = useState<string>('#E8B4B8'); // Pink default (better visibility)
    const [customColors, setCustomColors] = useState<string[]>(['#6B8E63', '#E8B4B8', '#A4C3B2', '#E6CCB2']);

    // Painting & Selection State
    const [isDragging, setIsDragging] = useState(false);
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState<{ row: number; col: number } | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<{ row: number; col: number } | null>(null);

    // Context Menu & Clipboard State
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
    const [clipboard, setClipboard] = useState<GridCellData[][] | null>(null);
    const [finalSelection, setFinalSelection] = useState<{
        startRow: number; endRow: number; startCol: number; endCol: number;
    } | null>(null);
    const [isRotationMode, setIsRotationMode] = useState(false);
    const rotationDragRef = useRef<{
        isActive: boolean;
        startAngle: number;
        centerX: number;
        centerY: number;
        accumulatedAngle: number;
    } | null>(null);


    // Viewport
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const stageRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastDistRef = useRef<number>(0);

    // Custom Symbols
    const [customSymbols, setCustomSymbols] = useState<StitchSymbolDef[]>([]);
    const [isAddingSymbol, setIsAddingSymbol] = useState(false);
    const [newSymbolData, setNewSymbolData] = useState({ name: '', label: '' });

    // Floating Rotation Buffer
    const [floatingBuffer, setFloatingBuffer] = useState<{
        data: GridCellData[][];
        startRow: number;
        startCol: number;
        pivotRow: number;
        pivotCol: number;
    } | null>(null);

    // Onboarding
    const { showOnboarding, onCloseOnboarding, setShowOnboarding } = useOnboarding();
    const [onboardingStep, setOnboardingStep] = useState(1);

    // Persistence for AI Import
    const { hasAIImport, loadAIImport } = useEditorPersistence();

    // Export
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [projectTitle, setProjectTitle] = useState(initialProject?.title || 'My Pattern');

    // Editor Mode: 'knitting' (대바늘) or 'crochet' (코바늘)
    const [editorMode, setEditorMode] = useState<'knitting' | 'crochet'>('knitting');

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Sync project title to publish metadata when modal opens
    useEffect(() => {
        if (showPublishModal && !publishMetadata.title) {
            setPublishMetadata(prev => ({ ...prev, title: projectTitle }));
        }
    }, [showPublishModal, projectTitle]);
    const [deletingColor, setDeletingColor] = useState<string | null>(null);
    const [deletingSymbol, setDeletingSymbol] = useState<string | null>(null);

    // Auto-populate usedColors and gauge when modal opens
    useEffect(() => {
        if (showPublishModal) {
            // Collect unique colors from gridData
            const colorsInGrid = new Set<string>();
            gridData.forEach(row => {
                row.forEach(cell => {
                    if (cell.color && cell.color !== '#ffffff') {
                        colorsInGrid.add(cell.color);
                    }
                });
            });

            setPublishMetadata(prev => ({
                ...prev,
                title: prev.title || projectTitle,
                usedColors: prev.usedColors?.length ? prev.usedColors : Array.from(colorsInGrid),
                gaugeStitches: prev.gaugeStitches === 22 ? gridSize.cols : prev.gaugeStitches,  // Use actual grid width if still default
                gaugeRows: prev.gaugeRows === 30 ? gridSize.rows : prev.gaugeRows              // Use actual grid height if still default
            }));
        }
    }, [showPublishModal, gridData, projectTitle, gridSize]);


    const hasCentered = useRef(false);
    const colorInputRef = useRef<HTMLInputElement | null>(null);
    const [isSpacePressed, setIsSpacePressed] = useState(false);
    const [showGridSizeModal, setShowGridSizeModal] = useState(false);
    const [tempGridSize, setTempGridSize] = useState(gridSize);

    // Selection Moving State
    const selectionBoxMoveRef = useRef<{ isMoving: boolean; startRow: number; startCol: number; hasMoved: boolean } | null>(null);
    const selectionContentMoveRef = useRef<{ isMoving: boolean; startRow: number; startCol: number; originalStartRow: number; originalStartCol: number; hasMoved: boolean; initialData: GridCellData[][] } | null>(null);
    const lastPointerPosRef = useRef<{ row: number; col: number } | null>(null);

    const bucketDropdownRef = useRef<HTMLDivElement>(null);
    const shapeDropdownRef = useRef<HTMLDivElement>(null);

    // Disable body scroll when editor is mounted
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    // Handle clicks outside of dropdown menus to close them
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (isBucketMenuOpen && bucketDropdownRef.current && !bucketDropdownRef.current.contains(e.target as Node)) {
                setIsBucketMenuOpen(false);
            }
            if (isShapeMenuOpen && shapeDropdownRef.current && !shapeDropdownRef.current.contains(e.target as Node)) {
                setIsShapeMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isBucketMenuOpen, isShapeMenuOpen]);

    // Handle Unsaved Changes Warning
    useEffect(() => {
        // 1. Browser Level (Refresh, Tab Close, Back/Forward in some cases)
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };

        // 2. SPA Level (Internal Next.js Link Clicks)
        // Note: App Router doesn't have a built-in beforePopState or navigation interceptor easily.
        // We catch clicks on <a> tags globally as a reliable fallback.
        const handleAnchorClick = (e: MouseEvent) => {
            if (!isDirty) return;

            let target = e.target as HTMLElement;
            // Bubble up to find <a> tag
            while (target && target.tagName !== 'A') {
                target = target.parentElement as HTMLElement;
            }

            if (target && target.tagName === 'A') {
                const href = target.getAttribute('href');
                // Only intercept actual navigation links (not button-like <a> or tel/mailto)
                if (href && !href.startsWith('#') && !href.startsWith('tel:') && !href.startsWith('mailto:')) {
                    e.preventDefault();
                    e.stopPropagation();

                    setCustomAlert({
                        title: locale === 'ko' ? '저장되지 않은 변경사항' : 'Unsaved Changes',
                        message: t('unsavedChangesWarning') || 'You have unsaved changes. Are you sure you want to leave?',
                        onConfirm: () => {
                            setIsDirty(false);
                            router.push(href);
                        },
                        onCancel: () => {}
                    });
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('click', handleAnchorClick, true); // Use capture to intercept before Next.js Link

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('click', handleAnchorClick, true);
        };
    }, [isDirty, t]);

    // Load AI Import Data
    useEffect(() => {
        if (hasAIImport()) {
            const imported = loadAIImport();
            if (imported) {
                // Convert simple color grid to GridCellData
                const newGrid = imported.grid.map((row: number[]) =>
                    row.map(colorIdx => ({
                        color: imported.palette[colorIdx],
                        symbolId: null
                    }))
                );

                setGridSize({ rows: imported.height, cols: imported.width });
                setGridData(newGrid);
                setCustomColors(imported.palette);
                // Reset history
                setHistory([newGrid]);
                setHistoryIndex(0);

                // Allow centering to happen again for new data
                hasCentered.current = false;
            }
        }
    }, [hasAIImport, loadAIImport]);

    // Spacebar Panning
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Block spacebar scroll for entire page except input fields
            if (e.code === 'Space') {
                const target = e.target as HTMLElement;
                const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

                if (!isInput) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!e.repeat) {
                        setIsSpacePressed(true);
                    }
                    return false;
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                const target = e.target as HTMLElement;
                const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

                if (!isInput) {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsSpacePressed(false);
                    return false;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown, { passive: false, capture: true });
        document.addEventListener('keyup', handleKeyUp, { passive: false, capture: true });
        return () => {
            document.removeEventListener('keydown', handleKeyDown, { capture: true });
            document.removeEventListener('keyup', handleKeyUp, { capture: true });
        };
    }, []);

    useEffect(() => {
        if (finalSelection && (activeTool === 'shape' || isRotationMode)) {
            setShowTransformationHint(true);
            const timer = setTimeout(() => {
                setShowTransformationHint(false);
            }, 6000); // Hide after 6 seconds
            return () => clearTimeout(timer);
        } else {
            setShowTransformationHint(false);
        }
    }, [finalSelection, activeTool, isRotationMode]);

    const CELL_SIZE = 30;

    useEffect(() => {
        setIsMounted(true);
        const hasSeen = localStorage.getItem('hasSeenOnboarding');
        if (!hasSeen) setShowOnboarding(true);
    }, [setShowOnboarding]);

    // Center grid on mount
    useEffect(() => {
        if (isMounted && !hasCentered.current && containerRef.current) {
            const { offsetWidth, offsetHeight } = containerRef.current;
            const gridWidth = gridSize.cols * CELL_SIZE;
            const gridHeight = gridSize.rows * CELL_SIZE;

            const x = (offsetWidth - gridWidth) / 2;
            const y = (offsetHeight - gridHeight) / 2;

            setPosition({ x, y });
            hasCentered.current = true;
        }
    }, [isMounted, gridSize]);

    // History Management
    const saveToHistory = (newData: GridCellData[][]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newData);
        if (newHistory.length > 50) newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setGridData(newData);
    };

    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setGridData(history[historyIndex - 1]);
            setIsDirty(true);
        }
    }, [history, historyIndex]);

    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setGridData(history[historyIndex + 1]);
            setIsDirty(true);
        }
    }, [history, historyIndex]);

    // Undo/Redo Keyboard Shortcuts
    useEffect(() => {
        const handleShortcut = (e: KeyboardEvent) => {
            // Check for Ctrl+Z or Cmd+Z
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                if (e.shiftKey) {
                    // Redo: Ctrl+Shift+Z
                    e.preventDefault();
                    handleRedo();
                } else {
                    // Undo: Ctrl+Z
                    e.preventDefault();
                    handleUndo();
                }
            }
            // Removed Ctrl+Y support as per user request
        };

        window.addEventListener('keydown', handleShortcut);
        return () => window.removeEventListener('keydown', handleShortcut);
    }, [handleUndo, handleRedo]);

    // Grid Interaction
    const updateCell = (r: number, c: number) => {
        if (r < 0 || r >= gridSize.rows || c < 0 || c >= gridSize.cols) return;
        const currentCell = gridData[r][c];
        let newCell = { ...currentCell };

        if (isSimultaneousDraw && (activeTool === 'symbol' || activeTool === 'paint')) {
            newCell.symbolId = selectedSymbol;
            newCell.color = selectedColor;
        } else if (activeTool === 'symbol') {
            newCell.symbolId = selectedSymbol;
        } else if (activeTool === 'paint') {
            newCell.color = selectedColor;
        } else if (activeTool === 'eraser') {
            newCell.symbolId = null;
            newCell.color = '#ffffff';
        } else {
            return; // Move tool
        }

        if (JSON.stringify(newCell) !== JSON.stringify(currentCell)) {
            const newData = gridData.map(row => [...row]);
            newData[r][c] = newCell;
            saveToHistory(newData); // In a real app, debounce this
        }
    };

    const paintCellsLine = (startRow: number, startCol: number, endRow: number, endCol: number) => {
        const cells: { r: number; c: number }[] = [];
        const dr = Math.abs(endRow - startRow);
        const dc = Math.abs(endCol - startCol);
        const sr = startRow < endRow ? 1 : -1;
        const sc = startCol < endCol ? 1 : -1;
        let err = dc - dr;

        let r = startRow;
        let c = startCol;

        while (true) {
            if (r >= 0 && r < gridSize.rows && c >= 0 && c < gridSize.cols) {
                cells.push({ r, c });
            }
            if (r === endRow && c === endCol) break;

            const e2 = 2 * err;
            if (e2 > -dr) {
                err -= dr;
                c += sc;
            }
            if (e2 < dc) {
                err += dc;
                r += sr;
            }
        }

        if (cells.length === 0) return;

        let newData: GridCellData[][] | null = null;

        for (const cell of cells) {
            const currentCell = (newData || gridData)[cell.r][cell.c];
            let newCell = { ...currentCell };

            if (isSimultaneousDraw && (activeTool === 'symbol' || activeTool === 'paint')) {
                newCell.symbolId = selectedSymbol;
                newCell.color = selectedColor;
            } else if (activeTool === 'symbol') {
                newCell.symbolId = selectedSymbol;
            } else if (activeTool === 'paint') {
                newCell.color = selectedColor;
            } else if (activeTool === 'eraser') {
                newCell.symbolId = null;
                newCell.color = '#ffffff';
            } else {
                continue;
            }

            if (JSON.stringify(newCell) !== JSON.stringify(currentCell)) {
                if (!newData) {
                    newData = gridData.map(row => [...row]);
                }
                newData[cell.r][cell.c] = newCell;
            }
        }

        if (newData) {
            saveToHistory(newData);
            setGridData(newData);
            setIsDirty(true);
        }
    };

    const performFloodFill = (startRow: number, startCol: number) => {
        if (startRow < 0 || startRow >= gridSize.rows || startCol < 0 || startCol >= gridSize.cols) return;

        const targetCell = gridData[startRow][startCol];
        const targetColor = targetCell.color || '#ffffff';
        const targetSymbol = targetCell.symbolId || null;

        const fillColor = selectedColor;
        const fillSymbol = selectedSymbol;

        const isColorMatch = targetColor === fillColor;
        const isSymbolMatch = targetSymbol === fillSymbol;

        let shouldSkip = false;
        if (bucketMode === 'both') {
            if (isColorMatch && isSymbolMatch) shouldSkip = true;
        } else if (bucketMode === 'color') {
            if (isColorMatch) shouldSkip = true;
        } else if (bucketMode === 'symbol') {
            if (isSymbolMatch) shouldSkip = true;
        }
        if (shouldSkip) return;

        const newData = gridData.map(row => [...row]);
        const visited = Array(gridSize.rows).fill(null).map(() => Array(gridSize.cols).fill(false));
        const stack: [number, number][] = [[startRow, startCol]];

        while (stack.length > 0) {
            const [r, c] = stack.pop()!;
            if (r < 0 || r >= gridSize.rows || c < 0 || c >= gridSize.cols) continue;
            if (visited[r][c]) continue;

            const currentCell = newData[r][c];
            const currentColor = currentCell.color || '#ffffff';
            const currentSymbol = currentCell.symbolId || null;

            let matches = false;
            if (bucketMode === 'both') {
                matches = currentColor === targetColor && currentSymbol === targetSymbol;
            } else if (bucketMode === 'color') {
                matches = currentColor === targetColor;
            } else if (bucketMode === 'symbol') {
                matches = currentSymbol === targetSymbol;
            }

            if (matches) {
                visited[r][c] = true;

                if (bucketMode === 'both') {
                    newData[r][c] = {
                        ...currentCell,
                        color: fillColor,
                        symbolId: fillSymbol
                    };
                } else if (bucketMode === 'color') {
                    newData[r][c] = {
                        ...currentCell,
                        color: fillColor
                    };
                } else if (bucketMode === 'symbol') {
                    newData[r][c] = {
                        ...currentCell,
                        symbolId: fillSymbol
                    };
                }

                stack.push([r + 1, c]);
                stack.push([r - 1, c]);
                stack.push([r, c + 1]);
                stack.push([r, c - 1]);
            }
        }

        saveToHistory(newData);
        setGridData(newData);
        setIsDirty(true);
    };

    // Mouse Event Handlers
    // Mouse Event Handlers
    // Mouse Event Handlers
    const resizeHandleRef = useRef<number | null>(null);
    const isDraggingRef = useRef(false);

    const handleMouseDown = (e: any) => {
        if (activeTool === 'move' || isSpacePressed) return;
        if (isShapeMenuOpen) setIsShapeMenuOpen(false);
        if (isBucketMenuOpen) setIsBucketMenuOpen(false);

        // Detect Handle clicks via event argument (Passed from GridCanvas wrapper)
        if ((activeTool === 'shape' || isRotationMode) && finalSelection) {
            if (e.handleType) {
                resizeHandleRef.current = e.handleIndex;
                handleTypeRef.current = e.handleType;
                setIsDragging(true);
                return;
            }
        }

        // Fallback or other logic
        // ...

        // 1. Right Click: Move Content (Init Floating Buffer)
        if (e.evt.button === 2) {
            // If in shape tool, don't start a new selection on right click
            if (activeTool === 'shape') return;

            const stage = e.target.getStage();
            const pos = getPointerGridPos(stage);

            if (finalSelection && pos) {
                if (pos.row >= finalSelection.startRow && pos.row <= finalSelection.endRow &&
                    pos.col >= finalSelection.startCol && pos.col <= finalSelection.endCol) {

                    // Extract Content
                    const { startRow, endRow, startCol, endCol } = finalSelection;
                    const buffer: GridCellData[][] = [];
                    for (let r = startRow; r <= endRow; r++) {
                        const row: GridCellData[] = [];
                        for (let c = startCol; c <= endCol; c++) {
                            row.push({ ...gridData[r][c] });
                        }
                        buffer.push(row);
                    }

                    // Init Floating Buffer
                    const height = endRow - startRow + 1;
                    const width = endCol - startCol + 1;

                    setFloatingBuffer({ data: buffer, startRow, startCol, pivotRow: startRow + height / 2, pivotCol: startCol + width / 2 });

                    // Set Move Source to visually hide original
                    setMoveSource({
                        startRow: finalSelection.startRow,
                        endRow: finalSelection.endRow,
                        startCol: finalSelection.startCol,
                        endCol: finalSelection.endCol
                    });

                    selectionContentMoveRef.current = {
                        isMoving: true,
                        startRow: pos.row,
                        startCol: pos.col,
                        originalStartRow: finalSelection.startRow,
                        originalStartCol: finalSelection.startCol,
                        hasMoved: false,
                        initialData: buffer
                    };
                    return;
                }
            }
            return;
        }

        // 2. Left Click (Button 0): Check Selection for "Content Move" (Cut & Move) & Context Menu Check
        if (e.evt.button === 0 || !('button' in e.evt) || e.evt.pointerType === 'touch') {
            const stage = e.target.getStage();
            const pos = getPointerGridPos(stage);

            if (finalSelection && pos) {
                if (pos.row >= finalSelection.startRow && pos.row <= finalSelection.endRow &&
                    pos.col >= finalSelection.startCol && pos.col <= finalSelection.endCol) {

                    selectionBoxMoveRef.current = {
                        isMoving: true,
                        startRow: pos.row,
                        startCol: pos.col,
                        hasMoved: false
                    };
                    return; // Stop standard selection logic
                }
            }
        }



        const stage = e.target.getStage();
        const pos = getPointerGridPos(stage);
        if (!pos) return;

        // If clicking outside menu area, hide menu
        if (showContextMenu) setShowContextMenu(false);

        // User Request: Don't exit rotation mode on background click, use Confirm button instead.
        if (finalSelection && !isRotationMode) {
            // If clicking inside selection in Move tool? No, we are in non-move tool.
            // If clicking inside selection, maybe we want to drag?
            // But existing logic cleared selection if clicking outside.

            if (pos.row >= finalSelection.startRow && pos.row <= finalSelection.endRow &&
                pos.col >= finalSelection.startCol && pos.col <= finalSelection.endCol) {
                // Clicking inside selection. Do nothing? Or let drag start?
                // Previously we showed menu. Now we do nothing (waiting for right click).
            } else {
                setFinalSelection(null);
            }
        }

        if (e.evt.button === 0 || !('button' in e.evt) || e.evt.pointerType === 'touch') {
            if (isSelectionMode) {
                setIsSelecting(true);
                setSelectionStart(pos);
                setSelectionEnd(pos);
            } else if (activeTool === 'shape') {
                const stage = e.target.getStage();
                const pos = getPointerGridPos(stage);
                if (pos) {
                    // Close shape dropdown menu when drawing starts
                    setIsShapeMenuOpen(false);
                    setIsBucketMenuOpen(false);
                    setIsDragging(true);
                    setSelectionStart(pos);
                    setSelectionEnd(pos);
                    setShapeRotation(0); // Reset rotation for new shape
                    setShapePreview({
                        startRow: pos.row,
                        startCol: pos.col,
                        endRow: pos.row,
                        endCol: pos.col
                    });
                }
            } else if (activeTool === 'bucket') {
                performFloodFill(pos.row, pos.col);
            } else if (activeTool === 'eyedropper') {
                const clickedCell = gridData[pos.row][pos.col];
                const cellColor = clickedCell.color || '#ffffff';
                const cellSymbol = clickedCell.symbolId || null;

                const hasColor = cellColor && cellColor !== '#ffffff';
                const hasSymbol = !!cellSymbol;

                if (!hasColor && !hasSymbol) {
                    // Empty cell: Just restore previous tool
                    const prevTool = previousToolRef.current;
                    if (prevTool === 'selection') {
                        setActiveTool('selection');
                        setIsSelectionMode(true);
                    } else if (['paint', 'symbol', 'eraser', 'move', 'shape', 'bucket'].includes(prevTool)) {
                        setActiveTool(prevTool as any);
                    } else {
                        setActiveTool('symbol');
                    }
                } else {
                    if (hasColor) setSelectedColor(cellColor);
                    if (hasSymbol) setSelectedSymbol(cellSymbol);

                    const prevTool = previousToolRef.current;
                    let nextTool = prevTool;

                    if (hasColor && hasSymbol) {
                        setIsSimultaneousDraw(true);
                        if (!['paint', 'symbol', 'bucket'].includes(nextTool)) {
                            nextTool = 'paint';
                        }
                        if (nextTool === 'bucket') setBucketMode('both');
                    } else if (hasColor && !hasSymbol) {
                        setIsSimultaneousDraw(false);
                        if (nextTool === 'symbol' || !['paint', 'symbol', 'bucket'].includes(nextTool)) {
                            nextTool = 'paint';
                        }
                        if (nextTool === 'bucket') setBucketMode('color');
                    } else if (!hasColor && hasSymbol) {
                        setIsSimultaneousDraw(false);
                        if (nextTool === 'paint' || !['paint', 'symbol', 'bucket'].includes(nextTool)) {
                            nextTool = 'symbol';
                        }
                        if (nextTool === 'bucket') setBucketMode('symbol');
                    }

                    setActiveTool(nextTool as any);
                }
            } else {
                setIsDragging(true);
                paintCellsLine(pos.row, pos.col, pos.row, pos.col); // Paint initial cell
                lastPointerPosRef.current = pos;
            }
        }
    };

    const getPointerGridPos = (stage: any) => {
        if (!stage) return null;
        const pointer = stage.getPointerPosition();
        if (!pointer) return null;

        const scale = stage.scaleX();
        const x = (pointer.x - stage.x()) / scale;
        const y = (pointer.y - stage.y()) / scale;

        const col = Math.floor(x / CELL_SIZE);
        const row = Math.floor(y / CELL_SIZE);

        return { row, col };
    };

    const handleMouseMove = (e: any) => {
        const stage = e.target.getStage();
        // Handle Move Tool & Space Panning via built-in draggable or logic (handled by Stage draggable prop mostly)
        // But if standard drag-paint:

        if (activeTool === 'move' || isSpacePressed) return;

        const pos = getPointerGridPos(stage);
        if (!pos) return;

        // A. Handle Content Move (Right Drag)
        if (selectionContentMoveRef.current && selectionContentMoveRef.current.isMoving && floatingBuffer) {
            const { startRow, startCol } = selectionContentMoveRef.current;
            const dRow = pos.row - startRow;
            const dCol = pos.col - startCol;

            if (dRow !== 0 || dCol !== 0) {
                selectionContentMoveRef.current.hasMoved = true;

                // Update Floating Buffer Position
                // We need to know original Buffer position?
                // No, floatingBuffer state has the current pos?
                // Actually, better to base calculation on ORIGINAL pos to avoid cumulative error.
                // But buffer state updates.
                // Let's us selectionContentMoveRef to store "Drag Start Mouse Pos" and "Drag Start Buffer Pos"?
                // Currently we just stored Drag Start Mouse Pos.

                // Simple approach: Update state and update ref?
                // Delta approach:
                // newBufferRow = oldBufferRow + dRow?
                // But this is continuous.
                // Let's just update `selectionContentMoveRef` start to current pos after update?
                // Yes.

                const newBufferStartRow = floatingBuffer.startRow + dRow;
                const newBufferStartCol = floatingBuffer.startCol + dCol;

                setFloatingBuffer(prev => prev ? { ...prev, startRow: newBufferStartRow, startCol: newBufferStartCol } : null);

                selectionContentMoveRef.current.startRow = pos.row;
                selectionContentMoveRef.current.startCol = pos.col;

                // Also Sync Selection Box?
                // "박스와 박스안에 내용도 함께 움직이게하자" -> Yes.
                if (finalSelection) {
                    const newSelection = {
                        startRow: finalSelection.startRow + dRow,
                        endRow: finalSelection.endRow + dRow,
                        startCol: finalSelection.startCol + dCol,
                        endCol: finalSelection.endCol + dCol
                    };
                    setFinalSelection(newSelection);
                    setSelectionStart({ row: newSelection.startRow, col: newSelection.startCol });
                    setSelectionEnd({ row: newSelection.endRow, col: newSelection.endCol });
                }
            }
            return;
        }

        // B. Handle Box Move (Left Drag)
        if (selectionBoxMoveRef.current && selectionBoxMoveRef.current.isMoving) {
            const { startRow, startCol } = selectionBoxMoveRef.current;
            const dRow = pos.row - startRow;
            const dCol = pos.col - startCol;

            if (dRow !== 0 || dCol !== 0) {
                selectionBoxMoveRef.current.hasMoved = true;
                selectionBoxMoveRef.current.startRow = pos.row;
                selectionBoxMoveRef.current.startCol = pos.col;

                if (finalSelection) {
                    const newSelection = {
                        startRow: finalSelection.startRow + dRow,
                        endRow: finalSelection.endRow + dRow,
                        startCol: finalSelection.startCol + dCol,
                        endCol: finalSelection.endCol + dCol
                    };

                    if (newSelection.startRow >= 0 && newSelection.endRow < gridSize.rows &&
                        newSelection.startCol >= 0 && newSelection.endCol < gridSize.cols) {
                        setFinalSelection(newSelection);
                        setSelectionStart({ row: newSelection.startRow, col: newSelection.startCol });
                        setSelectionEnd({ row: newSelection.endRow, col: newSelection.endCol });
                    } else {
                        selectionBoxMoveRef.current.startRow = startRow;
                        selectionBoxMoveRef.current.startCol = startCol;
                    }
                }
            }
            return;
        }

        // Handle Rotation (corners: h = 0-3 with handleType 'rotate')
        if ((activeTool === 'shape' || isRotationMode) && isDragging && resizeHandleRef.current !== null && handleTypeRef.current === 'rotate' && finalSelection) {
            // Calculate rotation angle from mouse position relative to shape center
            // Calculate rotation angle from mouse position relative to shape center
            // Use Stage Coords for smoothness
            const stage = e.target.getStage();
            const pointer = stage.getPointerPosition();
            if (!pointer) return;

            const centerRow = (finalSelection.startRow + finalSelection.endRow + 1) / 2;
            const centerCol = (finalSelection.startCol + finalSelection.endCol + 1) / 2;

            const gridCenterX = centerCol * CELL_SIZE;
            const gridCenterY = centerRow * CELL_SIZE;

            const stageCenterX = gridCenterX * scale + position.x;
            const stageCenterY = gridCenterY * scale + position.y;

            const angle = Math.atan2(pointer.y - stageCenterY, pointer.x - stageCenterX);

            // Snap logic: Shift = 45° hard snap, otherwise hard snap to 15°
            // Snap logic: 15 degrees default, 90 degrees with Shift
            const SNAP_ANGLE_SHIFT = Math.PI / 2; // 90 degrees
            const SNAP_ANGLE_DEFAULT = Math.PI / 12; // 15 degrees

            let snappedAngle = angle;
            if (e.evt?.shiftKey) {
                snappedAngle = Math.round(angle / SNAP_ANGLE_SHIFT) * SNAP_ANGLE_SHIFT;
            } else {
                snappedAngle = Math.round(angle / SNAP_ANGLE_DEFAULT) * SNAP_ANGLE_DEFAULT;
            }

            setShapeRotation(snappedAngle);
            // Pure rotation: NO size changes
            return;
        }

        // Handle Resize (edges: h = 4-7 with handleType 'resize')
        if (activeTool === 'shape' && isDragging && resizeHandleRef.current !== null && handleTypeRef.current === 'resize' && finalSelection) {
            let { startRow, endRow, startCol, endCol } = finalSelection;
            const h = resizeHandleRef.current;

            // Edge handles: 4=top, 5=right, 6=bottom, 7=left
            if (h === 4) { startRow = pos.row; } // Top edge
            else if (h === 5) { endCol = pos.col; } // Right edge
            else if (h === 6) { endRow = pos.row; } // Bottom edge
            else if (h === 7) { startCol = pos.col; } // Left edge

            const sRow = Math.min(startRow, endRow);
            const eRow = Math.max(startRow, endRow);
            const sCol = Math.min(startCol, endCol);
            const eCol = Math.max(startCol, endCol);

            setFinalSelection({ startRow: sRow, endRow: eRow, startCol: sCol, endCol: eCol });
            setSelectionStart({ row: sRow, col: sCol });
            setSelectionEnd({ row: eRow, col: eCol });
            setShapePreview({ startRow: sRow, startCol: sCol, endRow: eRow, endCol: eCol });
            return;
        }

        if (activeTool === 'shape' && isDragging && resizeHandleRef.current === null && selectionStart) {
            let endRow = pos.row;
            let endCol = pos.col;

            if (e.evt.shiftKey) {
                const dRow = Math.abs(endRow - selectionStart.row);
                const dCol = Math.abs(endCol - selectionStart.col);
                const size = Math.max(dRow, dCol);
                endRow = selectionStart.row + (endRow >= selectionStart.row ? size : -size);
                endCol = selectionStart.col + (endCol >= selectionStart.col ? size : -size);
            }

            setSelectionEnd({ row: endRow, col: endCol });
            setShapePreview({
                startRow: selectionStart.row,
                startCol: selectionStart.col,
                endRow,
                endCol
            });
            return;
        }

        if (isSelecting && selectionStart) {
            setSelectionEnd(pos);
        } else if (isDragging) {
            if (lastPointerPosRef.current) {
                paintCellsLine(lastPointerPosRef.current.row, lastPointerPosRef.current.col, pos.row, pos.col);
            } else {
                paintCellsLine(pos.row, pos.col, pos.row, pos.col);
            }
            lastPointerPosRef.current = pos;
        }
    };

    const handleMouseUp = useCallback((e?: any) => {
        resizeHandleRef.current = null;
        lastPointerPosRef.current = null;
        if (isSelecting && selectionStart && selectionEnd) {
            // Store final selection bounds
            const startRow = Math.min(selectionStart.row, selectionEnd.row);
            const endRow = Math.max(selectionStart.row, selectionEnd.row);
            const startCol = Math.min(selectionStart.col, selectionEnd.col);
            const endCol = Math.max(selectionStart.col, selectionEnd.col);

            // Clamp to grid bounds
            const clampedSelection = {
                startRow: Math.max(0, startRow),
                endRow: Math.min(gridSize.rows - 1, endRow),
                startCol: Math.max(0, startCol),
                endCol: Math.min(gridSize.cols - 1, endCol)
            };

            setFinalSelection(clampedSelection);
            setIsSelecting(false);

            // Auto-show Menu: Only if it was a CLICK, not a DRAG selection?
            // Usually we just select.
        } else {
            // Handle Content Move Finish (Drag)
            if (selectionContentMoveRef.current && selectionContentMoveRef.current.hasMoved) {
                const { originalStartRow, originalStartCol, initialData } = selectionContentMoveRef.current;
                const rows = initialData.length;
                const cols = initialData[0].length;

                // Commit the move (Clear original, Write new)
                commitRotation({
                    startRow: originalStartRow,
                    startCol: originalStartCol,
                    width: cols,
                    height: rows
                });

                // Clear the hidden zone
                setMoveSource(null);
            }
            // Handle Click on Selection (Open Menu)
            else if (selectionContentMoveRef.current && !selectionContentMoveRef.current.hasMoved && activeTool === 'selection') {
                // It was a click inside selection
                // Reset move source/buffer (cancel the 'cut' prep)

                setFloatingBuffer(null);
                setMoveSource(null);

                // Show Menu
                if (containerRef.current) {
                    const rect = containerRef.current.getBoundingClientRect();
                    const mouseX = e?.evt?.clientX || e?.clientX;
                    const mouseY = e?.evt?.clientY || e?.clientY;
                    setContextMenuPos({ x: mouseX - rect.left + 5, y: mouseY - rect.top + 5 });
                    setShowContextMenu(true);
                }
            }

            // Clean up refs
            selectionContentMoveRef.current = null;
            selectionBoxMoveRef.current = null;
            setIsDragging(false);
            setIsSelecting(false);
        }
    }, [isSelecting, selectionStart, selectionEnd, gridSize, scale, position]);

    const handleContextMenu = useCallback((e: any) => {
        e.evt.preventDefault();

        // Suppress menu if we just dragged content
        if (selectionContentMoveRef.current && selectionContentMoveRef.current.hasMoved) {
            selectionContentMoveRef.current = null;
            return;
        }
        selectionContentMoveRef.current = null;
        // Also clear box move ref just in case
        selectionBoxMoveRef.current = null;

        // User Request: Shape Tool uses right click to enter edit mode, so suppress standard menu
        if (activeTool === 'shape') return;

        const stage = e.target.getStage();
        const pos = getPointerGridPos(stage);

        if (finalSelection && pos) {
            // Check if inside selection
            if (pos.row >= finalSelection.startRow && pos.row <= finalSelection.endRow &&
                pos.col >= finalSelection.startCol && pos.col <= finalSelection.endCol) {
                // Inside: Show Menu
                if (containerRef.current) {
                    const rect = containerRef.current.getBoundingClientRect();
                    const mouseX = e?.evt?.clientX || e?.clientX;
                    const mouseY = e?.evt?.clientY || e?.clientY;
                    setContextMenuPos({ x: mouseX - rect.left + 5, y: mouseY - rect.top + 5 });
                    setShowContextMenu(true);
                }
            } else {
                // Outside: Clear Selection
                // User Request: Right click empty space must clear selection (remove blue dotted line)
                handleSelectionCancel();

                // If we have clipboard data, we allow showing menu to paste (even after clearing selection)
                if (clipboard) {
                    if (containerRef.current) {
                        const rect = containerRef.current.getBoundingClientRect();
                        const mouseX = e?.evt?.clientX || e?.clientX;
                        const mouseY = e?.evt?.clientY || e?.clientY;
                        setContextMenuPos({ x: mouseX - rect.left + 5, y: mouseY - rect.top + 5 });
                        setShowContextMenu(true);
                    }
                }
            }
        }
    }, [finalSelection, getPointerGridPos]);

    // Selection Operations
    const handleSelectionCopy = useCallback(() => {
        if (!finalSelection) return;
        const { startRow, endRow, startCol, endCol } = finalSelection;
        const copied: GridCellData[][] = [];
        for (let r = startRow; r <= endRow; r++) {
            const row: GridCellData[] = [];
            for (let c = startCol; c <= endCol; c++) {
                row.push({ ...gridData[r][c] });
            }
            copied.push(row);
        }
        setClipboard(copied);
        setShowContextMenu(false);
        // Keep selection active
    }, [finalSelection, gridData]);

    const handleSelectionCut = useCallback(() => {
        if (!finalSelection) return;
        const { startRow, endRow, startCol, endCol } = finalSelection;
        const copied: GridCellData[][] = [];
        const newData = gridData.map(row => [...row]);
        for (let r = startRow; r <= endRow; r++) {
            const row: GridCellData[] = [];
            for (let c = startCol; c <= endCol; c++) {
                row.push({ ...gridData[r][c] });
                newData[r][c] = { color: '#ffffff', symbolId: null };
            }
            copied.push(row);
        }
        setClipboard(copied);
        saveToHistory(newData);
        setGridData(newData);
        setIsDirty(true);
        setShowContextMenu(false);
        // Keep selection active
    }, [finalSelection, gridData, saveToHistory]);

    const handleSelectionErase = useCallback(() => {
        if (!finalSelection) return;
        const { startRow, endRow, startCol, endCol } = finalSelection;
        const newData = gridData.map(row => [...row]);
        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                newData[r][c] = { color: '#ffffff', symbolId: null };
            }
        }
        saveToHistory(newData);
        setGridData(newData);
        setIsDirty(true);
        setShowContextMenu(false);
        // Keep selection active
    }, [finalSelection, gridData, saveToHistory]);

    const handleSelectionFill = useCallback(() => {
        if (!finalSelection) return;
        const { startRow, endRow, startCol, endCol } = finalSelection;
        const newData = gridData.map(row => [...row]);
        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                newData[r][c] = { ...newData[r][c], color: selectedColor };
            }
        }
        saveToHistory(newData);
        setGridData(newData);
        setIsDirty(true);
        setShowContextMenu(false);
        // Keep selection active
    }, [finalSelection, gridData, selectedColor, saveToHistory]);

    const handleSelectionMirrorH = useCallback(() => {
        if (!finalSelection) return;
        const { startRow, endRow, startCol, endCol } = finalSelection;
        const newData = gridData.map(row => [...row]);
        const width = endCol - startCol + 1;
        for (let r = startRow; r <= endRow; r++) {
            for (let c = 0; c < Math.floor(width / 2); c++) {
                const leftCol = startCol + c;
                const rightCol = endCol - c;
                const temp = newData[r][leftCol];
                newData[r][leftCol] = newData[r][rightCol];
                newData[r][rightCol] = temp;
            }
        }
        saveToHistory(newData);
        setGridData(newData);
        setIsDirty(true);
        setShowContextMenu(false);
        // Keep selection active
    }, [finalSelection, gridData, saveToHistory]);

    const handleSelectionMirrorV = useCallback(() => {
        if (!finalSelection) return;
        const { startRow, endRow, startCol, endCol } = finalSelection;
        const newData = gridData.map(row => [...row]);
        const height = endRow - startRow + 1;
        for (let r = 0; r < Math.floor(height / 2); r++) {
            for (let c = startCol; c <= endCol; c++) {
                const topRow = startRow + r;
                const bottomRow = endRow - r;
                const temp = newData[topRow][c];
                newData[topRow][c] = newData[bottomRow][c];
                newData[bottomRow][c] = temp;
            }
        }
        saveToHistory(newData);
        setGridData(newData);
        setIsDirty(true);
        setShowContextMenu(false);
        // Keep selection active
    }, [finalSelection, gridData, saveToHistory]);

    const enterRotationMode = useCallback(() => {
        if (!finalSelection) return;
        const { startRow, endRow, startCol, endCol } = finalSelection;
        const buffer: GridCellData[][] = [];
        for (let r = startRow; r <= endRow; r++) {
            const row: GridCellData[] = [];
            for (let c = startCol; c <= endCol; c++) {
                row.push({ ...gridData[r][c] });
            }
            buffer.push(row);
        }

        const height = endRow - startRow + 1;
        const width = endCol - startCol + 1;
        const pivotRow = startRow + (height / 2);
        const pivotCol = startCol + (width / 2);

        setFloatingBuffer({ data: buffer, startRow, startCol, pivotRow, pivotCol });
        setIsRotationMode(true);
        setShowContextMenu(false);
    }, [finalSelection, gridData]);

    const commitRotation = useCallback((clearZone?: { startRow: number, startCol: number, width: number, height: number }) => {
        if (!floatingBuffer) {
            setIsRotationMode(false);
            return;
        }

        const { data, startRow, startCol } = floatingBuffer;
        // Check for undefined pivot in runtime object (fallback to center)
        const pivotRow = (floatingBuffer as any).pivotRow ?? (startRow + data.length / 2);
        const pivotCol = (floatingBuffer as any).pivotCol ?? (startCol + data[0].length / 2);

        const newData = gridData.map(row => [...row]);

        // 1. Clear Original Zone if requested (Move operation)
        if (clearZone) {
            for (let r = 0; r < clearZone.height; r++) {
                for (let c = 0; c < clearZone.width; c++) {
                    const tr = clearZone.startRow + r;
                    const tc = clearZone.startCol + c;
                    if (tr < gridSize.rows && tc < gridSize.cols) {
                        newData[tr][tc] = { color: '#ffffff', symbolId: null };
                    }
                }
            }
        }

        // 2. Write Data
        if (Math.abs(shapeRotation) > 0.001) {
            // Rotated Commit (Resampling)
            const bufH = data.length;
            const bufW = data[0].length;
            const angle = -shapeRotation; // Inverse rotation to find source
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            // Bounding box optimization could go here, but full grid is safe/fast enough
            for (let r = 0; r < gridSize.rows; r++) {
                for (let c = 0; c < gridSize.cols; c++) {
                    // Vector from Pivot
                    const dy = r - pivotRow;
                    const dx = c - pivotCol;

                    // Inverse Rotate
                    const srcDx = dx * cos - dy * sin;
                    const srcDy = dx * sin + dy * cos;

                    // Map to Buffer Index
                    const br = Math.round((pivotRow + srcDy) - startRow);
                    const bc = Math.round((pivotCol + srcDx) - startCol);

                    if (br >= 0 && br < bufH && bc >= 0 && bc < bufW) {
                        // Copy pixel
                        newData[r][c] = { ...data[br][bc] };
                    }
                }
            }
        } else {
            // Standard Commit (1:1)
            for (let r = 0; r < data.length; r++) {
                for (let c = 0; c < data[0].length; c++) {
                    const targetRow = startRow + r;
                    const targetCol = startCol + c;
                    if (targetRow < gridSize.rows && targetCol < gridSize.cols) {
                        newData[targetRow][targetCol] = data[r][c];
                    }
                }
            }
        }

        saveToHistory(newData);
        setGridData(newData);
        setFloatingBuffer(null);
        setShapeRotation(0);
        setIsRotationMode(false);
    }, [floatingBuffer, gridData, gridSize, saveToHistory, shapeRotation]);

    const handleSelectionRotateRight = useCallback(() => {
        if (!finalSelection || !floatingBuffer) return;

        const { data, pivotRow, pivotCol } = floatingBuffer;
        const height = data.length;
        const width = data[0].length;

        const newHeight = width;
        const newWidth = height;

        // Use fixed pivot to calculate new TopLeft
        let newStartRow = Math.floor(pivotRow - (newHeight / 2));
        let newStartCol = Math.floor(pivotCol - (newWidth / 2));

        // Clamp
        if (newStartRow < 0) newStartRow = 0;
        if (newStartCol < 0) newStartCol = 0;
        if (newStartRow + newHeight > gridSize.rows) newStartRow = gridSize.rows - newHeight;
        if (newStartCol + newWidth > gridSize.cols) newStartCol = gridSize.cols - newWidth;

        // Rotate Data
        const newData = Array(newHeight).fill(null).map(() => Array(newWidth).fill(null));

        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                // Rotate Right: old(r,c) -> new(c, height-1-r)
                newData[c][height - 1 - r] = data[r][c];
            }
        }

        setFloatingBuffer({ data: newData, startRow: newStartRow, startCol: newStartCol, pivotRow, pivotCol });

        const newSelection = {
            startRow: newStartRow,
            endRow: newStartRow + newHeight - 1,
            startCol: newStartCol,
            endCol: newStartCol + newWidth - 1
        };

        setFinalSelection(newSelection);
        setSelectionStart({ row: newSelection.startRow, col: newSelection.startCol });
        setSelectionEnd({ row: newSelection.endRow, col: newSelection.endCol });

        setShowContextMenu(false);
    }, [finalSelection, floatingBuffer, gridSize]);

    const handleSelectionRotateLeft = useCallback(() => {
        if (!finalSelection || !floatingBuffer) return;

        const { data, pivotRow, pivotCol } = floatingBuffer;
        const height = data.length;
        const width = data[0].length;

        const newHeight = width;
        const newWidth = height;

        let newStartRow = Math.floor(pivotRow - (newHeight / 2));
        let newStartCol = Math.floor(pivotCol - (newWidth / 2));

        // Clamp
        if (newStartRow < 0) newStartRow = 0;
        if (newStartCol < 0) newStartCol = 0;
        if (newStartRow + newHeight > gridSize.rows) newStartRow = gridSize.rows - newHeight;
        if (newStartCol + newWidth > gridSize.cols) newStartCol = gridSize.cols - newWidth;

        // Rotate Data
        const newData = Array(newHeight).fill(null).map(() => Array(newWidth).fill(null));

        for (let r = 0; r < height; r++) {
            for (let c = 0; c < width; c++) {
                // Rotate Left: old(r,c) -> new(width-1-c, r)
                newData[width - 1 - c][r] = data[r][c];
            }
        }

        setFloatingBuffer({ data: newData, startRow: newStartRow, startCol: newStartCol, pivotRow, pivotCol });

        const newSelection = {
            startRow: newStartRow,
            endRow: newStartRow + newHeight - 1,
            startCol: newStartCol,
            endCol: newStartCol + newWidth - 1
        };

        setFinalSelection(newSelection);
        setSelectionStart({ row: newSelection.startRow, col: newSelection.startCol });
        setSelectionEnd({ row: newSelection.endRow, col: newSelection.endCol });

        setShowContextMenu(false);
    }, [finalSelection, floatingBuffer, gridSize]);

    const handleSelectionCancel = useCallback(() => {
        setShowContextMenu(false);
        setFinalSelection(null);
        setSelectionStart(null);
        setSelectionEnd(null);
        setFloatingBuffer(null);
        setIsRotationMode(false);
    }, []);

    // Clear selection when switching away from selection tool
    useEffect(() => {
        if (activeTool !== 'selection') {
            handleSelectionCancel();
        }
    }, [activeTool, handleSelectionCancel]);

    const rasterizeShape = (
        shape: 'circle' | 'square' | 'triangle' | 'star' | 'heart',
        mode: 'outline' | 'fill',
        center: { row: number; col: number },
        dimensions: { width: number; height: number },
        rotation: number
    ) => {
        const result: { row: number; col: number }[] = [];
        const { width, height } = dimensions;
        const centerX = center.col;
        const centerY = center.row;
        const radius = Math.sqrt(width * width + height * height) / 2;

        const sR1 = Math.floor(centerY - radius - 1);
        const sR2 = Math.ceil(centerY + radius + 1);
        const sC1 = Math.floor(centerX - radius - 1);
        const sC2 = Math.ceil(centerX + radius + 1);

        for (let r = sR1; r <= sR2; r++) {
            for (let c = sC1; c <= sC2; c++) {
                const dx = c - centerX;
                const dy = r - centerY;

                // Fix precision for 90-degree snaps to avoid artifacts
                let cr = Math.cos(-rotation);
                let sr = Math.sin(-rotation);
                if (Math.abs(cr) < 1e-9) cr = 0;
                if (Math.abs(sr) < 1e-9) sr = 0;
                if (Math.abs(Math.abs(cr) - 1) < 1e-9) cr = Math.sign(cr);
                if (Math.abs(Math.abs(sr) - 1) < 1e-9) sr = Math.sign(sr);

                // Rotate back to local space
                const rx = dx * cr - dy * sr;
                const ry = dx * sr + dy * cr;

                let isInside = false;
                let isBorder = false;

                if (shape === 'square') {
                    const halfW = width / 2;
                    const halfH = height / 2;
                    isInside = Math.abs(rx) <= halfW && Math.abs(ry) <= halfH;
                    isBorder = isInside && (Math.abs(Math.abs(rx) - halfW) < 0.8 || Math.abs(Math.abs(ry) - halfH) < 0.8);
                } else if (shape === 'circle') {
                    const normX = rx / (width / 2 || 1);
                    const normY = ry / (height / 2 || 1);
                    const distSq = normX * normX + normY * normY;
                    isInside = distSq <= 1.0;
                    isBorder = distSq <= 1.05 && distSq >= 0.75;
                } else if (shape === 'triangle') {
                    const normY = (ry + height / 2) / height;
                    const rowWidth = width * normY;
                    isInside = ry >= -height / 2 && ry <= height / 2 && Math.abs(rx) <= rowWidth / 2;
                    isBorder = isInside && (ry >= height / 2 - 0.8 || Math.abs(Math.abs(rx) - rowWidth / 2) < 0.8);
                } else if (shape === 'star') {
                    const dist = Math.sqrt(rx * rx + ry * ry);
                    const angle = Math.atan2(ry, rx) - Math.PI / 2;
                    const R = radius;
                    const rInner = R * 0.45;
                    const modAngle = ((angle % (Math.PI * 2 / 5)) + (Math.PI * 2 / 5)) % (Math.PI * 2 / 5);
                    const localAngle = Math.abs(modAngle - Math.PI / 5);
                    const spike = Math.abs(Math.sin(angle * 2.5));
                    const threshold = rInner + (R - rInner) * Math.pow(spike, 1.5);
                    isInside = dist <= threshold + 0.3;
                    isBorder = isInside && dist >= threshold - 0.7;
                } else if (shape === 'heart') {
                    // Improved Heart Formula
                    const nx = rx / (width / 2) * 1.3;
                    const ny = -(ry + height * 0.1) / (height / 2) * 1.3;
                    const a = nx * nx + ny * ny - 1;
                    const val = a * a * a - nx * nx * ny * ny * ny;
                    isInside = val <= 0;
                    isBorder = isInside && val >= -0.2;
                }

                if (isInside && (mode === 'fill' || isBorder)) {
                    result.push({ row: r, col: c });
                }
            }
        }
        return result;
    };

    const handleShapeConfirm = useCallback(() => {
        if (isRotationMode) {
            commitRotation();
            setFinalSelection(null);
            setSelectionStart(null);
            setSelectionEnd(null);
            return;
        }

        const target = finalSelection || (selectionStart && selectionEnd ? {
            startRow: Math.min(selectionStart.row, selectionEnd.row),
            endRow: Math.max(selectionStart.row, selectionEnd.row),
            startCol: Math.min(selectionStart.col, selectionEnd.col),
            endCol: Math.max(selectionStart.col, selectionEnd.col)
        } : null);

        if (target && selectionStart && selectionEnd) {
            const center = {
                row: (Math.min(selectionStart.row, selectionEnd.row) + Math.max(selectionStart.row, selectionEnd.row)) / 2,
                col: (Math.min(selectionStart.col, selectionEnd.col) + Math.max(selectionStart.col, selectionEnd.col)) / 2
            };
            const dims = {
                width: Math.abs(selectionEnd.col - selectionStart.col) + 1,
                height: Math.abs(selectionEnd.row - selectionStart.row) + 1
            };
            const cells = rasterizeShape(activeShape, shapeMode, center, dims, shapeRotation);

            if (cells.length > 0) {
                const newData = gridData.map(row => [...row]);
                cells.forEach(({ row, col }) => {
                    if (row >= 0 && row < gridSize.rows && col >= 0 && col < gridSize.cols) {
                        const prevCell = newData[row][col];
                        let finalColor = prevCell.color;
                        let finalSymbol = prevCell.symbolId;

                        if (shapeApplyTarget === 'both') {
                            finalColor = selectedColor;
                            finalSymbol = selectedSymbol;
                        } else if (shapeApplyTarget === 'color') {
                            finalColor = selectedColor;
                        } else if (shapeApplyTarget === 'symbol') {
                            finalSymbol = selectedSymbol;
                        }

                        newData[row][col] = {
                            color: finalColor,
                            symbolId: finalSymbol
                        };
                    }
                });
                setGridData(newData);
                saveToHistory(newData);
                setIsDirty(true);
            }
        }
        setShapePreview(null);
        setSelectionStart(null);
        setSelectionEnd(null);
        setFinalSelection(null);
        setIsDragging(false);
        setShapeRotation(0);

        // Reset to default state so next shape is 'clean'
        // User requested Color to PERSIST ('follow previous shape'), but Symbol to RESET.
        setSelectedSymbol('knit');
    }, [finalSelection, selectionStart, selectionEnd, activeShape, shapeMode, gridData, gridSize, selectedColor, selectedSymbol, saveToHistory, shapeRotation]);

    const handleShapeCancel = useCallback(() => {
        setShapePreview(null);
        setSelectionStart(null);
        setSelectionEnd(null);
        setFinalSelection(null);
        setIsDragging(false);
        setShapeRotation(0);
    }, []);

    const previewCells = useMemo(() => {
        if (!shapePreview || !selectionStart || !selectionEnd || activeTool !== 'shape') return [];
        const center = {
            row: (selectionStart.row + selectionEnd.row) / 2,
            col: (selectionStart.col + selectionEnd.col) / 2
        };
        const dims = {
            width: Math.abs(selectionEnd.col - selectionStart.col) + 1,
            height: Math.abs(selectionEnd.row - selectionStart.row) + 1
        };
        return rasterizeShape(activeShape, shapeMode, center, dims, shapeRotation);
    }, [shapePreview, selectionStart, selectionEnd, activeTool, activeShape, shapeMode, shapeRotation]);





    const handleGlobalMouseUp = (e: MouseEvent) => {
        handleTypeRef.current = null;
        lastPointerPosRef.current = null;
        if (rotationDragRef.current?.isActive) {
            rotationDragRef.current = null;
            // Keep rotation mode active as per user request
        }

        // Handle Shape Tool: Enter Edit Mode on Right Click
        if (activeTool === 'shape' && (selectionStart && selectionEnd) && !finalSelection && e.button === 2) {
            setFinalSelection({
                startRow: Math.min(selectionStart.row, selectionEnd.row),
                endRow: Math.max(selectionStart.row, selectionEnd.row),
                startCol: Math.min(selectionStart.col, selectionEnd.col),
                endCol: Math.max(selectionStart.col, selectionEnd.col)
            });
            setIsShapeMenuOpen(true);
            return;
        }

        // End Content Move (Right Click)
        if (selectionContentMoveRef.current && e.button === 2) {
            setMoveSource(null); // Clear visual hide
            if (selectionContentMoveRef.current.hasMoved) {
                // It was a move! Calculate clear zone.
                // It was a move! Calculate clear zone.
                const { originalStartRow, originalStartCol, initialData } = selectionContentMoveRef.current;
                const clearZone = {
                    startRow: originalStartRow,
                    startCol: originalStartCol,
                    width: initialData[0].length,
                    height: initialData.length
                };
                if (floatingBuffer) commitRotation(clearZone);
            } else {
                // Clicked but didn't move -> Show context menu if not panning
                if (isSpacePressed) return;
                const stage = stageRef.current;
                const pointerPos = stage.getPointerPosition();
                if (pointerPos) {
                    setContextMenuPos({ x: pointerPos.x, y: pointerPos.y });
                    setShowContextMenu(true);
                }
            }
            selectionContentMoveRef.current = null;
            return;
        }



        // End Box Move (Left Click)
        if (selectionBoxMoveRef.current && e.button === 0) {
            selectionBoxMoveRef.current = null;
        }

        if (isDragging || isSelecting) {
            // Left Click up (button 0 or undefined for touch/standard)
            if (e.button === 0) {
                setIsDragging(false);
                // Just end dragging, don't enter edit mode automatically
                return;
            }

            handleMouseUp(e);
        }
    };

    useEffect(() => {
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => {
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [
        isDragging, isSelecting, handleMouseUp, isRotationMode, finalSelection,
        handleSelectionRotateRight, handleSelectionRotateLeft, activeTool, selectionStart,
        selectionEnd, gridData, gridSize, selectedColor, selectedSymbol, activeShape,
        shapeMode, floatingBuffer, commitRotation
    ]);

    const handleRotationDragStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (!finalSelection || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        // Selection Center in Screen Coords (approximate center of grid cells)
        const cellW = 30 * scale;
        const startX = finalSelection.startCol * cellW + position.x;
        const endX = (finalSelection.endCol + 1) * cellW + position.x;
        const startY = finalSelection.startRow * cellW + position.y;
        const endY = (finalSelection.endRow + 1) * cellW + position.y;

        const gridCenterX = (startX + endX) / 2;
        const gridCenterY = (startY + endY) / 2;

        const centerX = rect.left + gridCenterX;
        const centerY = rect.top + gridCenterY;

        rotationDragRef.current = {
            isActive: true,
            centerX,
            centerY,
            startAngle: Math.atan2(e.clientY - centerY, e.clientX - centerX),
            accumulatedAngle: 0
        };
    };

    const handleWheel = (e: any) => {
        e.evt.preventDefault();
        const stage = e.target.getStage();
        if (!stage) return;

        const scaleBy = 1.1;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
        if (newScale < 0.1 || newScale > 5) return;

        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };

        setScale(newScale);
        setPosition(newPos);
    };

    const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    };

    const getCenter = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
        return {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2,
        };
    };


    const handleTouchStart = (e: any) => {
        // Multi-touch: Zoom
        if (e.evt.touches.length === 2) {
            e.evt.preventDefault();
            const touch1 = e.evt.touches[0];
            const touch2 = e.evt.touches[1];

            if (touch1 && touch2) {
                const dist = getDistance(
                    { x: touch1.clientX, y: touch1.clientY },
                    { x: touch2.clientX, y: touch2.clientY }
                );
                lastDistRef.current = dist;
            }
        }
        // Single-touch: Paint/Select
        else if (e.evt.touches.length === 1) {
            // Check if we started on the stage - prevent scrolling if so
            const stage = e.target.getStage();
            if (activeTool !== 'move' && !isSpacePressed) {
                // Determine if we should prevent default to enable painting instead of scrolling
                // For a drawing app, preventing scrolling on canvas touch is standard.
                // However, maybe user wants to scroll?
                // Usually in "Move" tool we pan, in "Paint" tool we paint.
                // We'll prevent default to allow immediate feedback.
                // Actually, let's treat it exactly like MouseDown
                handleMouseDown(e);
            }
        }
    };

    const handleTouchMove = (e: any) => {
        // Multi-touch: Zoom
        if (e.evt.touches.length === 2) {
            e.evt.preventDefault();
            const touch1 = e.evt.touches[0];
            const touch2 = e.evt.touches[1];
            const stage = e.target.getStage();

            if (touch1 && touch2 && stage) {
                const dist = getDistance(
                    { x: touch1.clientX, y: touch1.clientY },
                    { x: touch2.clientX, y: touch2.clientY }
                );

                if (!lastDistRef.current) {
                    lastDistRef.current = dist;
                    return;
                }

                const oldScale = stage.scaleX();
                const center = getCenter(
                    { x: touch1.clientX, y: touch1.clientY },
                    { x: touch2.clientX, y: touch2.clientY }
                );

                const stageBox = stage.container().getBoundingClientRect();
                const touchPos = {
                    x: center.x - stageBox.left,
                    y: center.y - stageBox.top,
                };

                const mousePointTo = {
                    x: (touchPos.x - stage.x()) / oldScale,
                    y: (touchPos.y - stage.y()) / oldScale,
                };

                const newScale = oldScale * (dist / lastDistRef.current);
                if (newScale < 0.1 || newScale > 5) return;

                const newPos = {
                    x: touchPos.x - mousePointTo.x * newScale,
                    y: touchPos.y - mousePointTo.y * newScale,
                };

                setScale(newScale);
                setPosition(newPos);
                lastDistRef.current = dist;
            }
        }
        // Single-touch: Paint
        else if (e.evt.touches.length === 1) {
            if (activeTool !== 'move' && !isSpacePressed) {
                e.evt.preventDefault(); // Stop scrolling while painting
                handleMouseMove(e);
            }
        }
    };

    const handleTouchEnd = () => {
        lastDistRef.current = 0;
        lastPointerPosRef.current = null;
        handleMouseUp();
    };




    const handleSelectionPaste = useCallback(() => {
        if (!clipboard || !contextMenuPos) return;

        // Paste at context menu position
        const x = (contextMenuPos.x - position.x) / scale;
        const y = (contextMenuPos.y - position.y) / scale;

        const startCol = Math.floor(x / 30);
        const startRow = Math.floor(y / 30);

        const newData = gridData.map(r => [...r]);
        const rows = clipboard.length;
        const cols = clipboard[0].length;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const targetRow = startRow + r;
                const targetCol = startCol + c;
                if (targetRow < gridSize.rows && targetCol < gridSize.cols) {
                    newData[targetRow][targetCol] = clipboard[r][c];
                }
            }
        }
        setGridData(newData);
        saveToHistory(newData);
        setIsDirty(true);
        setShowContextMenu(false);

        // Select the pasted area
        const newSelection = {
            startRow,
            endRow: Math.min(gridSize.rows - 1, startRow + rows - 1),
            startCol,
            endCol: Math.min(gridSize.cols - 1, startCol + cols - 1)
        };
        setFinalSelection(newSelection);
        setSelectionStart({ row: newSelection.startRow, col: newSelection.startCol });
        setSelectionEnd({ row: newSelection.endRow, col: newSelection.endCol });

    }, [clipboard, contextMenuPos, gridSize, gridData, position, scale, saveToHistory]);

    const handleDownload = async (format: 'png' | 'jpg' | 'pdf') => {
        if (!stageRef.current) return;

        try {
            await deductCredits(user?.id!, 50, `Pattern Export (${format.toUpperCase()})`);
        } catch (error) {
            console.error('Download credit error:', error);
            setCustomAlert({
                title: locale === 'ko' ? '다운로드 실패' : 'Download Failed',
                message: locale === 'ko' ? '크레딧이 부족합니다.' : 'Insufficient credits.',
                onConfirm: () => {}
            });
            return;
        }

        setShowExportMenu(false);

        const stage = stageRef.current;
        const oldScale = stage.scale();
        const oldPos = stage.position();

        const fullWidth = gridSize.cols * CELL_SIZE;
        const fullHeight = gridSize.rows * CELL_SIZE;
        const PIXEL_RATIO = 2; // Fixed resolution

        // 1. Reset View for Capture
        stage.scale({ x: 1, y: 1 });
        stage.position({ x: 0, y: 0 });
        stage.batchDraw();

        // 2. Capture Grid Only
        const stageUri = stage.toDataURL({
            pixelRatio: PIXEL_RATIO,
            x: 0,
            y: 0,
            width: fullWidth,
            height: fullHeight,
            mimeType: 'image/png'
        });

        // 3. Restore View
        stage.scale(oldScale);
        stage.position(oldPos);
        stage.batchDraw();

        const stageImg = new Image();
        stageImg.src = stageUri;
        await new Promise(resolve => { stageImg.onload = resolve; });

        // ---------------------------------------------------------
        // New: Add Rulers (Row/Col Numbers) to the Image
        // ---------------------------------------------------------

        // Settings for Ruler
        const RULER_SIZE = 100;   // Increased for 5x font
        const FONT_SIZE = 50;    // Increased substantially (~5x original 12px)
        const FONT_SIZE_X = 26;  // Smaller font size for horizontal numbers to prevent overlapping
        const SCALED_CELL = CELL_SIZE * PIXEL_RATIO; // 60px

        // Create a canvas that wraps the grid with rulers
        const rulerCanvas = document.createElement('canvas');
        rulerCanvas.width = stageImg.width + RULER_SIZE; // + Right Ruler
        rulerCanvas.height = stageImg.height + RULER_SIZE; // + Bottom Ruler

        const rCtx = rulerCanvas.getContext('2d');
        if (!rCtx) return;

        // Fill White
        rCtx.fillStyle = '#ffffff';
        rCtx.fillRect(0, 0, rulerCanvas.width, rulerCanvas.height);

        // Draw Grid Image (Top-Left aligned)
        rCtx.drawImage(stageImg, 0, 0);

        // Draw Col Numbers (Bottom) - X Axis
        rCtx.font = `bold ${FONT_SIZE_X}px sans-serif`;
        rCtx.fillStyle = '#666';
        rCtx.textAlign = 'center';
        rCtx.textBaseline = 'top';

        for (let c = 0; c < gridSize.cols; c++) {
            const num = c + 1;
            // Draw every 5 if crowded (assuming 60px cell width)
            if (gridSize.cols > 40 && num % 5 !== 0) continue;

            const x = (c * SCALED_CELL) + (SCALED_CELL / 2);
            const y = stageImg.height + 25;
            rCtx.fillText(num.toString(), x, y);
        }

        // Draw Row Numbers (Right) - Y Axis
        rCtx.font = `bold ${FONT_SIZE_X}px sans-serif`;
        rCtx.textAlign = 'left';
        rCtx.textBaseline = 'middle';

        for (let r = 0; r < gridSize.rows; r++) {
            const displayNum = r + 1;
            if (gridSize.rows > 40 && displayNum % 5 !== 0) continue;

            const x = stageImg.width + 25;
            const y = (r * SCALED_CELL) + (SCALED_CELL / 2);
            rCtx.fillText(displayNum.toString(), x, y);
        }

        // Use this enhanced image for export validation
        const finalPatternImage = rulerCanvas;

        // ---------------------------------------------------------
        // Legend Generation (Enhanced Size)
        // ---------------------------------------------------------
        const createLegendCanvas = () => {
            // Scan gridData for used symbols and colors
            const usedSymbolIds = new Set<string>();
            const usedColorsSet = new Set<string>();

            gridData.forEach(row => {
                row.forEach(cell => {
                    if (cell.symbolId) {
                        usedSymbolIds.add(cell.symbolId);
                    }
                    if (cell.color && cell.color.toLowerCase() !== '#ffffff') {
                        usedColorsSet.add(cell.color.toLowerCase());
                    }
                });
            });

            const symbolsUsed = allSymbols.filter(sym => usedSymbolIds.has(sym.id));
            const colorsUsed = Array.from(usedColorsSet);

            const LEGEND_PADDING = 50;
            const ITEM_HEIGHT = 60;
            const colWidth = 380; // Tight width per column
            const legendW = Math.max(finalPatternImage.width, 600);
            
            // Calculate how many columns can fit inside the legend width
            const COLS = Math.max(1, Math.floor((legendW - (LEGEND_PADDING * 2)) / colWidth));
            
            const symbolRows = Math.ceil(symbolsUsed.length / COLS);
            const colorRows = Math.ceil(colorsUsed.length / COLS);
            
            // Calculate height dynamically
            let totalHeightNeeded = 50; // top padding
            
            const symbolTitleHeight = symbolsUsed.length > 0 ? 80 : 0;
            const symbolItemsHeight = symbolRows * ITEM_HEIGHT;
            
            const colorTitleHeight = colorsUsed.length > 0 ? 80 : 0;
            const colorItemsHeight = colorRows * ITEM_HEIGHT;
            
            const separatorHeight = (symbolsUsed.length > 0 && colorsUsed.length > 0) ? 40 : 0;
            
            const META_HEIGHT = 160;
            const legendH = totalHeightNeeded + symbolTitleHeight + symbolItemsHeight + separatorHeight + colorTitleHeight + colorItemsHeight + 50 + META_HEIGHT;

            const lCanvas = document.createElement('canvas');
            lCanvas.width = legendW;
            lCanvas.height = legendH;
            const ctx = lCanvas.getContext('2d');
            if (!ctx) return null;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, legendW, legendH);

            let drawY = 50;

            // 1. Draw Symbols Section
            if (symbolsUsed.length > 0) {
                ctx.fillStyle = '#333333';
                ctx.font = 'bold 36px sans-serif';
                ctx.fillText(tEditor('legend') || 'Stitch Key', LEGEND_PADDING, drawY);
                drawY += 60;

                symbolsUsed.forEach((sym, i) => {
                    const col = i % COLS;
                    const row = Math.floor(i / COLS);
                    const x = LEGEND_PADDING + (col * colWidth);
                    const y = drawY + (row * ITEM_HEIGHT);

                    // Symbol
                    ctx.fillStyle = '#000000';
                    ctx.font = 'bold 36px monospace';
                    ctx.fillText(sym.label, x, y);

                    // Name
                    ctx.fillStyle = '#444444';
                    ctx.font = '28px sans-serif';
                    ctx.fillText(sym.name || '', x + 60, y);
                });

                drawY += (symbolRows * ITEM_HEIGHT) + 40;
            }

            // 2. Draw Colors Section
            if (colorsUsed.length > 0) {
                // Add a small divider if symbols were also drawn
                if (symbolsUsed.length > 0) {
                    ctx.strokeStyle = '#f3f4f6';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(LEGEND_PADDING, drawY - 20);
                    ctx.lineTo(legendW - LEGEND_PADDING, drawY - 20);
                    ctx.stroke();
                }

                ctx.fillStyle = '#333333';
                ctx.font = 'bold 36px sans-serif';
                ctx.fillText(locale === 'ko' ? '사용된 색상' : 'Colors Used', LEGEND_PADDING, drawY);
                drawY += 60;

                colorsUsed.forEach((colorHex, i) => {
                    const col = i % COLS;
                    const row = Math.floor(i / COLS);
                    const x = LEGEND_PADDING + (col * colWidth);
                    const y = drawY + (row * ITEM_HEIGHT);

                    // Draw Color Block
                    ctx.fillStyle = colorHex;
                    ctx.beginPath();
                    if (ctx.roundRect) {
                        ctx.roundRect(x, y - 28, 32, 32, 6);
                    } else {
                        ctx.rect(x, y - 28, 32, 32);
                    }
                    ctx.fill();
                    
                    // Light border for visibility of light colors
                    ctx.strokeStyle = '#e5e7eb';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Draw Color Hex Name/Label
                    ctx.fillStyle = '#444444';
                    ctx.font = '28px sans-serif';
                    ctx.fillText(colorHex.toUpperCase(), x + 60, y);
                });

                drawY += (colorRows * ITEM_HEIGHT) + 40;
            }

            // 3. Draw Metadata Block
            const metaY = drawY + 10;

            // Separator Line
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(LEGEND_PADDING, metaY - 30);
            ctx.lineTo(legendW - LEGEND_PADDING, metaY - 30);
            ctx.stroke();

            ctx.fillStyle = '#666666';
            ctx.font = 'bold 30px sans-serif';
            ctx.fillText('Project Info', LEGEND_PADDING, metaY + 10);

            ctx.font = '24px sans-serif';
            const dateStr = new Date().toLocaleDateString();
            ctx.fillText(`${tEditor('export.title')}: ${projectTitle}`, LEGEND_PADDING, metaY + 50);
            ctx.fillText(`Grid Size: ${gridSize.cols}W x ${gridSize.rows}H`, LEGEND_PADDING, metaY + 90);
            ctx.fillText(`Date: ${dateStr}`, LEGEND_PADDING, metaY + 130);

            return lCanvas;
        };



        const filename = projectTitle.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'pattern';

        if (format === 'pdf') {
            // A4 Landscape: 841.89 x 595.28 pt
            const A4_WIDTH = 841.89;
            const A4_HEIGHT = 595.28;
            const MARGIN = 30;
            const CONTENT_W = A4_WIDTH - (MARGIN * 2);
            const CONTENT_H = A4_HEIGHT - (MARGIN * 2);

            // Reduced Scale for "More on page"
            // Target: 4mm cell size. 
            // 4mm = 11.34pt. Source Cell = 60px. Scale = 11.34/60 = 0.189
            const PDF_SCALE = 0.189;

            const printW = finalPatternImage.width * PDF_SCALE;
            const printH = finalPatternImage.height * PDF_SCALE;

            const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

            const cols = Math.ceil(printW / CONTENT_W);
            const rows = Math.ceil(printH / CONTENT_H);
            const totalGridPages = cols * rows;

            let pageCount = 0;

            // Spiral Order Helper
            const getSpiralOrder = (totalRows: number, totalCols: number) => {
                const result: { r: number, c: number }[] = [];
                let top = 0, bottom = totalRows - 1, left = 0, right = totalCols - 1;
                let dir = 0; // 0: Right, 1: Down, 2: Left, 3: Up

                while (top <= bottom && left <= right) {
                    if (dir === 0) { // Right
                        for (let i = left; i <= right; i++) result.push({ r: top, c: i });
                        top++;
                    } else if (dir === 1) { // Down
                        for (let i = top; i <= bottom; i++) result.push({ r: i, c: right });
                        right--;
                    } else if (dir === 2) { // Left
                        for (let i = right; i >= left; i--) result.push({ r: bottom, c: i });
                        bottom--;
                    } else if (dir === 3) { // Up
                        for (let i = bottom; i >= top; i--) result.push({ r: i, c: left });
                        left++;
                    }
                    dir = (dir + 1) % 4;
                }
                return result;
            };

            const pageOrder = getSpiralOrder(rows, cols);
            pageCount = 0;

            // Tile Grid in Spiral Order
            for (const { r, c } of pageOrder) {
                pageCount++;
                if (pageCount > 1) pdf.addPage('a4', 'landscape');

                const sX = (c * CONTENT_W) / PDF_SCALE;
                const sY = (r * CONTENT_H) / PDF_SCALE;
                const sW = Math.min(CONTENT_W / PDF_SCALE, finalPatternImage.width - sX);
                const sH = Math.min(CONTENT_H / PDF_SCALE, finalPatternImage.height - sY);

                // Tile Canvas
                const tileCanvas = document.createElement('canvas');
                tileCanvas.width = sW;
                tileCanvas.height = sH;
                const tileCtx = tileCanvas.getContext('2d');
                if (tileCtx) {
                    tileCtx.fillStyle = '#ffffff';
                    tileCtx.fillRect(0, 0, sW, sH);
                    tileCtx.drawImage(finalPatternImage, sX, sY, sW, sH, 0, 0, sW, sH);
                    const tileData = tileCanvas.toDataURL('image/jpeg', 0.9);

                    let pX = MARGIN;
                    let pY = MARGIN;

                    if (totalGridPages === 1) {
                        pX = (A4_WIDTH - (sW * PDF_SCALE)) / 2;
                        pY = (A4_HEIGHT - (sH * PDF_SCALE)) / 2;
                    }

                    pdf.addImage(tileData, 'JPEG', pX, pY, sW * PDF_SCALE, sH * PDF_SCALE);

                    // Header info on every page
                    pdf.setFontSize(9);
                    pdf.setTextColor(150);
                    // Add Row/Col info for manual assembly reference
                    pdf.text(`${projectTitle} - Row Section ${r + 1}, Col Section ${c + 1}`, MARGIN, MARGIN - 15);

                    pdf.setFontSize(10);
                    pdf.setTextColor(100);
                    pdf.text(`Page ${pageCount} / ${totalGridPages + 1} - ${projectTitle}`, A4_WIDTH / 2, A4_HEIGHT - 25, { align: 'center' });

                    // Watermark
                    pdf.setFontSize(9);
                    pdf.setTextColor(150);
                    pdf.text('Created with byKnit Platform', A4_WIDTH / 2, A4_HEIGHT - 12, { align: 'center' });
                }
            }

            // Legend Page
            const legendCanvas = createLegendCanvas();
            if (legendCanvas) {
                pdf.addPage('a4', 'landscape');
                const lData = legendCanvas.toDataURL('image/jpeg', 0.9);

                let lWidth = legendCanvas.width * 0.45; // Readable Scale
                let lHeight = legendCanvas.height * 0.45;

                if (lWidth > CONTENT_W) {
                    const ratio = CONTENT_W / lWidth;
                    lWidth = CONTENT_W;
                    lHeight = lHeight * ratio;
                }

                // Center Legend on Landscape Page
                const lX = (A4_WIDTH - lWidth) / 2;

                pdf.addImage(lData, 'JPEG', lX, MARGIN, lWidth, lHeight);
                pdf.text(`Page ${pageCount + 1} - Legend & Info`, A4_WIDTH / 2, A4_HEIGHT - 25, { align: 'center' });

                // Watermark
                pdf.setFontSize(9);
                pdf.setTextColor(150);
                pdf.text('Created with byKnit Platform', A4_WIDTH / 2, A4_HEIGHT - 12, { align: 'center' });
            }

            pdf.save(`${filename}.pdf`);

        } else {
            // PNG/JPG Export
            const legendCanvas = createLegendCanvas();
            if (!legendCanvas) return;

            const finalCanvas = document.createElement('canvas');

            finalCanvas.width = Math.max(finalPatternImage.width, legendCanvas.width);
            finalCanvas.width = Math.max(finalPatternImage.width, legendCanvas.width);
            finalCanvas.height = finalPatternImage.height + legendCanvas.height + 60; // Increased (+20 -> +60) for watermark

            const ctx = finalCanvas.getContext('2d');
            if (!ctx) return;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

            // Draw Grid with Rulers
            ctx.drawImage(finalPatternImage, 0, 0);

            // Draw Legend
            ctx.drawImage(legendCanvas, 0, finalPatternImage.height + 20);

            // Watermark
            ctx.font = 'bold 24px sans-serif';
            ctx.fillStyle = '#9ca3af'; // text-gray-400
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText('Created with Vikit Platform', finalCanvas.width / 2, finalCanvas.height - 20);

            const link = document.createElement('a');
            link.download = `${filename}.${format}`;
            link.href = format === 'jpg' ? finalCanvas.toDataURL('image/jpeg', 0.9) : finalCanvas.toDataURL();
            link.click();
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Generate thumbnail from grid data
            const generateThumbnail = (): string | null => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return null;

                    const cellSize = 4; // Small cells for thumbnail
                    canvas.width = gridSize.cols * cellSize;
                    canvas.height = gridSize.rows * cellSize;

                    // Draw grid cells
                    for (let row = 0; row < gridSize.rows; row++) {
                        for (let col = 0; col < gridSize.cols; col++) {
                            const cell = gridData[row]?.[col];
                            const color = typeof cell === 'string' ? cell : (cell?.color || '#FFFFFF');
                            ctx.fillStyle = color;
                            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
                        }
                    }

                    return canvas.toDataURL('image/png');
                } catch (e) {
                    console.error('Thumbnail generation failed:', e);
                    return null;
                }
            };

            const thumbnailUrl = generateThumbnail();

            const data = {
                id: projectId,
                title: projectTitle,
                grid: gridData,
                palette: customColors,
                width: gridSize.cols,
                height: gridSize.rows,
                originalImage: hasAIImport() ? null : undefined,
                thumbnailUrl: thumbnailUrl
            };

            const res = await saveGridProject(data);
            if (res.error) {
                setCustomAlert({
                    title: locale === 'ko' ? '저장 실패' : 'Save Failed',
                    message: `${locale === 'ko' ? '도안 저장 중 오류가 발생했습니다: ' : 'Save failed: '}${res.error}`,
                    onConfirm: () => {}
                });
                return false;
            } else {
                if (res.project) {
                    setProjectId(res.project.id);
                }
                setIsDirty(false);
                setCustomAlert({
                    title: locale === 'ko' ? '저장 완료' : 'Save Success',
                    message: locale === 'ko' ? '도안이 성공적으로 저장되었습니다.' : 'The design has been successfully saved.',
                    onConfirm: () => {}
                });
                return true;
            }
        } catch (e: any) {
            console.error(e);
            setCustomAlert({
                title: locale === 'ko' ? '저장 실패' : 'Save Failed',
                message: e.message || (locale === 'ko' ? '알 수 없는 오류가 발생했습니다.' : 'An unexpected error occurred.'),
                onConfirm: () => {}
            });
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublish = async () => {
        // Compile unique needles from yarnParts dynamically
        const compiledNeedles = publishMetadata.yarnParts
            ? Array.from(new Set(publishMetadata.yarnParts.map(p => p.needle).filter(Boolean))).join(', ')
            : '';

        // Dynamic Validation with Anchor Scrolling
        if (!publishMetadata.imageUrl) {
            setCustomAlert({
                title: locale === 'ko' ? '대표 이미지 필수' : 'Main Image Required',
                message: locale === 'ko' ? '도안의 대표 이미지를 등록해 주세요.' : 'Please upload a main image for your pattern.',
                onConfirm: () => {
                    const el = document.getElementById('publish-image-field');
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
            return;
        }

        if (!publishMetadata.subcategory) {
            setCustomAlert({
                title: locale === 'ko' ? '카테고리 필수' : 'Category Required',
                message: locale === 'ko' ? '도안의 세부 카테고리를 선택해 주세요.' : 'Please select a subcategory for your pattern.',
                onConfirm: () => {
                    const el = document.getElementById('publish-subcategory-field');
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => {
                        el?.querySelector('select')?.focus();
                    }, 500);
                }
            });
            return;
        }

        const hasValidYarnParts = publishMetadata.yarnParts && publishMetadata.yarnParts.length > 0;
        const allYarnPartsFilled = hasValidYarnParts && publishMetadata.yarnParts?.every(p => p.yarnName && p.needle);

        if (!hasValidYarnParts || !allYarnPartsFilled) {
            setCustomAlert({
                title: locale === 'ko' ? '실/바늘 정보 입력 필요' : 'Yarn/Needle Info Required',
                message: locale === 'ko'
                    ? '실 정보 파트를 추가하고, 실 이름과 바늘 사이즈를 빠짐없이 입력해 주세요.'
                    : 'Please add at least one yarn part, and fill out both the yarn name and needle size.',
                onConfirm: () => {
                    const el = document.getElementById('publish-yarn-parts-field');
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
            return;
        }

        if (!publishMetadata.briefDescription || publishMetadata.briefDescription.trim() === '') {
            setCustomAlert({
                title: locale === 'ko' ? '간략 설명 필수' : 'Description Required',
                message: locale === 'ko' ? '도안 상품 페이지에 표시할 간략 설명을 작성해 주세요.' : 'Please write a brief description for your pattern.',
                onConfirm: () => {
                    const el = document.getElementById('publish-brief-desc-field');
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
            return;
        }

        if (!publishMetadata.hashtags || publishMetadata.hashtags.length < 3) {
            setCustomAlert({
                title: locale === 'ko' ? '해시태그 부족' : 'Hashtags Required',
                message: locale === 'ko' ? '구매자가 도안을 찾기 쉽도록 해시태그를 최소 3개 이상 등록해 주세요.' : 'Please add at least 3 hashtags.',
                onConfirm: () => {
                    const el = document.getElementById('publish-hashtags-field');
                    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => {
                        el?.querySelector('input')?.focus();
                    }, 500);
                }
            });
            return;
        }

        if (!projectId) return;

        setIsPublishing(true);
        try {
            const res = await publishPattern(projectId, {
                ...publishMetadata,
                needles: compiledNeedles || '3.5mm', // Auto-compiled needles
                title: publishMetadata.title || projectTitle // Ensure title is set
            });

            if (res.error) {
                setCustomAlert({
                    title: locale === 'ko' ? '출시 실패' : 'Publish Failed',
                    message: `${locale === 'ko' ? '도안 출시 중 오류가 발생했습니다: ' : 'Publish failed: '}${res.error}`,
                    onConfirm: () => {}
                });
            } else {
                setPublishedPatternId(res.patternId || null);
                setShowPublishSuccess(true);
                setShowPublishModal(false);
                setIsDirty(false); // Mark as clean so it doesn't trigger unload warnings!
                // Redirect after showing success message
                setTimeout(() => {
                    router.push(`/marketplace/${res.patternId}`);
                }, 2000);
            }
        } catch (e: any) {
            console.error(e);
            setCustomAlert({
                title: locale === 'ko' ? '출시 실패' : 'Publish Failed',
                message: e.message || (locale === 'ko' ? '알 수 없는 오류가 발생했습니다.' : 'An unexpected error occurred.'),
                onConfirm: () => {}
            });
        } finally {
            setIsPublishing(false);
        }
    };

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    // Knitting Symbols (대바늘)
    const KNITTING_SYMBOLS: StitchSymbolDef[] = useMemo(() => [
        {
            id: 'knit', label: '|', name: t('knit'), render: ({ x, y, size }) => (
                <Line points={[x + size / 2, y + size * 0.2, x + size / 2, y + size * 0.8]} stroke="#333" strokeWidth={1.5} listening={false} />
            )
        },
        {
            id: 'purl', label: '-', name: t('purl'), render: ({ x, y, size }) => (
                <Line points={[x + size * 0.2, y + size / 2, x + size * 0.8, y + size / 2]} stroke="#333" strokeWidth={1.5} listening={false} />
            )
        },
        {
            id: 'yo', label: '○', name: t('yarnOver'), render: ({ x, y, size }) => (
                <Circle x={x + size / 2} y={y + size / 2} radius={size * 0.3} stroke="#333" strokeWidth={1.5} listening={false} />
            )
        },
        {
            id: 'k2tog', label: '╱', name: t('k2tog'), render: ({ x, y, size }) => (
                <Line points={[x + size * 0.8, y + size * 0.2, x + size * 0.2, y + size * 0.8]} stroke="#333" strokeWidth={1.5} listening={false} />
            )
        },
        {
            id: 'ssk', label: '╲', name: t('ssk'), render: ({ x, y, size }) => (
                <Line points={[x + size * 0.2, y + size * 0.2, x + size * 0.8, y + size * 0.8]} stroke="#333" strokeWidth={1.5} listening={false} />
            )
        },
        {
            id: 'tbl', label: 'Ω', name: t('tbl'), render: ({ x, y, size }) => (
                <Text x={x} y={y + 1} width={size} height={size} text="Ω" fontSize={size * 0.7} align="center" verticalAlign="middle" fill="#333" listening={false} />
            )
        },
        {
            id: 'cable', label: 'X', name: t('cable'), render: ({ x, y, size }) => (
                <Group>
                    <Line points={[x + size * 0.2, y + size * 0.2, x + size * 0.8, y + size * 0.8]} stroke="#333" strokeWidth={1.5} listening={false} />
                    <Line points={[x + size * 0.8, y + size * 0.2, x + size * 0.2, y + size * 0.8]} stroke="#333" strokeWidth={1.5} listening={false} />
                </Group>
            )
        },
        {
            id: 'no_stitch', label: '■', name: t('noStitch'), render: ({ x, y, size }) => (
                <Rect x={x} y={y} width={size} height={size} fill="#d1d5db" listening={false} />
            )
        }
    ], [t]);

    // Crochet Symbols (코바늘) - Standard Chart Notation
    const CROCHET_SYMBOLS: StitchSymbolDef[] = useMemo(() => [
        {
            // Chain: Horizontal oval (사슬뜨기)
            id: 'chain', label: '⬯', name: tEditor('stitchSymbols.chain'), render: ({ x, y, size }) => (
                <Group>
                    <Rect x={x + size * 0.15} y={y + size * 0.35} width={size * 0.7} height={size * 0.3} cornerRadius={size * 0.15} stroke="#333" strokeWidth={1.5} listening={false} />
                </Group>
            )
        },
        {
            // Slip Stitch: Filled dot (빠진코)
            id: 'slip', label: '•', name: tEditor('stitchSymbols.slipStitch'), render: ({ x, y, size }) => (
                <Circle x={x + size / 2} y={y + size / 2} radius={size * 0.12} fill="#333" listening={false} />
            )
        },
        {
            // Single Crochet: + symbol (짧은뜨기)
            id: 'sc', label: '+', name: tEditor('stitchSymbols.singleCrochet'), render: ({ x, y, size }) => (
                <Group>
                    <Line points={[x + size / 2, y + size * 0.2, x + size / 2, y + size * 0.8]} stroke="#333" strokeWidth={1.5} listening={false} />
                    <Line points={[x + size * 0.2, y + size / 2, x + size * 0.8, y + size / 2]} stroke="#333" strokeWidth={1.5} listening={false} />
                </Group>
            )
        },
        {
            // Half Double Crochet: T shape (중장뜨기)
            id: 'hdc', label: 'T', name: tEditor('stitchSymbols.halfDouble'), render: ({ x, y, size }) => (
                <Group>
                    <Line points={[x + size / 2, y + size * 0.15, x + size / 2, y + size * 0.85]} stroke="#333" strokeWidth={1.5} listening={false} />
                    <Line points={[x + size * 0.25, y + size * 0.15, x + size * 0.75, y + size * 0.15]} stroke="#333" strokeWidth={1.5} listening={false} />
                </Group>
            )
        },
        {
            // Double Crochet: T + 1 diagonal slash (장뜨기)
            id: 'dc', label: '╤', name: tEditor('stitchSymbols.doubleCrochet'), render: ({ x, y, size }) => (
                <Group>
                    <Line points={[x + size / 2, y + size * 0.1, x + size / 2, y + size * 0.9]} stroke="#333" strokeWidth={1.5} listening={false} />
                    <Line points={[x + size * 0.25, y + size * 0.1, x + size * 0.75, y + size * 0.1]} stroke="#333" strokeWidth={1.5} listening={false} />
                    <Line points={[x + size * 0.35, y + size * 0.35, x + size * 0.65, y + size * 0.55]} stroke="#333" strokeWidth={1.5} listening={false} />
                </Group>
            )
        },
        {
            // Treble Crochet: T + 2 diagonal slashes (한길긴뜨기)
            id: 'tr', label: '╦', name: tEditor('stitchSymbols.trebleCrochet'), render: ({ x, y, size }) => (
                <Group>
                    <Line points={[x + size / 2, y + size * 0.05, x + size / 2, y + size * 0.95]} stroke="#333" strokeWidth={1.5} listening={false} />
                    <Line points={[x + size * 0.2, y + size * 0.05, x + size * 0.8, y + size * 0.05]} stroke="#333" strokeWidth={1.5} listening={false} />
                    <Line points={[x + size * 0.35, y + size * 0.3, x + size * 0.65, y + size * 0.45]} stroke="#333" strokeWidth={1.5} listening={false} />
                    <Line points={[x + size * 0.35, y + size * 0.5, x + size * 0.65, y + size * 0.65]} stroke="#333" strokeWidth={1.5} listening={false} />
                </Group>
            )
        },
        {
            // Double Treble Crochet: T + 3 slashes (두길긴뜨기)
            id: 'dtr', label: '╬', name: tEditor('stitchSymbols.doubleTreble'), render: ({ x, y, size }) => (
                <Group>
                    <Line points={[x + size / 2, y + size * 0.02, x + size / 2, y + size * 0.98]} stroke="#333" strokeWidth={1.5} listening={false} />
                    <Line points={[x + size * 0.15, y + size * 0.02, x + size * 0.85, y + size * 0.02]} stroke="#333" strokeWidth={1.5} listening={false} />
                    <Line points={[x + size * 0.35, y + size * 0.22, x + size * 0.65, y + size * 0.35]} stroke="#333" strokeWidth={1.5} listening={false} />
                    <Line points={[x + size * 0.35, y + size * 0.42, x + size * 0.65, y + size * 0.55]} stroke="#333" strokeWidth={1.5} listening={false} />
                    <Line points={[x + size * 0.35, y + size * 0.62, x + size * 0.65, y + size * 0.75]} stroke="#333" strokeWidth={1.5} listening={false} />
                </Group>
            )
        },
        {
            // SC2tog: V shape inverted (2코모아 짧은뜨기)
            id: 'sc2tog', label: '∧', name: tEditor('stitchSymbols.sc2tog'), render: ({ x, y, size }) => (
                <Line points={[x + size * 0.15, y + size * 0.85, x + size / 2, y + size * 0.15, x + size * 0.85, y + size * 0.85]} stroke="#333" strokeWidth={1.5} listening={false} />
            )
        },
        {
            // Shell/Fan: Multiple dc from one point (셸/팬)
            id: 'shell', label: '⌔', name: tEditor('stitchSymbols.shell'), render: ({ x, y, size }) => (
                <Group>
                    {/* Fan of 5 lines */}
                    <Line points={[x + size / 2, y + size * 0.9, x + size * 0.1, y + size * 0.2]} stroke="#333" strokeWidth={1.2} listening={false} />
                    <Line points={[x + size / 2, y + size * 0.9, x + size * 0.3, y + size * 0.15]} stroke="#333" strokeWidth={1.2} listening={false} />
                    <Line points={[x + size / 2, y + size * 0.9, x + size * 0.5, y + size * 0.1]} stroke="#333" strokeWidth={1.2} listening={false} />
                    <Line points={[x + size / 2, y + size * 0.9, x + size * 0.7, y + size * 0.15]} stroke="#333" strokeWidth={1.2} listening={false} />
                    <Line points={[x + size / 2, y + size * 0.9, x + size * 0.9, y + size * 0.2]} stroke="#333" strokeWidth={1.2} listening={false} />
                </Group>
            )
        },
        {
            // Picot: Small loop (피코뜨기)
            id: 'picot', label: '⌒', name: tEditor('stitchSymbols.picot'), render: ({ x, y, size }) => (
                <Group>
                    <Circle x={x + size / 2} y={y + size * 0.35} radius={size * 0.2} stroke="#333" strokeWidth={1.5} listening={false} />
                    <Line points={[x + size / 2, y + size * 0.55, x + size / 2, y + size * 0.85]} stroke="#333" strokeWidth={1.5} listening={false} />
                </Group>
            )
        }
    ], [tEditor]);

    // Select symbols based on editor mode
    const INITIAL_SYMBOLS = editorMode === 'knitting' ? KNITTING_SYMBOLS : CROCHET_SYMBOLS;

    const allSymbols = useMemo(() => [...INITIAL_SYMBOLS, ...customSymbols], [INITIAL_SYMBOLS, customSymbols]);

    const handleAddSymbol = () => {
        if (!newSymbolData.name || !newSymbolData.label) return;

        const newId = `custom_${Date.now()}`;
        const newSymbol: StitchSymbolDef = {
            id: newId,
            label: newSymbolData.label,
            name: newSymbolData.name,
            type: 'custom',
            render: ({ x, y, size }) => (
                <Text
                    x={x} y={y + 1}
                    width={size} height={size}
                    text={newSymbolData.label}
                    fontSize={size * 0.7}
                    align="center"
                    verticalAlign="middle"
                    fill="#333"
                    listening={false}
                />
            )
        };

        setCustomSymbols(prev => [...prev, newSymbol]);
        setNewSymbolData({ name: '', label: '' });
        setIsAddingSymbol(false);
        setActiveTool('symbol');
        setSelectedSymbol(newId);
        setIsDirty(true);
    };

    // Paste Operation (Moved to avoid lint errors)
    const handlePaste = useCallback(() => {
        if (!clipboard) return;

        const pasteStartRow = finalSelection ? finalSelection.startRow : (selectionStart ? selectionStart.row : 0);
        const pasteStartCol = finalSelection ? finalSelection.startCol : (selectionStart ? selectionStart.col : 0);

        const newData = gridData.map(row => [...row]);
        const rowsToPaste = clipboard.length;
        const colsToPaste = clipboard[0].length;

        let hasChanges = false;

        for (let r = 0; r < rowsToPaste; r++) {
            for (let c = 0; c < colsToPaste; c++) {
                const targetRow = pasteStartRow + r;
                const targetCol = pasteStartCol + c;

                if (targetRow < gridSize.rows && targetCol < gridSize.cols) {
                    const cellData = clipboard[r][c];
                    if (JSON.stringify(newData[targetRow][targetCol]) !== JSON.stringify(cellData)) {
                        newData[targetRow][targetCol] = { ...cellData };
                        hasChanges = true;
                    }
                }
            }
        }

        if (hasChanges) {
            saveToHistory(newData);
            setGridData(newData);
            setIsDirty(true);
        }
    }, [clipboard, finalSelection, selectionStart, gridData, gridSize, saveToHistory]);

    // Keyboard Shortcuts (Moved)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'c') {
                    if (e.shiftKey) {
                        e.preventDefault();
                        handleSelectionCut();
                    } else {
                        e.preventDefault();
                        handleSelectionCopy();
                    }
                } else if (e.key === 'v') {
                    e.preventDefault();
                    handlePaste();
                } else if (e.key === 'x') {
                    e.preventDefault();
                    handleSelectionCut();
                } else if (e.key === 'z') {
                    if (e.shiftKey) {
                        e.preventDefault();
                        handleRedo();
                    } else {
                        e.preventDefault();
                        handleUndo();
                    }
                } else if (e.key === 'y') {
                    e.preventDefault();
                    handleRedo();
                }
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                if (finalSelection) {
                    e.preventDefault();
                    handleSelectionErase();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [finalSelection, handleSelectionCopy, handleSelectionCut, handlePaste, handleSelectionErase, handleUndo, handleRedo]);

    // Drag & Drop Handler
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!containerRef.current) return;
        const payloadStr = e.dataTransfer.getData('payload');
        if (!payloadStr) return;

        try {
            const payload = JSON.parse(payloadStr);
            const rect = containerRef.current.getBoundingClientRect();
            // Calculate grid position accounting for Pan (position) and Zoom (scale)
            const x = (e.clientX - rect.left - position.x) / scale;
            const y = (e.clientY - rect.top - position.y) / scale;

            const col = Math.floor(x / CELL_SIZE);
            const row = Math.floor(y / CELL_SIZE);

            // Logic: If dropping inside the Active Selection (Red Box), fill the selection based on Shape Mode
            // If dropping outside, just fill the single cell
            let targetCells: { row: number, col: number }[] = [];

            if (finalSelection &&
                row >= finalSelection.startRow && row <= finalSelection.endRow &&
                col >= finalSelection.startCol && col <= finalSelection.endCol) {

                // Determine behavior based on Active Tool
                if (activeTool === 'shape') {
                    // Shape Tool: Update parameters (Color/Symbol) essentially "Tinting" the preview.
                    // Do NOT commit to grid immediately. Allow user to Confirm.
                    if (payload.type === 'symbol') setSelectedSymbol(payload.id);
                    if (payload.type === 'color') setSelectedColor(payload.color);
                    return; // Stop here, don't write to grid
                }

                // Selection Tool (or others): Fill the whole selection area (Flood Fill) and Commit.
                for (let r = finalSelection.startRow; r <= finalSelection.endRow; r++) {
                    for (let c = finalSelection.startCol; c <= finalSelection.endCol; c++) {
                        targetCells.push({ row: r, col: c });
                    }
                }

                // Update current selection state
                if (payload.type === 'symbol') {
                    setSelectedSymbol(payload.id);
                } else if (payload.type === 'color') {
                    setSelectedColor(payload.color);
                }

            } else {
                // Single cell drop
                targetCells = [{ row, col }];
            }

            if (targetCells.length > 0) {
                const newData = gridData.map(r => [...r]);
                let changed = false;

                targetCells.forEach(({ row: r, col: c }) => {
                    if (r >= 0 && r < gridSize.rows && c >= 0 && c < gridSize.cols) {
                        const currentCell = newData[r][c];
                        if (payload.type === 'symbol') {
                            if (currentCell.symbolId !== payload.id) {
                                newData[r][c] = { ...currentCell, symbolId: payload.id };
                                changed = true;
                            }
                        } else if (payload.type === 'color') {
                            // Ensure color is opaque if it's a 6-digit hex
                            let newColor = payload.color;
                            // Basic check: if user provided 8-digit hex ending in transparent, strip it?
                            // But usually users pick from the palette which are solid.
                            // The user mentioned "green stays green", "pink stays pink", but "merging".
                            // This might be due to previously existing color blending if we were using transparency.
                            // Here we strictly REPLACE the color, which should fix "merging" if it was logical.

                            if (currentCell.color !== newColor) {
                                newData[r][c] = { ...currentCell, color: newColor };
                                changed = true;
                            }
                        }
                    }
                });

                if (changed) {
                    setGridData(newData);
                    saveToHistory(newData);
                    setIsDirty(true);
                }
            }

        } catch (err) {
            console.error('Drop failed', err);
        }
    };

    if (!isMounted) return <div className="h-full flex items-center justify-center bg-cream-50">Loading Studio...</div>;

    const hasOpenModal = showGridSizeModal || showPublishModal || showOnboarding || showExportMenu || showSaveSuccess || showPublishSuccess || isAddingSymbol;

    return (
        <div className="flex flex-col h-[85vh] bg-cream-50 font-sans select-none relative">
            {!user && (
                <div
                    className="absolute inset-0 z-[9999] cursor-pointer bg-transparent"
                    onClick={handleAuthCheck}
                />
            )}
            {/* Onboarding Modal */}
            {showOnboarding && (
                <div className="fixed inset-0 z-[10000]">
                    <OnboardingOverlay
                        t={tEditor}
                        step={onboardingStep}
                        setStep={setOnboardingStep}
                        onClose={() => {
                            setShowOnboarding(false);
                            localStorage.setItem('hasSeenOnboarding', 'true');
                        }}
                    />
                </div>
            )}

            {/* Top Toolbar */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-tan-200 px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm z-20 gap-3 sm:gap-0">
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto overflow-x-auto scrollbar-hide">
                    {/* Project Title Input */}
                    <input
                        type="text"
                        value={projectTitle}
                        onChange={(e) => {
                            setProjectTitle(e.target.value);
                            setIsDirty(true);
                        }}
                        className="bg-transparent font-bold text-stone-700 text-lg border-b border-transparent hover:border-tan-300 focus:border-sage-400 focus:outline-none w-40 px-1 transition-all"
                        placeholder={t('projectName')}
                        title={t('editProjectName')}
                    />

                    {/* Mode Toggle: Knitting / Crochet */}
                    <div className="inline-flex p-1 rounded-full bg-cream-100 border border-tan-200">
                        <button
                            onClick={() => setEditorMode('knitting')}
                            className={`px-3 py-1.5 rounded-full font-medium text-sm transition-all flex items-center gap-1.5 ${editorMode === 'knitting'
                                ? 'bg-white text-brown-700 shadow-soft'
                                : 'text-stone-500 hover:text-stone-700'
                                }`}
                        >
                            {tEditor('modeKnitting')}
                        </button>
                        <button
                            onClick={() => setEditorMode('crochet')}
                            className={`px-3 py-1.5 rounded-full font-medium text-sm transition-all flex items-center gap-1.5 ${editorMode === 'crochet'
                                ? 'bg-white text-brown-700 shadow-soft'
                                : 'text-stone-500 hover:text-stone-700'
                                }`}
                        >
                            {tEditor('modeCrochet')}
                        </button>
                    </div>

                    <div className="h-8 w-px bg-tan-200" />
                    <div id="tour-tools" className="flex bg-cream-100 p-1.5 rounded-2xl shadow-inner gap-1 animate-in fade-in duration-300">
                        <button onClick={() => { setActiveTool('move'); setIsSelectionMode(false); }} className={`p-2.5 rounded-xl transition-all duration-200 ${activeTool === 'move' ? 'bg-white shadow-soft text-sage-600 scale-105' : 'text-stone-400 hover:text-stone-600'}`} title={t('pan')}><Hand size={20} /></button>
                        <div className="w-px bg-tan-200 my-2 mx-1" />
                        
                        {/* Color (색상) */}
                        <button
                            onClick={() => { previousToolRef.current = 'paint'; setActiveTool('paint'); setIsSelectionMode(false); }}
                            className={`p-2.5 rounded-xl transition-all duration-200 ${(activeTool === 'paint' || (isSimultaneousDraw && activeTool === 'symbol')) ? 'bg-white shadow-soft text-sage-600 scale-105' : 'text-stone-400 hover:text-stone-600'}`}
                            title={locale === 'ko' ? '색상' : 'Color'}
                        >
                            <Paintbrush size={20} />
                        </button>
                        
                        {/* Symbol (기호) */}
                        <button
                            onClick={() => { previousToolRef.current = 'symbol'; setActiveTool('symbol'); setIsSelectionMode(false); }}
                            className={`p-2.5 rounded-xl transition-all duration-200 ${(activeTool === 'symbol' || (isSimultaneousDraw && activeTool === 'paint')) ? 'bg-white shadow-soft text-sage-600 scale-105' : 'text-stone-400 hover:text-stone-600'}`}
                            title={locale === 'ko' ? '기호' : 'Symbol'}
                        >
                            <MousePointer2 size={20} />
                        </button>
                        
                        {/* Fill (채우기) - with dropdown */}
                        <div ref={bucketDropdownRef} className="relative group">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsBucketMenuOpen(!isBucketMenuOpen);
                                    setActiveTool('bucket');
                                    setIsSelectionMode(false);
                                }}
                                className={`p-2.5 rounded-xl transition-all duration-200 flex items-center gap-0.5 ${activeTool === 'bucket' ? 'bg-white shadow-soft text-sage-600 scale-105' : 'text-stone-400 hover:text-stone-600'}`}
                                title={locale === 'ko' ? '채우기' : 'Fill'}
                            >
                                <PaintBucket size={20} />
                                <ChevronDown size={12} className={`opacity-50 transition-transform ${isBucketMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isBucketMenuOpen && (
                                <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-tan-200 p-3 z-[100] min-w-[180px] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 px-1">
                                        {locale === 'ko' ? '채우기 옵션' : 'Fill Option'}
                                    </div>
                                    <div className="flex bg-stone-100 p-1 rounded-xl gap-1 mb-2">
                                        <button
                                            onClick={() => setBucketMode('both')}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                bucketMode === 'both' ? 'bg-white shadow text-stone-900' : 'text-stone-400 hover:text-stone-600'
                                            }`}
                                        >
                                            {locale === 'ko' ? '둘 다' : 'Both'}
                                        </button>
                                        <button
                                            onClick={() => setBucketMode('color')}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                bucketMode === 'color' ? 'bg-white shadow text-stone-900' : 'text-stone-400 hover:text-stone-600'
                                            }`}
                                        >
                                            {locale === 'ko' ? '색상만' : 'Color'}
                                        </button>
                                        <button
                                            onClick={() => setBucketMode('symbol')}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                bucketMode === 'symbol' ? 'bg-white shadow text-stone-900' : 'text-stone-400 hover:text-stone-600'
                                            }`}
                                        >
                                            {locale === 'ko' ? '기호만' : 'Symbol'}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-stone-400 leading-normal px-1">
                                        {bucketMode === 'both' && (locale === 'ko' ? '색상 & 기호가 일치하는 영역을 채웁니다.' : 'Fills regions matching both.')}
                                        {bucketMode === 'color' && (locale === 'ko' ? '색상이 일치하는 영역을 채웁니다.' : 'Fills regions matching color.')}
                                        {bucketMode === 'symbol' && (locale === 'ko' ? '기호가 일치하는 영역을 채웁니다.' : 'Fills regions matching symbol.')}
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        {/* Eyedropper (Pipette) */}
                        <button
                            onClick={() => { previousToolRef.current = (activeTool === 'eyedropper' ? previousToolRef.current : activeTool); setActiveTool('eyedropper'); setIsSelectionMode(false); }}
                            className={`p-2.5 rounded-xl transition-all duration-200 ${activeTool === 'eyedropper' ? 'bg-white shadow-soft text-sage-600 scale-105' : 'text-stone-400 hover:text-stone-600'}`}
                            title={locale === 'ko' ? '스포이드' : 'Eyedropper'}
                        >
                            <Pipette size={20} />
                        </button>

                        {/* Simultaneous Draw Toggle - visible when paint or symbol tool active */}
                        {(activeTool === 'paint' || activeTool === 'symbol') && (
                            <div className="flex items-center gap-1.5 ml-1 pl-2 border-l border-tan-200">
                                <button
                                    onClick={() => setIsSimultaneousDraw(!isSimultaneousDraw)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-200 ${
                                        isSimultaneousDraw
                                            ? 'bg-sage-600 text-white shadow-md'
                                            : 'bg-white/60 text-stone-400 hover:text-stone-600 hover:bg-white'
                                    }`}
                                    title={locale === 'ko' ? '동시 그리기 모드: 색상과 기호를 한 번에 칠합니다' : 'Simultaneous Draw: Apply color and symbol at once'}
                                >
                                    <span className={`w-2 h-2 rounded-full transition-colors ${isSimultaneousDraw ? 'bg-white animate-pulse' : 'bg-stone-300'}`} />
                                    {locale === 'ko' ? '동시' : 'Dual'}
                                </button>
                            </div>
                        )}

                        <div className="w-px bg-tan-200 my-2 mx-1" />
                        <button onClick={() => { setActiveTool('eraser'); setIsSelectionMode(false); }} className={`p-2.5 rounded-xl transition-all duration-200 ${activeTool === 'eraser' ? 'bg-white shadow-soft text-sage-600 scale-105' : 'text-stone-400 hover:text-stone-600'}`} title={t('eraser')}><Eraser size={20} /></button>
                        <div ref={shapeDropdownRef} className="relative group">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsShapeMenuOpen(!isShapeMenuOpen);
                                    setActiveTool('shape');
                                    setIsSelectionMode(false);
                                }}
                                className={`p-2.5 rounded-xl transition-all duration-200 flex items-center gap-0.5 ${activeTool === 'shape' ? 'bg-white shadow-soft text-sage-600 scale-105' : 'text-stone-400 hover:text-stone-600'}`}
                                title={t('shapeTool')}
                            >
                                <Shapes size={20} />
                                <ChevronDown size={12} className={`opacity-50 transition-transform ${isShapeMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isShapeMenuOpen && (
                                <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-tan-200 p-3 z-[100] min-w-[200px] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 px-1">{t('shapeType')}</div>
                                    <div className="grid grid-cols-5 gap-2 mb-4">
                                        <button onClick={() => { setActiveShape('circle'); setActiveTool('shape'); }} className={`p-2 rounded-lg transition-colors ${activeShape === 'circle' ? 'bg-sage-100 text-sage-700' : 'hover:bg-cream-50 text-stone-500'}`} title={t('shapes.circle')}><CircleIcon size={18} /></button>
                                        <button onClick={() => { setActiveShape('square'); setActiveTool('shape'); }} className={`p-2 rounded-lg transition-colors ${activeShape === 'square' ? 'bg-sage-100 text-sage-700' : 'hover:bg-cream-50 text-stone-500'}`} title={t('shapes.square')}><Square size={18} /></button>
                                        <button onClick={() => { setActiveShape('triangle'); setActiveTool('shape'); }} className={`p-2 rounded-lg transition-colors ${activeShape === 'triangle' ? 'bg-sage-100 text-sage-700' : 'hover:bg-cream-50 text-stone-500'}`} title={t('shapes.triangle')}><Triangle size={18} /></button>
                                        <button onClick={() => { setActiveShape('star'); setActiveTool('shape'); }} className={`p-2 rounded-lg transition-colors ${activeShape === 'star' ? 'bg-sage-100 text-sage-700' : 'hover:bg-cream-50 text-stone-500'}`} title={t('shapes.star')}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                        </button>
                                        <button onClick={() => { setActiveShape('heart'); setActiveTool('shape'); }} className={`p-2 rounded-lg transition-colors ${activeShape === 'heart' ? 'bg-sage-100 text-sage-700' : 'hover:bg-cream-50 text-stone-500'}`} title={t('shapes.heart')}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.51 4.05 3 5.5l7 7Z" /></svg>
                                        </button>
                                    </div>

                                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 px-1">{t('drawMode')}</div>
                                    <div className="flex bg-stone-100 p-1 rounded-xl mb-3">
                                        <button
                                            onClick={() => setShapeMode('outline')}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${shapeMode === 'outline' ? 'bg-white shadow text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                                        >
                                            {t('outline')}
                                        </button>
                                        <button
                                            onClick={() => setShapeMode('fill')}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${shapeMode === 'fill' ? 'bg-white shadow text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                                        >
                                            {t('fill')}
                                        </button>
                                    </div>

                                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 px-1">
                                        {locale === 'ko' ? '적용 속성' : 'Apply Property'}
                                    </div>
                                    <div className="flex bg-stone-100 p-1 rounded-xl gap-1">
                                        <button
                                            onClick={() => setShapeApplyTarget('both')}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${shapeApplyTarget === 'both' ? 'bg-white shadow text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                                        >
                                            {locale === 'ko' ? '둘 다' : 'Both'}
                                        </button>
                                        <button
                                            onClick={() => setShapeApplyTarget('color')}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${shapeApplyTarget === 'color' ? 'bg-white shadow text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                                        >
                                            {locale === 'ko' ? '색상만' : 'Color'}
                                        </button>
                                        <button
                                            onClick={() => setShapeApplyTarget('symbol')}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${shapeApplyTarget === 'symbol' ? 'bg-white shadow text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                                        >
                                            {locale === 'ko' ? '기호만' : 'Symbol'}
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => setIsShapeMenuOpen(false)}
                                        className="w-full mt-3 py-1.5 text-[10px] font-bold text-stone-400 hover:text-stone-600 transition-colors uppercase"
                                    >
                                        {t('close')}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="w-px bg-tan-200 my-2 mx-1" />
                        <button
                            onClick={() => {
                                if (isSelectionMode) {
                                    setIsSelectionMode(false);
                                    handleSelectionCancel();
                                    setActiveTool('move');
                                } else {
                                    setIsSelectionMode(true);
                                    setActiveTool('selection');
                                    setIsShapeMenuOpen(false);
                                }
                            }}
                            className={`p-2.5 rounded-xl transition-all duration-200 ${isSelectionMode ? 'bg-rose-100 text-rose-600 shadow-inner ring-1 ring-rose-200' : 'text-stone-400 hover:text-stone-600 hover:bg-white/50'}`}
                            title={t('areaSelectMode')}
                        >
                            <BoxSelect size={20} />
                        </button>
                    </div>
                    <div className="h-8 w-px bg-tan-200" />
                    <button
                        id="tour-undo"
                        onClick={handleUndo}
                        disabled={historyIndex <= 0}
                        className="p-2.5 rounded-xl hover:bg-white/50 text-stone-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo size={20} />
                    </button>
                    <button
                        onClick={handleRedo}
                        disabled={historyIndex >= history.length - 1}
                        className="p-2.5 rounded-xl hover:bg-white/50 text-stone-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo size={20} />
                    </button>
                    <div className="h-8 w-px bg-tan-200" />
                    <button
                        onClick={() => {
                            setCustomAlert({
                                title: locale === 'ko' ? '전체 초기화' : 'Clear All',
                                message: locale === 'ko' ? '정말로 캔버스의 모든 코를 지우시겠습니까? 이 작업은 실행 취소가 가능합니다.' : 'Are you sure you want to clear the canvas? You can undo this action.',
                                onConfirm: () => {
                                    saveToHistory(gridData);
                                    setGridData(prev => prev.map(r => r.map(() => ({ color: '#ffffff', symbolId: null }))));
                                },
                                onCancel: () => {}
                            });
                        }}
                        className="p-3 hover:bg-rose-50 text-rose-400 hover:text-rose-500 rounded-xl transition-colors"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>

                <div className="flex items-center gap-6">
                    {/* Save Button */}
                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-stone-700 hover:bg-stone-800 text-white shadow-soft hover:shadow-lg transform transition-all active:scale-95 flex items-center gap-2 px-6 py-3 rounded-2xl font-bold disabled:opacity-50"
                    >
                        <Save size={18} />
                        <span>{isSaving ? tPublish('saving') : tPublish('save')}</span>
                    </button>

                    {/* Publish Button (New) */}
                    <button
                        onClick={() => {
                            if (!projectId) {
                                setCustomAlert({
                                    title: locale === 'ko' ? '도안 저장 필요' : 'Save Required',
                                    message: locale === 'ko' ? '도안을 먼저 저장한 후 출시를 진행하시겠습니까?' : 'Would you like to save the project first to proceed with publishing?',
                                    onConfirm: () => {
                                        handleSave().then((success) => {
                                            if (success) {
                                                setShowPublishModal(true);
                                            }
                                        });
                                    },
                                    onCancel: () => {}
                                });
                            } else {
                                setShowPublishModal(true);
                            }
                        }}
                        className="bg-rose-500 hover:bg-rose-600 text-white shadow-soft hover:shadow-lg transform transition-all active:scale-95 flex items-center gap-2 px-6 py-3 rounded-2xl font-bold ml-2"
                    >
                        <ShoppingBag size={18} />
                        <span>{tPublish('publish')}</span>
                    </button>
                    <div className="flex items-center bg-cream-100 px-4 py-2 rounded-2xl shadow-inner">
                        <button onClick={() => setScale(s => s / 1.2)}><ZoomOut size={18} className="text-stone-400 hover:text-stone-600" /></button>
                        <span className="w-16 text-center text-xs font-bold text-stone-500">{Math.round(scale * 100)}%</span>
                        <button onClick={() => setScale(s => s * 1.2)}><ZoomIn size={18} className="text-stone-400 hover:text-stone-600" /></button>
                    </div>
                    <div className="relative">
                        <button
                            id="tour-export"
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="bg-[#6B8E63] hover:bg-[#5A7853] text-white shadow-soft hover:shadow-lg transform transition-all active:scale-95 flex items-center gap-2 px-6 py-3 rounded-2xl font-bold"
                        >
                            <Download size={18} />
                            <span>{tEditor('export.title')}</span>
                            <ChevronDown size={14} className={`transition-transform duration-200 ${showExportMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Export Menu Dropdown */}
                        {showExportMenu && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-tan-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                <button
                                    onClick={() => handleDownload('png')}
                                    className="w-full text-left px-5 py-3 hover:bg-sage-50 text-stone-700 font-semibold flex items-center justify-between transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <ImageIcon size={18} className="text-sage-600" />
                                        {t('exportFormat.png')}
                                    </div>
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-[10px] font-bold border border-amber-200 text-amber-600 shadow-sm transition-transform group-hover:scale-105">
                                        <Coins size={12} className="text-amber-500" />
                                        <span>-1</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleDownload('jpg')}
                                    className="w-full text-left px-5 py-3 hover:bg-sage-50 text-stone-700 font-semibold flex items-center justify-between transition-colors border-t border-tan-100 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <ImageIcon size={18} className="text-sage-600" />
                                        {t('exportFormat.jpg')}
                                    </div>
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-[10px] font-bold border border-amber-200 text-amber-600 shadow-sm transition-transform group-hover:scale-105">
                                        <Coins size={12} className="text-amber-500" />
                                        <span>-1</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleDownload('pdf')}
                                    className="w-full text-left px-5 py-3 hover:bg-sage-50 text-stone-700 font-semibold flex items-center justify-between transition-colors border-t border-tan-100 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <FileText size={18} className="text-rose-500" />
                                        {t('exportFormat.pdf')}
                                    </div>
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-[10px] font-bold border border-amber-200 text-amber-600 shadow-sm transition-transform group-hover:scale-105">
                                        <Coins size={12} className="text-amber-500" />
                                        <span>-1</span>
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* Overlay to close menu when clicking outside */}
                        {showExportMenu && (
                            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowExportMenu(false)} />
                        )}
                    </div>
                </div>
            </div >

            <div className="flex flex-1 overflow-hidden">
                <div ref={containerRef} className={`flex-1 bg-stone-100 relative overflow-hidden touch-none ${hasOpenModal ? 'pointer-events-none' : ''}`}
                    style={{
                        cursor: (activeTool === 'move' || isSpacePressed)
                            ? 'grab'
                            : activeTool === 'eyedropper'
                            ? 'copy'
                            : activeTool === 'bucket'
                            ? `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z'/%3E%3Cpath d='m5 2 5 5'/%3E%3Cpath d='M2 13h15'/%3E%3Cpath d='M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z'/%3E%3C/svg%3E") 2 22, crosshair`
                            : 'crosshair'
                    }}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >

                    {/* Shape Transformation Box Overlay - when in Edit Mode */}
                    {(activeTool === 'shape' || isRotationMode) && (shapePreview || finalSelection) && (
                        <div
                            className="absolute pointer-events-none z-[100]"
                            style={{
                                left: `${position.x + ((finalSelection?.startCol ?? shapePreview!.startCol) + (finalSelection?.endCol ?? shapePreview!.endCol) + 1) / 2 * 30 * scale}px`,
                                top: `${position.y + ((finalSelection?.startRow ?? shapePreview!.startRow) + (finalSelection?.endRow ?? shapePreview!.endRow) + 1) / 2 * 30 * scale}px`,
                                transform: 'translate(-50%, -120px)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {!finalSelection ? (
                                <div className="bg-white/90 backdrop-blur-sm shadow-xl border border-blue-200 rounded-full px-4 py-2 flex items-center gap-2 pointer-events-auto animate-in fade-in zoom-in duration-200">
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{t('shapeToolHint')}</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 pointer-events-auto">
                                    <div className="bg-white/90 backdrop-blur-sm shadow-xl border border-blue-200 rounded-full px-2 py-2 flex items-center gap-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                        <button
                                            onClick={handleShapeConfirm}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-1.5"
                                        >
                                            <Check size={14} /> {t('confirm')}
                                        </button>
                                        <button
                                            onClick={handleShapeCancel}
                                            className="bg-stone-100 hover:bg-stone-200 text-stone-600 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5"
                                        >
                                            <X size={14} /> {t('cancel')}
                                        </button>
                                    </div>

                                    {showTransformationHint && (
                                        <div className="bg-stone-800/90 text-white text-[11px] font-bold px-3 py-2 rounded-xl shadow-lg border border-stone-700/50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                                            <Info size={12} className="text-blue-400" />
                                            <span>
                                                {locale === 'ko' 
                                                    ? '꼭지점 드래그: 회전 | 테두리 드래그: 크기 조절' 
                                                    : 'Drag corners to rotate | Drag edges to resize'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {/* Selection Tool Hint - when Selection exists */}
                    {activeTool === 'selection' && finalSelection && !isRotationMode && (
                        <div
                            className="absolute pointer-events-none z-[100]"
                            style={{
                                left: `${position.x + ((finalSelection.startCol + finalSelection.endCol + 1) / 2) * 30 * scale}px`,
                                top: `${position.y + ((finalSelection.startRow + finalSelection.endRow + 1) / 2) * 30 * scale}px`,
                                transform: 'translate(-50%, -100px)',
                                display: 'flex',
                                justifyContent: 'center'
                            }}
                        >
                            <div className="bg-white/90 backdrop-blur-sm shadow-xl border border-blue-200 rounded-full px-4 py-2 flex items-center gap-2 pointer-events-auto animate-in fade-in zoom-in duration-200">
                                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wide whitespace-nowrap">
                                    {t('selectionHint')}
                                </span>
                            </div>
                        </div>
                    )}




                    <GridCanvas
                        stageRef={stageRef}
                        width={containerRef.current ? containerRef.current.offsetWidth : 800}
                        height={containerRef.current ? containerRef.current.offsetHeight : 600}
                        gridData={gridData}
                        gridSize={gridSize}
                        scale={scale}
                        position={position}
                        activeTool={isSpacePressed ? 'move' : activeTool}
                        symbolDefs={allSymbols}
                        onUpdateCell={updateCell}
                        onWheel={handleWheel}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onTouchCancel={handleTouchEnd}
                        selectionStart={selectionStart}
                        selectionEnd={selectionEnd}
                        disabled={hasOpenModal || isAddingSymbol}
                        floatingBuffer={floatingBuffer}
                        onContextMenu={handleContextMenu}
                        hiddenZone={moveSource}
                        shapePreview={previewCells}
                        selectedColor={selectedColor}
                        selectedSymbol={selectedSymbol}
                        finalSelection={finalSelection}
                        shapeRotation={shapeRotation}
                        isRotationMode={isRotationMode}
                        shapeApplyTarget={shapeApplyTarget}
                    />

                    {/* Selection Context Menu */}
                    {showContextMenu && (
                        <div
                            className="absolute bg-white rounded-xl shadow-2xl border border-tan-200 py-2 z-50 min-w-[180px]"
                            style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
                        >
                            {finalSelection && (
                                <button onClick={handleSelectionCopy} className="w-full px-4 py-2.5 text-left hover:bg-cream-50 flex items-center gap-3 text-sm">
                                    <span className="text-stone-400">📋</span> {t('copy')}
                                </button>
                            )}
                            {clipboard && !finalSelection && (
                                <button onClick={handleSelectionPaste} className="w-full px-4 py-2.5 text-left hover:bg-cream-50 flex items-center gap-3 text-sm">
                                    <span className="text-stone-400">📋</span> {t('paste')}
                                </button>
                            )}
                            {finalSelection && (
                                <>
                                    <button onClick={handleSelectionCut} className="w-full px-4 py-2.5 text-left hover:bg-cream-50 flex items-center gap-3 text-sm">
                                        <span className="text-stone-400">✂️</span> {t('cut')}
                                    </button>
                                    <div className="h-px bg-tan-200 my-1" />
                                    <button onClick={handleSelectionMirrorH} className="w-full px-4 py-2.5 text-left hover:bg-cream-50 flex items-center gap-3 text-sm">
                                        <span className="text-stone-400">↔️</span> {t('flipH')}
                                    </button>
                                    <button onClick={handleSelectionMirrorV} className="w-full px-4 py-2.5 text-left hover:bg-cream-50 flex items-center gap-3 text-sm">
                                        <span className="text-stone-400">↕️</span> {t('flipV')}
                                    </button>
                                    <button onClick={enterRotationMode} className="w-full px-4 py-2.5 text-left hover:bg-cream-50 flex items-center gap-3 text-sm">
                                        <span className="text-stone-400">↻</span> {t('rotateMode')}
                                    </button>
                                    <div className="h-px bg-tan-200 my-1" />
                                    <button onClick={handleSelectionErase} className="w-full px-4 py-2.5 text-left hover:bg-cream-50 flex items-center gap-3 text-sm">
                                        <span className="text-stone-400">🗑️</span> {t('erase')}
                                    </button>
                                    <div className="h-px bg-tan-200 my-1" />
                                    <button onClick={handleSelectionCancel} className="w-full px-4 py-2.5 text-left hover:bg-cream-50 flex items-center gap-3 text-sm text-stone-500">
                                        <span className="text-stone-400">❌</span> {t('cancel')}
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Rotation Handle Overlay - ONLY in Rotation Mode (Handled by GridCanvas now) */}
                    {null}
                </div>

                {/* Right Sidebar */}
                <div className={`bg-white border-l border-tan-200 shadow-xl z-10 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-[85%] sm:w-80 opacity-100 absolute sm:relative right-0 top-0 bottom-0' : 'w-0 opacity-0 absolute sm:relative right-0 top-0 bottom-0'}`}>
                    <div className="p-6 overflow-y-auto flex-1 space-y-8">




                        {/* Grid Size Settings */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                                    <Settings size={14} /> {t('gridSize')}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2 bg-cream-50 p-3 rounded-xl border border-tan-100">
                                <div className="flex-1">
                                    <label className="text-[10px] text-stone-400 block mb-1">{t('width')}</label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="3000"
                                        className="w-full border border-tan-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-sage-400 outline-none text-center font-bold"
                                        value={localCols}
                                        onChange={e => setLocalCols(e.target.value)}
                                        onBlur={() => {
                                            const val = Math.max(5, Math.min(3000, parseInt(localCols) || 5));
                                            if (val !== gridSize.cols) {
                                                const newData = Array(gridSize.rows).fill(null).map((_, r) =>
                                                    Array(val).fill(null).map((_, c) => {
                                                        if (r < gridSize.rows && c < gridSize.cols) {
                                                            return gridData[r][c];
                                                        }
                                                        return { color: '#ffffff', symbolId: null };
                                                    })
                                                );
                                                setGridSize(prev => ({ ...prev, cols: val }));
                                                setGridData(newData);
                                                setIsDirty(true);
                                            } else {
                                                setLocalCols(val.toString());
                                            }
                                        }}
                                        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                                    />
                                </div>
                                <span className="text-stone-400 font-bold pt-4">×</span>
                                <div className="flex-1">
                                    <label className="text-[10px] text-stone-400 block mb-1">{t('height')}</label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="3000"
                                        className="w-full border border-tan-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-sage-400 outline-none text-center font-bold"
                                        value={localRows}
                                        onChange={e => setLocalRows(e.target.value)}
                                        onBlur={() => {
                                            const val = Math.max(5, Math.min(3000, parseInt(localRows) || 5));
                                            if (val !== gridSize.rows) {
                                                const newData = Array(val).fill(null).map((_, r) =>
                                                    Array(gridSize.cols).fill(null).map((_, c) => {
                                                        if (r < gridSize.rows && c < gridSize.cols) {
                                                            return gridData[r][c];
                                                        }
                                                        return { color: '#ffffff', symbolId: null };
                                                    })
                                                );
                                                setGridSize(prev => ({ ...prev, rows: val }));
                                                setGridData(newData);
                                                setIsDirty(true);
                                            } else {
                                                setLocalRows(val.toString());
                                            }
                                        }}
                                        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Symbols */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                                    <MousePointer2 size={14} /> {t('symbols')}
                                </h3>
                            </div>

                            <div className="grid grid-cols-4 gap-3">
                                {allSymbols.map(sym => (
                                    <div key={sym.id} className="relative">
                                        <button
                                            draggable
                                            onDragStart={(e) => {
                                                isDraggingRef.current = true;
                                                e.dataTransfer.setData('payload', JSON.stringify({ type: 'symbol', id: sym.id }));
                                            }}
                                            onDragEnd={() => {
                                                setTimeout(() => isDraggingRef.current = false, 100);
                                            }}
                                            onClick={() => {
                                                if (isDraggingRef.current) return;
                                                // Only switch to symbol tool if not using bucket/eyedropper
                                                if (activeTool !== 'bucket' && activeTool !== 'eyedropper') {
                                                    setActiveTool('symbol');
                                                }
                                                setSelectedSymbol(sym.id);
                                                setDeletingSymbol(null);
                                            }}
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                if (sym.type === 'custom') {
                                                    setDeletingSymbol(deletingSymbol === sym.id ? null : sym.id);
                                                }
                                            }}
                                            className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm
                                                ${selectedSymbol === sym.id && (activeTool === 'symbol' || (activeTool === 'bucket' && (bucketMode === 'both' || bucketMode === 'symbol')) || isSimultaneousDraw)
                                                    ? 'bg-stone-800 border-stone-800 ring-4 ring-stone-100 transform scale-105'
                                                    : 'bg-white border-tan-100 hover:border-sage-300 hover:shadow-md border-2'
                                                }`}
                                            title={sym.name}
                                        >
                                            <div className={`w-6 h-6 flex items-center justify-center font-bold text-lg ${selectedSymbol === sym.id && (activeTool === 'symbol' || (activeTool === 'bucket' && (bucketMode === 'both' || bucketMode === 'symbol')) || isSimultaneousDraw) ? 'text-white' : 'text-stone-700'
                                                }`}>
                                                {sym.label}
                                            </div>
                                        </button>

                                        {/* Delete Overlay (Custom Only) */}
                                        {deletingSymbol === sym.id && sym.type === 'custom' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCustomSymbols(p => p.filter(s => s.id !== sym.id));
                                                    setDeletingSymbol(null);
                                                    if (selectedSymbol === sym.id) setSelectedSymbol('knit');
                                                    setIsDirty(true);
                                                }}
                                                className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center text-white scale-105 animate-in fade-in zoom-in duration-200 z-10"
                                                title={t('clickToDelete')}
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {/* Add Symbol Button */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsAddingSymbol(!isAddingSymbol)}
                                        className="w-full aspect-square rounded-xl flex items-center justify-center bg-white border-2 border-dashed border-stone-300 text-stone-400 hover:text-sage-600 hover:border-sage-400 hover:bg-sage-50 transition-all shadow-sm hover:shadow-md"
                                        title={t('addSymbol.title')}
                                    >
                                        <Plus size={18} />
                                    </button>

                                    {/* Add Symbol Dropdown */}
                                    {isAddingSymbol && (
                                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl p-4 shadow-xl border border-tan-200 z-50 animate-in fade-in zoom-in-95 duration-200">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="font-bold text-sm text-stone-700">{t('addSymbol.title')}</h4>
                                                <button onClick={() => setIsAddingSymbol(false)} className="text-stone-400 hover:text-stone-600">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                <input
                                                    autoFocus
                                                    className="w-full border border-tan-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sage-400 outline-none"
                                                    placeholder={tEditor('stitchSymbols.addSymbol.namePlaceholder')}
                                                    value={newSymbolData.name}
                                                    onChange={e => setNewSymbolData(p => ({ ...p, name: e.target.value }))}
                                                />
                                                <input
                                                    className="w-full border border-tan-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sage-400 outline-none font-bold text-center"
                                                    placeholder={tEditor('stitchSymbols.addSymbol.symbolPlaceholder')}
                                                    maxLength={2}
                                                    value={newSymbolData.label}
                                                    onChange={e => setNewSymbolData(p => ({ ...p, label: e.target.value }))}
                                                />
                                                <button
                                                    onClick={handleAddSymbol}
                                                    disabled={!newSymbolData.name || !newSymbolData.label}
                                                    className="w-full bg-[#6B8E63] hover:bg-[#5A7853] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 rounded-lg transition-all text-sm"
                                                >
                                                    {tEditor('stitchSymbols.addSymbol.add')}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Colors */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider flex items-center gap-2">
                                    <PaintBucket size={14} /> Palette
                                </h3>
                            </div>

                            <div className="bg-cream-50 p-4 rounded-2xl border border-tan-100 flex flex-wrap gap-3">
                                {customColors.map((color, i) => (
                                    <div key={i} className="relative">
                                        <button
                                            draggable
                                            onDragStart={(e) => {
                                                isDraggingRef.current = true;
                                                e.dataTransfer.setData('payload', JSON.stringify({ type: 'color', color }));
                                            }}
                                            onDragEnd={() => {
                                                setTimeout(() => isDraggingRef.current = false, 100);
                                            }}
                                            onClick={() => {
                                                if (isDraggingRef.current) return;

                                                // Only switch to paint tool if not using bucket/eyedropper
                                                if (activeTool !== 'bucket' && activeTool !== 'eyedropper') {
                                                    setActiveTool('paint');
                                                }
                                                setSelectedColor(color);
                                                setDeletingColor(null);

                                                // If there is an active selection (Edit Mode), fill it immediately
                                                if (finalSelection) {
                                                    const newData = gridData.map(row => [...row]);
                                                    const { startRow, endRow, startCol, endCol } = finalSelection;
                                                    let changed = false;

                                                    for (let r = startRow; r <= endRow; r++) {
                                                        for (let c = startCol; c <= endCol; c++) {
                                                            if (newData[r][c].color !== color) {
                                                                newData[r][c] = { ...newData[r][c], color: color };
                                                                changed = true;
                                                            }
                                                        }
                                                    }

                                                    if (changed) {
                                                        setGridData(newData);
                                                        saveToHistory(newData);
                                                        setIsDirty(true);
                                                    }
                                                }
                                            }}
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                setDeletingColor(color === deletingColor ? null : color);
                                            }}
                                            className={`w-9 h-9 rounded-full shadow-sm transition-all duration-200 flex items-center justify-center ring-offset-1
                                                ${selectedColor === color && (activeTool === 'paint' || (activeTool === 'bucket' && (bucketMode === 'both' || bucketMode === 'color')) || isSimultaneousDraw)
                                                    ? 'ring-4 ring-sage-200 scale-110'
                                                    : 'hover:scale-110 hover:shadow-md ring-1 ring-black/5'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                        {/* Delete Overlay */}
                                        {deletingColor === color && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCustomColors(p => p.filter(c => c !== color));
                                                    setDeletingColor(null);
                                                    setIsDirty(true);
                                                    if (selectedColor === color) setSelectedColor(customColors[0] || '#ffffff');
                                                }}
                                                className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center text-white scale-110 animate-in fade-in zoom-in duration-200"
                                                title="Click to Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {/* Add New Color Button */}
                                <label className="relative w-9 h-9 rounded-full bg-white border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 hover:text-sage-600 hover:border-sage-400 hover:bg-sage-50 cursor-pointer transition-all shadow-sm hover:shadow-md" title="Add New Color">
                                    <Plus size={18} />
                                    <input
                                        type="color"
                                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                        onBlur={(e) => {
                                            const newColor = e.target.value;
                                            if (newColor && newColor !== '#000000') {
                                                if (!customColors.includes(newColor)) {
                                                    setCustomColors(prev => [...prev, newColor]);
                                                    setIsDirty(true);
                                                }
                                                setSelectedColor(newColor);
                                                if (activeTool !== 'bucket' && activeTool !== 'eyedropper') {
                                                    setActiveTool('paint');
                                                }
                                            }
                                        }}
                                        onInput={(e) => {
                                            // Preview color while picking but don't add yet
                                            setSelectedColor((e.target as HTMLInputElement).value);
                                        }}
                                    />
                                </label>
                            </div>
                            <p className="text-[10px] text-stone-400 text-right pr-2">* Right-click to delete</p>
                        </div>

                    </div>
                </div>
            </div>

            {/* Bottom Status Bar Removed */}

            {/* Add Symbol Modal */}
            {
                isAddingSymbol && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[10000] flex items-center justify-center">
                        <div className="bg-white rounded-2xl p-6 shadow-xl w-80 border border-tan-200 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg text-stone-800">심볼 추가</h3>
                                <button onClick={() => setIsAddingSymbol(false)} className="text-stone-400 hover:text-stone-600">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-stone-500 block mb-1">이름</label>
                                    <input
                                        autoFocus
                                        className="w-full border border-tan-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sage-400 outline-none"
                                        placeholder="예: 케이블"
                                        value={newSymbolData.name}
                                        onChange={e => setNewSymbolData(p => ({ ...p, name: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-stone-500 block mb-1">심볼 (1-2자)</label>
                                    <input
                                        className="w-full border border-tan-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sage-400 outline-none font-bold text-center"
                                        placeholder="예: C"
                                        maxLength={2}
                                        value={newSymbolData.label}
                                        onChange={e => setNewSymbolData(p => ({ ...p, label: e.target.value }))}
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        onClick={handleAddSymbol}
                                        disabled={!newSymbolData.name || !newSymbolData.label}
                                        className="w-full bg-[#6B8E63] hover:bg-[#5A7853] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95"
                                    >
                                        추가
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Grid Size Modal */}
            {
                showGridSizeModal && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[10000] flex items-center justify-center">
                        <div className="bg-white rounded-2xl p-6 shadow-xl w-96 border border-tan-200 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg text-stone-800">그리드 크기 설정</h3>
                                <button onClick={() => setShowGridSizeModal(false)} className="text-stone-400 hover:text-stone-600">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-stone-500 block mb-1">가로 (Columns)</label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="3000"
                                        className="w-full border border-tan-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sage-400 outline-none"
                                        value={tempGridSize.cols}
                                        onChange={e => setTempGridSize(p => ({ ...p, cols: Math.max(5, Math.min(3000, parseInt(e.target.value) || 5)) }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-stone-500 block mb-1">세로 (Rows)</label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="3000"
                                        className="w-full border border-tan-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sage-400 outline-none"
                                        value={tempGridSize.rows}
                                        onChange={e => setTempGridSize(p => ({ ...p, rows: Math.max(5, Math.min(3000, parseInt(e.target.value) || 5)) }))}
                                    />
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button
                                        onClick={() => setShowGridSizeModal(false)}
                                        className="flex-1 px-4 py-2.5 rounded-xl border-2 border-stone-200 text-stone-700 font-semibold hover:bg-stone-50 transition-all"
                                    >
                                        취소
                                    </button>
                                    <button
                                        onClick={() => {
                                            const newData = Array(tempGridSize.rows).fill(null).map((_, r) =>
                                                Array(tempGridSize.cols).fill(null).map((_, c) => {
                                                    if (r < gridSize.rows && c < gridSize.cols) {
                                                        return gridData[r][c];
                                                    }
                                                    return { color: '#ffffff', symbolId: null };
                                                })
                                            );
                                            setGridSize(tempGridSize);
                                            saveToHistory(newData);
                                            setGridData(newData);
                                            setShowGridSizeModal(false);
                                            hasCentered.current = false;
                                        }}
                                        className="flex-1 bg-[#6B8E63] hover:bg-[#5A7853] text-white font-bold py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95"
                                    >
                                        적용
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Publish Modal */}
            {
                showPublishModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] border border-tan-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center p-8 pb-4">
                                <h3 className="font-bold text-3xl text-stone-800 tracking-tight">{tPublish('title')}</h3>
                                <button onClick={() => setShowPublishModal(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-stone-600">
                                    <X size={28} />
                                </button>
                            </div>

                            {/* Modal Content Wrapper - Scrollable */}
                            <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar space-y-8">
                                {tempImage ? (
                                    <div>
                                        <h4 className="font-bold text-lg mb-4 text-center">이미지 자르기 (1:1 정사각형)</h4>
                                        <ImageCropper
                                            src={tempImage}
                                            aspectRatio={1}
                                            onCrop={(cropped) => {
                                                if (croppingTarget === 'main') {
                                                    setPublishMetadata(p => ({ ...p, imageUrl: cropped }));
                                                } else if (croppingTarget === 'new_sub') {
                                                    setPublishMetadata(p => ({
                                                        ...p,
                                                        additionalImages: [...(p.additionalImages || []), cropped]
                                                    }));
                                                } else if (typeof croppingTarget === 'number') {
                                                    setPublishMetadata(p => {
                                                        const newImages = [...(p.additionalImages || [])];
                                                        newImages[croppingTarget as number] = cropped;
                                                        return { ...p, additionalImages: newImages };
                                                    });
                                                }
                                                setTempImage(null);
                                                setCroppingTarget(null);
                                            }}
                                            onCancel={() => {
                                                setTempImage(null);
                                                setCroppingTarget(null);
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        {/* Main Image Section (REQUIRED) */}
                                        <div id="publish-image-field" className="space-y-4">
                                            <div className="flex justify-between items-end">
                                                <label className="text-base font-bold text-stone-800">{tPublish('fields.mainImage')} <span className="text-rose-500">*</span></label>
                                                <span className="text-xs text-stone-400">{tPublish('fields.mainImageHint')}</span>
                                            </div>

                                            <div className="border-2 border-dashed border-tan-200 rounded-xl p-4 text-center hover:bg-stone-50 transition-colors relative group mb-2">
                                                {!publishMetadata.imageUrl ? (
                                                    <>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleImageSelect(e, 'main')}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        />
                                                        <div className="py-8">
                                                            <ImageIcon className="mx-auto text-stone-400 mb-2" size={32} />
                                                            <p className="text-stone-500 font-medium">{tPublish('fields.uploadPlaceholder')}</p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="relative aspect-square w-full max-w-[200px] mx-auto overflow-hidden rounded-lg shadow-md">
                                                        <img src={publishMetadata.imageUrl} alt="Main" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => {
                                                                    setTempImage(publishMetadata.imageUrl || null);
                                                                    setCroppingTarget('main');
                                                                }}
                                                                className="bg-white text-stone-900 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-stone-100"
                                                            >
                                                                {tPublish('buttons.crop')}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setPublishMetadata(p => ({ ...p, imageUrl: undefined }));
                                                                }}
                                                                className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-600"
                                                            >
                                                                {tPublish('buttons.delete')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Tip for Image */}
                                            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex gap-2">
                                                <span className="text-amber-500 text-lg">💡</span>
                                                <p className="text-xs text-amber-700 leading-relaxed">
                                                    <span dangerouslySetInnerHTML={{ __html: tPublish.raw('fields.tip') }} />
                                                </p>
                                            </div>
                                        </div>

                                        {/* Sub Images Section (OPTIONAL) */}
                                        <div className="space-y-4">
                                            <label className="text-base font-bold text-stone-500 block">{tPublish('fields.subImages')}</label>
                                            <div className="grid grid-cols-5 gap-2">
                                                {publishMetadata.additionalImages?.map((img, idx) => (
                                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group shadow-sm border border-stone-100">
                                                        <img src={img} alt={`Sub ${idx}`} className="w-full h-full object-cover" />
                                                        <button
                                                            onClick={() => setPublishMetadata(p => ({
                                                                ...p,
                                                                additionalImages: p.additionalImages?.filter((_, i) => i !== idx)
                                                            }))}
                                                            className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-rose-500 transition-all"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ))}

                                                {(publishMetadata.additionalImages?.length || 0) < 10 && (
                                                    <div className="aspect-square border-2 border-dashed border-tan-200 rounded-lg flex flex-col items-center justify-center text-stone-400 hover:bg-stone-50 hover:border-sage-400 hover:text-sage-500 transition-all cursor-pointer relative">
                                                        <Plus size={24} />
                                                        <span className="text-xs font-bold mt-1">{tPublish('buttons.add')}</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleImageSelect(e, 'new_sub')}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {/* Basic Info Section */}
                                        <div className="space-y-6 pt-4 border-t border-stone-100">
                                            <div>
                                                <label className="text-base font-bold text-stone-800 block mb-2">{tPublish('fields.patternTitle')} <span className="text-rose-500">*</span></label>
                                                <input
                                                    type="text"
                                                    className="w-full border border-tan-200 rounded-2xl px-5 py-4 text-stone-800 font-bold text-lg focus:ring-2 focus:ring-rose-400 outline-none transition-all placeholder:text-stone-300"
                                                    value={publishMetadata.title}
                                                    onChange={e => setPublishMetadata(p => ({ ...p, title: e.target.value }))}
                                                    placeholder={tPublish('fields.patternTitlePlaceholder')}
                                                />
                                            </div>

                                            {/* Price Row (Full Width) */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center px-1">
                                                    <label className="text-base font-bold text-stone-800">
                                                        {tPublish('fields.price')} <span className="text-rose-500">*</span>
                                                        <span className="text-xs font-normal text-stone-400 ml-1.5">
                                                            ({router.toString().includes('/ko') ? 'KRW' : 'USD'})
                                                        </span>
                                                        <span className="text-xs font-bold text-rose-500 ml-3 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 animate-pulse-soft">
                                                            {locale === 'ko' ? '베타 기간 동안 무료 등록만 가능합니다.' : 'Currently only free in beta service'}
                                                        </span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer group bg-stone-50 px-3 py-1.5 rounded-full hover:bg-stone-100 transition-colors">
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${publishMetadata.price === 0 ? 'bg-rose-500 border-rose-500' : 'border-stone-300 group-hover:border-rose-400'}`}>
                                                            {publishMetadata.price === 0 && <Check size={10} className="text-white" />}
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={publishMetadata.price === 0}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    setPublishMetadata(p => ({ ...p, price: 0 }));
                                                                } else {
                                                                    setPublishMetadata(p => ({ ...p, price: router.toString().includes('/ko') ? 5000 / 1450 : 5 }));
                                                                }
                                                            }}
                                                        />
                                                        <span className="text-xs font-bold text-stone-500 group-hover:text-rose-600 transition-colors uppercase tracking-wider">{tPublish('fields.isFreeLabel')}</span>
                                                    </label>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step={router.toString().includes('/ko') ? "100" : "0.1"}
                                                        disabled={publishMetadata.price === 0}
                                                        className="w-full border border-tan-200 rounded-2xl px-6 py-5 text-stone-800 font-bold text-2xl focus:ring-4 focus:ring-rose-100 outline-none disabled:bg-stone-50 disabled:text-stone-300 transition-all font-mono"
                                                        value={
                                                            publishMetadata.price === 0 ? '0' :
                                                                (router.toString().includes('/ko')
                                                                    ? Math.round(publishMetadata.price * 1450)
                                                                    : publishMetadata.price.toFixed(2))
                                                        }
                                                        onChange={e => {
                                                            const val = parseFloat(e.target.value) || 0;
                                                            const priceInUsd = router.toString().includes('/ko') ? val / 1450 : val;
                                                            setPublishMetadata(prev => ({ ...prev, price: priceInUsd }));
                                                        }}
                                                    />
                                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-sm text-stone-400 font-bold bg-white px-2 pointer-events-none">
                                                        {router.toString().includes('/ko')
                                                            ? `≈ $${publishMetadata.price.toFixed(2)}`
                                                            : `≈ ₩${Math.round(publishMetadata.price * 1450).toLocaleString()}`
                                                        }
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Craft Type Row (Full Width) */}
                                            <div className="space-y-2">
                                                <label className="text-base font-bold text-stone-800 block px-1">{tPublish('fields.craftType')} <span className="text-rose-500">*</span></label>
                                                <div className="grid grid-cols-4 gap-2 bg-stone-100 p-1.5 rounded-2xl">
                                                    {(['knitting', 'crochet', 'mixed', 'other'] as const).map((type) => (
                                                        <button
                                                            key={type}
                                                            type="button"
                                                            onClick={() => setPublishMetadata(p => ({ ...p, craftType: type }))}
                                                            className={`py-3.5 rounded-xl text-sm font-bold transition-all border shadow-sm ${publishMetadata.craftType === type ? 'bg-white text-rose-600 border-rose-100' : 'text-stone-500 border-transparent hover:bg-white/50 hover:text-stone-800'}`}
                                                        >
                                                            {tPublish(`options.${type}`)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Categories Row */}
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-base font-bold text-stone-800 block mb-2">{tPublish('fields.category')} <span className="text-rose-500">*</span></label>
                                                    <select
                                                        className="w-full border border-tan-200 rounded-2xl px-5 py-4 text-stone-800 font-bold text-lg focus:ring-4 focus:ring-rose-100 outline-none bg-white appearance-none cursor-pointer transition-all"
                                                        value={publishMetadata.category}
                                                        onChange={e => setPublishMetadata(p => ({ ...p, category: e.target.value, subcategory: '' }))}
                                                    >
                                                        {Object.entries(CATEGORY_TAXONOMY).map(([key, val]) => (
                                                            <option key={key} value={key}>{val.label[locale as 'en' | 'ko']}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div id="publish-subcategory-field">
                                                    <label className="text-base font-bold text-stone-800 block mb-2">{tPublish('fields.subcategory')} <span className="text-rose-500">*</span></label>
                                                    <select
                                                        className="w-full border border-tan-200 rounded-2xl px-5 py-4 text-stone-800 font-bold text-lg focus:ring-4 focus:ring-rose-100 outline-none disabled:bg-stone-50 disabled:text-stone-400 bg-white appearance-none cursor-pointer transition-all"
                                                        value={publishMetadata.subcategory || ''}
                                                        onChange={e => setPublishMetadata(p => ({ ...p, subcategory: e.target.value }))}
                                                        disabled={!publishMetadata.category}
                                                    >
                                                        <option value="" disabled>{tPublish('options.select')}</option>
                                                        {CATEGORY_TAXONOMY[publishMetadata.category as keyof typeof CATEGORY_TAXONOMY]?.sub.map((sub) => (
                                                            <option key={sub.id} value={sub.id}>{sub.label[locale as 'en' | 'ko']}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Structured Size Info Row (Added to match PublishPatternModal) */}
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center px-1">
                                                    <label className="text-base font-bold text-stone-800">
                                                        {locale === 'ko' ? '완성 사이즈' : 'Finished Sizes'} <span className="text-rose-500">*</span>
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPublishMetadata(p => ({
                                                            ...p,
                                                            sizeParts: [...(p.sizeParts || []), { id: crypto.randomUUID(), name: '', detail: '' }]
                                                        }))}
                                                        className="text-sm font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1"
                                                    >
                                                        <Plus size={14} />
                                                        {locale === 'ko' ? '사이즈 추가' : 'Add Size'}
                                                    </button>
                                                </div>

                                                <div className="space-y-3">
                                                    {(publishMetadata.sizeParts || []).map((part, idx) => (
                                                        <div key={part.id} className="bg-stone-50 rounded-2xl p-4 border border-stone-200 relative group animate-in slide-in-from-top-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setPublishMetadata(p => ({
                                                                    ...p,
                                                                    sizeParts: p.sizeParts?.filter(item => item.id !== part.id)
                                                                }))}
                                                                className="absolute top-2 right-2 text-stone-400 hover:text-rose-500 p-1 rounded-full hover:bg-rose-50 transition-colors"
                                                            >
                                                                <X size={14} />
                                                            </button>

                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                {/* Size Name */}
                                                                <div>
                                                                    <label className="text-xs font-bold text-stone-500 block mb-1">{locale === 'ko' ? '사이즈 명' : 'Size Name'}</label>
                                                                    <input
                                                                        type="text"
                                                                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold text-stone-800 focus:ring-2 focus:ring-rose-100 outline-none"
                                                                        value={part.name}
                                                                        onChange={e => setPublishMetadata(p => ({
                                                                            ...p,
                                                                            sizeParts: p.sizeParts?.map(item => item.id === part.id ? { ...item, name: e.target.value } : item)
                                                                        }))}
                                                                        placeholder={locale === 'ko' ? 'S' : 'e.g., S'}
                                                                    />
                                                                </div>

                                                                {/* Detail */}
                                                                <div className="md:col-span-2">
                                                                    <label className="text-xs font-bold text-stone-500 block mb-1">{locale === 'ko' ? '상세 치수' : 'Dimensions'}</label>
                                                                    <input
                                                                        type="text"
                                                                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold text-stone-800 focus:ring-2 focus:ring-rose-100 outline-none"
                                                                        value={part.detail}
                                                                        onChange={e => setPublishMetadata(p => ({
                                                                            ...p,
                                                                            sizeParts: p.sizeParts?.map(item => item.id === part.id ? { ...item, detail: e.target.value } : item)
                                                                        }))}
                                                                        placeholder={locale === 'ko' ? '가슴 50cm, 총장 60cm' : 'e.g., Chest 50cm, Length 60cm'}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {(!publishMetadata.sizeParts || publishMetadata.sizeParts.length === 0) && (
                                                        <div
                                                            onClick={() => setPublishMetadata(p => ({
                                                                ...p,
                                                                sizeParts: [...(p.sizeParts || []), { id: crypto.randomUUID(), name: '', detail: '' }]
                                                            }))}
                                                            className="border-2 border-dashed border-tan-200 rounded-2xl p-6 flex flex-col items-center justify-center text-stone-400 hover:bg-stone-50 hover:border-sage-400 hover:text-sage-500 transition-all cursor-pointer"
                                                        >
                                                            <Plus size={24} className="mb-2" />
                                                            <span className="text-sm font-bold">{locale === 'ko' ? '사이즈 정보 추가' : 'Add Size Info'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>


                                            {/* Optional Details Row (Yarn Weight, Yardage) */}
                                            <div className="grid grid-cols-1 gap-6">
                                                {/* Yarn Parts Repeater */}
                                                <div id="publish-yarn-parts-field" className="space-y-3">
                                                    <div className="flex justify-between items-center px-1">
                                                        <label className="text-base font-bold text-stone-800">{tPublish('fields.yarnParts')} <span className="text-rose-500">*</span></label>
                                                        <button
                                                            type="button"
                                                            onClick={() => setPublishMetadata(p => ({
                                                                ...p,
                                                                yarnParts: [...(p.yarnParts || []), { id: crypto.randomUUID(), partName: '', yarnName: '', amount: '', needle: '' }]
                                                            }))}
                                                            className="text-sm font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1"
                                                        >
                                                            <Plus size={14} />
                                                            {locale === 'ko' ? '파트 추가' : 'Add Part'}
                                                        </button>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {(publishMetadata.yarnParts || []).map((part, idx) => (
                                                            <div key={part.id} className="bg-stone-50 rounded-2xl p-4 border border-stone-200 relative group animate-in slide-in-from-top-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setPublishMetadata(p => ({
                                                                        ...p,
                                                                        yarnParts: p.yarnParts?.filter(item => item.id !== part.id)
                                                                    }))}
                                                                    className="absolute top-2 right-2 text-stone-400 hover:text-rose-500 p-1 rounded-full hover:bg-rose-50 transition-colors"
                                                                    title={tPublish('fields.removePart')}
                                                                >
                                                                    <X size={14} />
                                                                </button>

                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                                    {/* Part Name */}
                                                                    <div className="md:col-span-2">
                                                                        <label className="text-xs font-bold text-stone-500 block mb-1">{tPublish('fields.partName')}</label>
                                                                        <input
                                                                            type="text"
                                                                            className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold text-stone-800 focus:ring-2 focus:ring-rose-100 outline-none"
                                                                            value={part.partName}
                                                                            onChange={e => setPublishMetadata(p => ({
                                                                                ...p,
                                                                                yarnParts: p.yarnParts?.map(item => item.id === part.id ? { ...item, partName: e.target.value } : item)
                                                                            }))}
                                                                            placeholder={tPublish('fields.partNamePlaceholder')}
                                                                        />
                                                                    </div>

                                                                    {/* Yarn Name */}
                                                                    <div>
                                                                        <label className="text-xs font-bold text-stone-500 block mb-1">{tPublish('fields.yarnName')}</label>
                                                                        <input
                                                                            type="text"
                                                                            className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold text-stone-800 focus:ring-2 focus:ring-rose-100 outline-none"
                                                                            value={part.yarnName}
                                                                            onChange={e => setPublishMetadata(p => ({
                                                                                ...p,
                                                                                yarnParts: p.yarnParts?.map(item => item.id === part.id ? { ...item, yarnName: e.target.value } : item)
                                                                            }))}
                                                                            placeholder={tPublish('fields.yarnNamePlaceholder')}
                                                                        />
                                                                    </div>

                                                                    {/* Technique */}
                                                                    <div>
                                                                        <label className="text-xs font-bold text-stone-500 block mb-1">{tPublish('fields.partTechnique')}</label>
                                                                        <input
                                                                            type="text"
                                                                            className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold text-stone-800 focus:ring-2 focus:ring-rose-100 outline-none"
                                                                            value={part.technique || ''}
                                                                            onChange={e => setPublishMetadata(p => ({
                                                                                ...p,
                                                                                yarnParts: p.yarnParts?.map(item => item.id === part.id ? { ...item, technique: e.target.value } : item)
                                                                            }))}
                                                                            placeholder={tPublish('fields.techniquePlaceholder')}
                                                                        />
                                                                    </div>

                                                                    {/* Needle Size */}
                                                                    <div>
                                                                        <label className="text-xs font-bold text-stone-500 block mb-1">{tPublish('fields.partNeedle')}</label>
                                                                        <NeedleSelector
                                                                            value={part.needle}
                                                                            onChange={val => setPublishMetadata(p => ({
                                                                                ...p,
                                                                                yarnParts: p.yarnParts?.map(item => item.id === part.id ? { ...item, needle: val } : item)
                                                                            }))}
                                                                            placeholder="Select Size"
                                                                        />
                                                                    </div>

                                                                    {/* Gauge */}
                                                                    <div>
                                                                        <label className="text-xs font-bold text-stone-500 block mb-1">{tPublish('fields.partGauge')}</label>
                                                                        <div className="flex gap-2">
                                                                            <div className="relative flex-1">
                                                                                <input
                                                                                    type="text"
                                                                                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold text-stone-800 focus:ring-2 focus:ring-rose-100 outline-none"
                                                                                    value={part.gauge?.split(' ')[0]?.replace(/[^0-9]/g, '') || ''}
                                                                                    onChange={e => {
                                                                                        const sts = e.target.value.replace(/[^0-9]/g, '');
                                                                                        const rows = part.gauge?.split(' ')[1]?.replace(/[^0-9]/g, '') || '';
                                                                                        setPublishMetadata(p => ({
                                                                                            ...p,
                                                                                            yarnParts: p.yarnParts?.map(item => item.id === part.id ? { ...item, gauge: `${sts}${tPublish('fields.gaugeStitchPlaceholder')} ${rows}${tPublish('fields.gaugeRowPlaceholder')}` } : item)
                                                                                        }));
                                                                                    }}
                                                                                    placeholder="0"
                                                                                />
                                                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">{tPublish('fields.gaugeStitchPlaceholder')}</span>
                                                                            </div>
                                                                            <div className="relative flex-1">
                                                                                <input
                                                                                    type="text"
                                                                                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold text-stone-800 focus:ring-2 focus:ring-rose-100 outline-none"
                                                                                    value={part.gauge?.split(' ')[1]?.replace(/[^0-9]/g, '') || ''}
                                                                                    onChange={e => {
                                                                                        const sts = part.gauge?.split(' ')[0]?.replace(/[^0-9]/g, '') || '';
                                                                                        const rows = e.target.value.replace(/[^0-9]/g, '');
                                                                                        setPublishMetadata(p => ({
                                                                                            ...p,
                                                                                            yarnParts: p.yarnParts?.map(item => item.id === part.id ? { ...item, gauge: `${sts}${tPublish('fields.gaugeStitchPlaceholder')} ${rows}${tPublish('fields.gaugeRowPlaceholder')}` } : item)
                                                                                        }));
                                                                                    }}
                                                                                    placeholder="0"
                                                                                />
                                                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">{tPublish('fields.gaugeRowPlaceholder')}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Amount */}
                                                                    <div className="md:col-span-2">
                                                                        <label className="text-xs font-bold text-stone-500 block mb-1">{tPublish('fields.partAmount')}</label>
                                                                        <UnitInput
                                                                            value={part.amount}
                                                                            onChange={val => setPublishMetadata(p => ({
                                                                                ...p,
                                                                                yarnParts: p.yarnParts?.map(item => item.id === part.id ? { ...item, amount: val } : item)
                                                                            }))}
                                                                            placeholder={tPublish('fields.amountPlaceholder')}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {(!publishMetadata.yarnParts || publishMetadata.yarnParts.length === 0) && (
                                                            <div
                                                                onClick={() => setPublishMetadata(p => ({
                                                                    ...p,
                                                                    yarnParts: [...(p.yarnParts || []), { id: crypto.randomUUID(), partName: '', yarnName: '', amount: '', needle: '' }]
                                                                }))}
                                                                className="border-2 border-dashed border-tan-200 rounded-2xl p-6 flex flex-col items-center justify-center text-stone-400 hover:bg-stone-50 hover:border-sage-400 hover:text-sage-500 transition-all cursor-pointer"
                                                            >
                                                                <Plus size={24} className="mb-2" />
                                                                <span className="text-sm font-bold">{tPublish('fields.addPart')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Gauge Info Row Removed */}

                                                {/* Needle Size Row Removed */}
                                            </div>

                                            {/* (Replaced by single gauge field above) */}

                                            {/* Used Colors Display (Auto-populated) */}
                                            {publishMetadata.usedColors && publishMetadata.usedColors.length > 0 && (
                                                <div>
                                                    <label className="text-sm font-bold text-stone-500 block mb-2">{tPublish('fields.usedColors')} ({publishMetadata.usedColors.length})</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {publishMetadata.usedColors.map((color, i) => (
                                                            <div key={i} className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-full border border-stone-200">
                                                                <div className="w-4 h-4 rounded-full border border-stone-300" style={{ backgroundColor: color }}></div>
                                                                <span className="text-xs text-stone-600">{color}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Descriptions */}
                                            <div className="space-y-8 pt-8 border-t border-stone-100">
                                                <div id="publish-brief-desc-field">
                                                    <div className="flex justify-between items-baseline mb-3 px-1">
                                                        <label className="text-base font-bold text-stone-800">{tPublish('fields.briefDescription')} <span className="text-rose-500">*</span></label>
                                                        <span className="text-xs text-stone-400 font-medium">{tPublish('fields.briefDescriptionHint')}</span>
                                                    </div>
                                                    <div className="rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-rose-100 transition-all">
                                                        <RichTextEditor
                                                            content={publishMetadata.briefDescription}
                                                            onChange={content => setPublishMetadata(p => ({ ...p, briefDescription: content }))}
                                                            placeholder={tPublish('fields.briefDescriptionPlaceholder')}
                                                            minHeight="320px"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex justify-between items-center mb-3 px-1">
                                                        <label className="text-base font-bold text-stone-800 whitespace-nowrap">{tPublish('fields.detailedDescription')}</label>
                                                        <span className="bg-brown-100 text-brown-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                            {tPublish('fields.detailedDescriptionTag')}
                                                        </span>
                                                    </div>
                                                    <div className="rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-rose-100 transition-all">
                                                        <RichTextEditor
                                                            content={publishMetadata.detailedDescription || ''}
                                                            onChange={content => setPublishMetadata(p => ({ ...p, detailedDescription: content }))}
                                                            placeholder={tPublish('fields.detailedDescriptionHint')}
                                                            minHeight="320px"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Hashtags Section */}
                                            <div id="publish-hashtags-field">
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className="text-sm font-bold text-stone-800">
                                                        {tPublish('fields.hashtags')} <span className="text-rose-500">*</span>
                                                    </label>
                                                    <span className={`text-xs font-medium ${publishMetadata.hashtags.length < 3 ? 'text-rose-500' : publishMetadata.hashtags.length >= 10 ? 'text-amber-500' : 'text-sage-500'}`}>
                                                        {publishMetadata.hashtags.length}/10 ({publishMetadata.hashtags.length < 3 ? `${3 - publishMetadata.hashtags.length} more needed` : 'OK'})
                                                    </span>
                                                </div>
                                                <p className="text-xs text-stone-400 mb-2">{tPublish('fields.hashtagsHint')}</p>

                                                {/* Tag Display */}
                                                <div className="flex flex-wrap gap-2.5 mb-4">
                                                    {publishMetadata.hashtags.map((tag, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="inline-flex items-center gap-2 px-3 py-2 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold border border-rose-100 shadow-sm animate-in fade-in zoom-in-95"
                                                        >
                                                            #{tag}
                                                            <button
                                                                type="button"
                                                                onClick={() => setPublishMetadata(p => ({
                                                                    ...p,
                                                                    hashtags: p.hashtags.filter((_, i) => i !== idx)
                                                                }))}
                                                                className="text-rose-400 hover:text-rose-600 transition-colors"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* Tag Input */}
                                                {publishMetadata.hashtags.length < 10 && (
                                                    <div className="relative">
                                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-lg">#</span>
                                                        <input
                                                            type="text"
                                                            className="w-full border border-tan-200 rounded-2xl pl-10 pr-5 py-4 text-stone-800 font-bold text-lg focus:ring-4 focus:ring-rose-100 outline-none transition-all placeholder:text-stone-300"
                                                            placeholder={tPublish('fields.hashtagPlaceholder')}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' || e.key === ',') {
                                                                    e.preventDefault();
                                                                    const input = e.currentTarget;
                                                                    const value = input.value.trim().replace(/^#/, '').replace(/,/g, '');
                                                                    if (value && !publishMetadata.hashtags.includes(value) && publishMetadata.hashtags.length < 10) {
                                                                        setPublishMetadata(p => ({
                                                                            ...p,
                                                                            hashtags: [...p.hashtags, value]
                                                                        }));
                                                                        input.value = '';
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={handlePublish}
                                                disabled={isPublishing}
                                                className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold py-5 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 text-xl mt-6 flex items-center justify-center gap-3 cursor-pointer"
                                            >
                                                {isPublishing ? (
                                                    <>
                                                        <Loader2 className="w-6 h-6 animate-spin" />
                                                        {tPublish('publishing')}
                                                    </>
                                                ) : tPublish('buttons.submit')}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
            {
                showSaveSuccess && (
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#6B8E63] text-white px-8 py-6 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] z-[10000] animate-toast flex flex-col items-center gap-4 border border-white/20 min-w-[280px]">
                        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white">
                            <Check size={28} strokeWidth={3} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold">{tPublish('success.saveTitle')}</h3>
                            <p className="text-sm text-white/80 mt-1">{tPublish('success.saveDesc')}</p>
                        </div>
                    </div>
                )
            }
            {
                showPublishSuccess && (
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-rose-500 text-white px-8 py-6 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] z-[10000] animate-toast flex flex-col items-center gap-4 border border-white/20 min-w-[280px]">
                        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white">
                            <Check size={28} strokeWidth={3} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold">
                                {tPublish('success.publishTitle')}
                            </h3>
                            <p className="text-sm text-white/80 mt-1">
                                {tPublish('success.publishDesc')}
                            </p>
                        </div>
                    </div>
                )
            }
            {
                customAlert && (
                    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[10001] flex items-center justify-center p-4">
                        <div className="bg-white rounded-[32px] p-8 max-w-sm w-full mx-4 shadow-2xl border border-tan-100 transform scale-100 transition-all duration-200 animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-xl font-bold text-stone-800 mb-2 flex items-center gap-2">
                                <span>{customAlert.title}</span>
                            </h3>
                            <p className="text-stone-600 text-sm mb-6 leading-relaxed whitespace-pre-line">
                                {customAlert.message}
                            </p>
                            <div className="flex gap-3 justify-end">
                                {customAlert.onCancel && (
                                    <button
                                        onClick={() => {
                                            customAlert.onCancel?.();
                                            setCustomAlert(null);
                                        }}
                                        className="px-5 py-2.5 rounded-2xl border border-tan-200 text-stone-500 font-bold hover:bg-cream-50 hover:text-stone-700 transition-all text-sm cursor-pointer"
                                    >
                                        {locale === 'ko' ? '취소' : 'Cancel'}
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        customAlert.onConfirm();
                                        setCustomAlert(null);
                                    }}
                                    className="px-6 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-soft hover:shadow-lg transition-all text-sm cursor-pointer"
                                >
                                    {locale === 'ko' ? '확인' : 'OK'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

// Helper to handle hidden input ref
function setInputRef(element: HTMLInputElement | null) {
    // Just a placeholder to adapt the ref callback
}

