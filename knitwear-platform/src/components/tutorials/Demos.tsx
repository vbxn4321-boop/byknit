// Demos.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { 
    Grid, Image as ImageIcon, Calculator, Languages, Play, Store, 
    MousePointer, Sparkles, Check, ArrowRight, Save, Info, AlertTriangle, Upload, Sliders, RefreshCw,
    Copy, FileText, Globe
} from 'lucide-react';

// ==========================================
// 1. 도안 에디터 벡터 시연 플레이어
// ==========================================
interface CellData {
    color: string;
    symbol: string;
}

export function VectorEditorDemo({ locale }: { locale: string }) {
    const emptyGrid = (): CellData[][] => 
        Array(12).fill(null).map(() => Array(12).fill({ color: '#ffffff', symbol: '' }));
    
    const [grid, setGrid] = useState<CellData[][]>(emptyGrid());
    const [mouse, setMouse] = useState({ x: 90, y: 85 });
    const [mouseClicked, setMouseClicked] = useState(false);
    
    const [activeTool, setActiveTool] = useState<'symbol' | 'paint' | 'eraser' | null>(null);
    const [activeSymbol, setActiveSymbol] = useState<string>('');
    const [activeColor, setActiveColor] = useState<string>('#ffffff');
    const [ripple, setRipple] = useState<{ x: number; y: number; show: boolean }>({ x: 0, y: 0, show: false });
    const [toast, setToast] = useState<string | null>(null);
    const [time, setTime] = useState(0);
    const loopDuration = 18000;
    const isMounted = useRef(true);

    const heartStitches = [
        { r: 2, c: 3 }, { r: 2, c: 4 }, { r: 2, c: 7 }, { r: 2, c: 8 },
        { r: 3, c: 2 }, { r: 3, c: 3 }, { r: 3, c: 4 }, { r: 3, c: 5 }, { r: 3, c: 6 }, { r: 3, c: 7 }, { r: 3, c: 8 }, { r: 3, c: 9 },
        { r: 4, c: 1 }, { r: 4, c: 2 }, { r: 4, c: 3 }, { r: 4, c: 4 }, { r: 4, c: 5 }, { r: 4, c: 6 }, { r: 4, c: 7 }, { r: 4, c: 8 }, { r: 4, c: 9 }, { r: 4, c: 10 },
        { r: 5, c: 1 }, { r: 5, c: 2 }, { r: 5, c: 3 }, { r: 5, c: 4 }, { r: 5, c: 5 }, { r: 5, c: 6 }, { r: 5, c: 7 }, { r: 5, c: 8 }, { r: 5, c: 9 }, { r: 5, c: 10 },
        { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 }, { r: 6, c: 6 }, { r: 6, c: 7 }, { r: 6, c: 8 }, { r: 6, c: 9 },
        { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }, { r: 7, c: 6 }, { r: 7, c: 7 }, { r: 7, c: 8 },
        { r: 8, c: 4 }, { r: 8, c: 5 }, { r: 8, c: 6 }, { r: 8, c: 7 },
        { r: 9, c: 5 }, { r: 9, c: 6 }
    ];

    const getCellCoords = (r: number, c: number) => {
        const colWidth = (85 - 35) / 12;
        const rowHeight = (82 - 22) / 12;
        return {
            x: 35 + c * colWidth + colWidth / 2,
            y: 22 + r * rowHeight + rowHeight / 2
        };
    };

    useEffect(() => {
        isMounted.current = true;
        let lastTime = performance.now();
        let animationFrameId: number;

        const updateFrame = (now: number) => {
            if (!isMounted.current) return;
            const delta = now - lastTime;
            lastTime = now;
            setTime((prevTime) => (prevTime + delta) % loopDuration);
            animationFrameId = requestAnimationFrame(updateFrame);
        };
        animationFrameId = requestAnimationFrame(updateFrame);
        return () => {
            isMounted.current = false;
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    useEffect(() => {
        if (time >= 0 && time < 1000) {
            setMouse({ x: 90, y: 85 });
            setMouseClicked(false);
            setGrid(emptyGrid());
            setActiveTool(null);
            setActiveSymbol('');
            setActiveColor('#ffffff');
            setToast(null);
        }
        else if (time >= 1000 && time < 1800) {
            const progress = (time - 1000) / 800;
            const ease = 1 - Math.pow(1 - progress, 3);
            setMouse({
                x: 90 + (12 - 90) * ease,
                y: 85 + (25 - 85) * ease
            });
            if (time > 1750 && !activeTool) {
                setMouseClicked(true);
                setRipple({ x: 12, y: 25, show: true });
                setActiveTool('symbol');
                setActiveSymbol('|');
                setTimeout(() => setRipple(r => ({ ...r, show: false })), 400);
            }
        }
        else if (time >= 1800 && time < 2200) {
            setMouseClicked(false);
        }
        else if (time >= 2200 && time < 3200) {
            const progress = (time - 2200) / 1000;
            const ease = 1 - Math.pow(1 - progress, 3);
            setMouse({
                x: 12 + (12 - 12) * ease,
                y: 25 + (56 - 25) * ease
            });
            if (time > 3150 && activeColor === '#ffffff') {
                setMouseClicked(true);
                setRipple({ x: 12, y: 56, show: true });
                setActiveColor('#F28E9B');
                setActiveTool('paint');
                setTimeout(() => setRipple(r => ({ ...r, show: false })), 400);
            }
        }
        else if (time >= 3200 && time < 3600) {
            setMouseClicked(false);
        }
        else if (time >= 3600 && time < 9500) {
            const totalStitches = heartStitches.length;
            const drawDuration = 5500;
            const elapsed = time - 3600;
            const progress = Math.min(elapsed / drawDuration, 1);
            
            const currentIndex = Math.floor(progress * (totalStitches - 1));
            const currentPoint = heartStitches[currentIndex];
            const nextPoint = heartStitches[Math.min(currentIndex + 1, totalStitches - 1)];
            
            const cellCoords = getCellCoords(currentPoint.r, currentPoint.c);
            const nextCoords = getCellCoords(nextPoint.r, nextPoint.c);
            const subProgress = (progress * (totalStitches - 1)) - currentIndex;
            
            setMouse({
                x: cellCoords.x + (nextCoords.x - cellCoords.x) * subProgress,
                y: cellCoords.y + (nextCoords.y - cellCoords.y) * subProgress
            });
            setMouseClicked(true);

            setGrid((prev) => {
                const nextGrid = prev.map(row => [...row]);
                for (let i = 0; i <= currentIndex; i++) {
                    const st = heartStitches[i];
                    nextGrid[st.r][st.c] = { color: '#F28E9B', symbol: '|' };
                }
                return nextGrid;
            });
        }
        else if (time >= 9500 && time < 10000) {
            setMouseClicked(false);
        }
        else if (time >= 10000 && time < 11000) {
            const progress = (time - 10000) / 1000;
            const ease = 1 - Math.pow(1 - progress, 3);
            const startCoords = getCellCoords(heartStitches[heartStitches.length - 1].r, heartStitches[heartStitches.length - 1].c);
            setMouse({
                x: startCoords.x + (12 - startCoords.x) * ease,
                y: startCoords.y + (35 - startCoords.y) * ease
            });
            if (time > 10950 && activeSymbol !== '-') {
                setMouseClicked(true);
                setRipple({ x: 12, y: 35, show: true });
                setActiveSymbol('-');
                setActiveTool('symbol');
                setTimeout(() => setRipple(r => ({ ...r, show: false })), 400);
            }
        }
        else if (time >= 11000 && time < 11400) {
            setMouseClicked(false);
        }
        else if (time >= 11400 && time < 12400) {
            const progress = (time - 11400) / 1000;
            const ease = 1 - Math.pow(1 - progress, 3);
            setMouse({
                x: 12 + (20 - 12) * ease,
                y: 35 + (56 - 35) * ease
            });
            if (time > 12350 && activeColor !== '#A3B899') {
                setMouseClicked(true);
                setRipple({ x: 20, y: 56, show: true });
                setActiveColor('#A3B899');
                setActiveTool('paint');
                setTimeout(() => setRipple(r => ({ ...r, show: false })), 400);
            }
        }
        else if (time >= 12400 && time < 12800) {
            setMouseClicked(false);
        }
        else if (time >= 12800 && time < 14500) {
            if (time < 13600) {
                const progress = (time - 12800) / 700;
                const ease = 1 - Math.pow(1 - progress, 2);
                const target = getCellCoords(2, 2);
                setMouse({
                    x: 20 + (target.x - 20) * ease,
                    y: 56 + (target.y - 56) * ease
                });
                if (time > 13450 && grid[2][2].color !== '#A3B899') {
                    setMouseClicked(true);
                    setRipple({ ...target, show: true });
                    setGrid(prev => {
                        const next = prev.map(row => [...row]);
                        next[2][2] = { color: '#A3B899', symbol: '-' };
                        return next;
                    });
                    setTimeout(() => setRipple(r => ({ ...r, show: false })), 400);
                }
            } else {
                setMouseClicked(false);
                const progress = (time - 13600) / 800;
                const ease = 1 - Math.pow(1 - progress, 2);
                const start = getCellCoords(2, 2);
                const target = getCellCoords(2, 9);
                setMouse({
                    x: start.x + (target.x - start.x) * ease,
                    y: start.y + (target.y - start.y) * ease
                });
                if (time > 14350 && grid[2][9].color !== '#A3B899') {
                    setMouseClicked(true);
                    setRipple({ ...target, show: true });
                    setGrid(prev => {
                        const next = prev.map(row => [...row]);
                        next[2][9] = { color: '#A3B899', symbol: '-' };
                        return next;
                    });
                    setTimeout(() => setRipple(r => ({ ...r, show: false })), 400);
                }
            }
        }
        else if (time >= 14500 && time < 14800) {
            setMouseClicked(false);
        }
        else if (time >= 14800 && time < 16000) {
            const progress = (time - 14800) / 1100;
            const ease = 1 - Math.pow(1 - progress, 3);
            const start = getCellCoords(2, 9);
            setMouse({
                x: start.x + (88 - start.x) * ease,
                y: start.y + (10 - start.y) * ease
            });
            if (time > 15850 && !toast) {
                setMouseClicked(true);
                setRipple({ x: 88, y: 10, show: true });
                setToast(locale === 'ko' 
                    ? '💾 도안 에디터 저장 완료! (byKnit 클라우드에 안전하게 보관됨)' 
                    : '💾 Pattern Editor Saved! (Synced to byKnit Cloud)'
                );
                setTimeout(() => setRipple(r => ({ ...r, show: false })), 400);
            }
        }
        else if (time >= 16000 && time < 17200) {
            setMouseClicked(false);
        }
        else if (time >= 17200 && time < 18000) {
            setToast(null);
            setMouseClicked(false);
        }
    }, [time, locale]);

    const getSubtitleMessage = () => {
        if (time < 1000) return locale === 'ko' ? '시연 준비 중...' : 'Preparing Demo...';
        if (time >= 1000 && time < 2200) return locale === 'ko' ? '1. 좌측 툴바에서 첫 번째 뜨개 기호 [겉뜨기]를 선택합니다.' : '1. Select the first knitting stitch [Knit St] on the toolbar.';
        if (time >= 2200 && time < 3600) return locale === 'ko' ? '2. 사용할 배색용 [핑크색 실]을 선택합니다.' : '2. Select the [Peach Pink Yarn] for pattern coloring.';
        if (time >= 3600 && time < 9500) return locale === 'ko' ? '3. 캔버스 위를 클릭 및 드래그하며 핑크색 하트를 예쁘게 그립니다.' : '3. Click and drag on the grid to paint a lovely pink heart.';
        if (time >= 9500 && time < 11400) return locale === 'ko' ? '4. 기호를 [안뜨기]로 변경해 디테일을 더해봅니다.' : '4. Swap the symbol to [Purl St] to add decorative elements.';
        if (time >= 11400 && time < 12800) return locale === 'ko' ? '5. 실 색상을 상큼한 [민트색]으로 변경합니다.' : '5. Change the thread color to a fresh [Sage Mint].';
        if (time >= 12800 && time < 14800) return locale === 'ko' ? '6. 하트 양쪽 외곽에 포인트 코를 콕콕 찍어 채색을 채워갑니다.' : '6. Stamp decorative mint units on the corners of the heart.';
        if (time >= 14800 && time < 16500) return locale === 'ko' ? '7. 우측 상단 [임시 저장]을 눌러 클라우드에 안전하게 도안을 동기화합니다.' : '7. Click [Save] in the header to synchronize the pattern draft.';
        return locale === 'ko' ? '시연 완료! 잠시 후 처음부터 다시 시작합니다.' : 'Demo complete! Restarting in a moment.';
    };

    return (
        <div className="w-full relative bg-[#FAF6F0] rounded-2xl border border-[#EFE7DC] shadow-soft overflow-hidden p-4 md:p-6 flex flex-col justify-between" style={{ height: '480px' }}>
            <div className="flex justify-between items-center mb-4 border-b border-[#EFE7DC] pb-3 select-none">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="text-xs font-black text-stone-400 ml-2 font-mono uppercase tracking-wider">{locale === 'ko' ? '도안 에디터 플레이어 (실시간 60FPS)' : 'Pattern Editor Player (Live 60fps)'}</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-white border border-[#EFE7DC] rounded-lg text-[10px] font-black text-stone-500 shadow-sm flex items-center gap-1.5">
                        <Save className="w-3.5 h-3.5 text-[#F28E9B]" />
                        <span>{locale === 'ko' ? '임시 저장' : 'Save Draft'}</span>
                    </div>
                    <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest bg-rose-50 border border-rose-100 px-2 py-0.5 rounded flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F28E9B] animate-ping" /> PLAYING
                    </div>
                </div>
            </div>

            <div className="relative grid grid-cols-4 gap-4" style={{ height: '310px' }}>
                <div className="col-span-1 bg-white border border-[#EFE7DC] rounded-xl p-3 flex flex-col justify-between shadow-sm select-none">
                    <div>
                        <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">{locale === 'ko' ? '뜨개 기호' : 'STITCHES'}</h4>
                        <div className="space-y-1.5">
                            <div className={`p-2 rounded-lg border text-[11px] font-bold flex items-center justify-between transition-all ${activeSymbol === '|' ? 'bg-rose-50 border-[#F28E9B] text-rose-500 scale-[1.02]' : 'border-stone-100 bg-stone-50/50 text-stone-500'}`}>
                                <span>{locale === 'ko' ? '겉뜨기 (K)' : 'Knit (K)'}</span>
                                <span className="font-mono px-1.5 py-0.2 bg-stone-200/50 rounded font-black text-[10px]">|</span>
                            </div>
                            <div className={`p-2 rounded-lg border text-[11px] font-bold flex items-center justify-between transition-all ${activeSymbol === '-' ? 'bg-rose-50 border-[#F28E9B] text-rose-500 scale-[1.02]' : 'border-stone-100 bg-stone-50/50 text-stone-500'}`}>
                                <span>{locale === 'ko' ? '안뜨기 (P)' : 'Purl (P)'}</span>
                                <span className="font-mono px-1.5 py-0.2 bg-stone-200/50 rounded font-black text-[10px]">-</span>
                            </div>
                            <div className="p-2 rounded-lg border border-stone-100 bg-stone-50/50 text-stone-300 text-[11px] font-bold flex items-center justify-between opacity-50">
                                <span>{locale === 'ko' ? '바늘비우기 (yo)' : 'Yarn Over'}</span>
                                <span className="font-mono px-1 rounded font-black text-[9px]">o</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100">
                        <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">{locale === 'ko' ? '실 색상' : 'YARN'}</h4>
                        <div className="flex gap-2">
                            <div className={`w-6 h-6 rounded-full cursor-pointer border-2 transition-all ${activeColor === '#F28E9B' ? 'border-rose-400 scale-110 shadow-sm' : 'border-transparent'}`} style={{ backgroundColor: '#F28E9B' }} />
                            <div className={`w-6 h-6 rounded-full cursor-pointer border-2 transition-all ${activeColor === '#A3B899' ? 'border-emerald-400 scale-110 shadow-sm' : 'border-transparent'}`} style={{ backgroundColor: '#A3B899' }} />
                            <div className="w-6 h-6 rounded-full border border-stone-150 opacity-40" style={{ backgroundColor: '#B8A399' }} />
                            <div className="w-6 h-6 rounded-full border border-stone-150 opacity-40" style={{ backgroundColor: '#8E9BF2' }} />
                        </div>
                    </div>
                </div>

                <div className="col-span-3 bg-white border border-[#EFE7DC] rounded-xl flex items-center justify-center p-3 shadow-sm relative overflow-hidden">
                    <div className="grid grid-cols-12 gap-px bg-[#EFE7DC] p-px border border-[#EFE7DC] rounded-lg" style={{ width: '240px', height: '240px' }}>
                        {grid.map((row, rIdx) => 
                            row.map((cell, cIdx) => (
                                <div 
                                    key={`${rIdx}-${cIdx}`}
                                    className="bg-white flex items-center justify-center font-mono text-[9px] font-black transition-all select-none duration-150"
                                    style={{ 
                                        backgroundColor: cell.color,
                                        color: cell.color === '#ffffff' ? '#C2B8AA' : '#ffffff',
                                        fontSize: '8px'
                                    }}
                                >
                                    {cell.symbol}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {ripple.show && (
                    <div 
                        className="absolute pointer-events-none rounded-full border-4 border-rose-400/80 animate-ping z-50 bg-rose-200/20"
                        style={{
                            left: `${ripple.x}%`,
                            top: `${ripple.y}%`,
                            width: '32px',
                            height: '32px',
                            transform: 'translate(-50%, -50%)',
                            animationDuration: '0.4s'
                        }}
                    />
                )}

                <div 
                    className="absolute pointer-events-none transition-all duration-75 ease-out z-50 flex items-center justify-center"
                    style={{
                        left: `${mouse.x}%`,
                        top: `${mouse.y}%`,
                        transform: `translate(-6px, -6px) scale(${mouseClicked ? 0.85 : 1})`,
                    }}
                >
                    <MousePointer className="w-6 h-6 text-stone-800 fill-white drop-shadow-md filter" />
                </div>
            </div>

            {toast && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-stone-900/90 backdrop-blur-sm text-white text-[11px] font-black px-4 py-2.5 rounded-full shadow-lg border border-stone-700/50 flex items-center gap-2 z-50 animate-in slide-in-from-bottom-2 duration-300">
                    <Check className="w-3.5 h-3.5 text-[#F28E9B] stroke-[3]" />
                    <span>{toast}</span>
                </div>
            )}

            <div className="mt-4 p-3 bg-white border border-[#EFE7DC] rounded-xl flex items-start gap-2.5 shadow-inner">
                <Info className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
                <div>
                    <h5 className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">{locale === 'ko' ? '시연 가이드 자막' : 'DEMO SUBTITLES'}</h5>
                    <p className="text-xs text-stone-600 font-extrabold leading-normal transition-all duration-300">
                        {getSubtitleMessage()}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 2. 차트 변환기 벡터 시연 플레이어
// ==========================================
export function VectorConverterDemo({ locale }: { locale: string }) {
    const [mouse, setMouse] = useState({ x: 92, y: 88 });
    const [mouseClicked, setMouseClicked] = useState(false);
    const [ripple, setRipple] = useState<{ x: number; y: number; show: boolean }>({ x: 0, y: 0, show: false });
    const [toast, setToast] = useState<string | null>(null);
    const [time, setTime] = useState(0);
    const loopDuration = 18000;
    const isMounted = useRef(true);

    // 가상 상태 모델
    const [isUploaded, setIsUploaded] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [widthSlider, setWidthSlider] = useState(15);
    const [colorSlider, setColorSlider] = useState(2);
    const [isConverting, setIsConverting] = useState(false);
    const [convertProgress, setConvertProgress] = useState(0);
    const [isConverted, setIsConverted] = useState(false);

    // 귀여운 뜨개 강아지 격자배색 데이터 (14x14)
    // w: #FAF6F0 (바탕 크림), b: #8B5A2B (브라운 실), d: #3A3530 (다크 챠콜), p: #F28E9B (피치 핑크)
    const w = '#ffffff';
    const b = '#B8A399';
    const d = '#3A3530';
    const p = '#FCE8E6';
    
    const dogGrid: string[][] = [
        [w,w,w,w,w,w,w,w,w,w,w,w,w,w],
        [w,w,w,b,b,w,w,w,w,b,b,w,w,w],
        [w,w,b,b,b,b,w,w,b,b,b,b,w,w],
        [w,b,b,b,b,b,b,b,b,b,b,b,b,w],
        [w,b,b,d,d,b,b,b,b,d,d,b,b,w],
        [b,b,b,d,d,b,b,b,b,d,d,b,b,b],
        [b,b,b,b,b,b,d,d,b,b,b,b,b,b],
        [b,b,b,b,b,d,d,d,d,b,b,b,b,b],
        [w,b,b,b,b,b,d,d,b,b,b,b,b,w],
        [w,w,b,b,p,p,p,p,p,p,b,b,w,w],
        [w,w,w,b,b,p,p,p,p,b,b,w,w,w],
        [w,w,w,w,b,b,b,b,b,b,w,w,w,w],
        [w,w,w,w,w,w,b,b,w,w,w,w,w,w],
        [w,w,w,w,w,w,w,w,w,w,w,w,w,w]
    ];

    useEffect(() => {
        isMounted.current = true;
        let lastTime = performance.now();
        let animationFrameId: number;

        const updateFrame = (now: number) => {
            if (!isMounted.current) return;
            const delta = now - lastTime;
            lastTime = now;
            setTime((prevTime) => (prevTime + delta) % loopDuration);
            animationFrameId = requestAnimationFrame(updateFrame);
        };
        animationFrameId = requestAnimationFrame(updateFrame);
        return () => {
            isMounted.current = false;
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    useEffect(() => {
        // 0s ~ 1.0s 초기화
        if (time >= 0 && time < 1000) {
            setMouse({ x: 92, y: 88 });
            setMouseClicked(false);
            setIsUploaded(false);
            setIsUploading(false);
            setWidthSlider(15);
            setColorSlider(2);
            setIsConverting(false);
            setConvertProgress(0);
            setIsConverted(false);
            setToast(null);
        }
        // 1.0s ~ 2.2s 이미지 업로드 박스로 부드럽게 비행 (좌표: x: 25%, y: 25%)
        else if (time >= 1000 && time < 2200) {
            const progress = (time - 1000) / 1200;
            const ease = 1 - Math.pow(1 - progress, 3);
            setMouse({
                x: 92 + (25 - 92) * ease,
                y: 88 + (25 - 88) * ease
            });
            if (time > 2150 && !isUploading && !isUploaded) {
                setMouseClicked(true);
                setRipple({ x: 25, y: 25, show: true });
                setIsUploading(true);
                setTimeout(() => setRipple(r => ({ ...r, show: false })), 400);
            }
        }
        else if (time >= 2200 && time < 3400) {
            setMouseClicked(false);
            // 업로드 로딩 1.2초 모사
            if (time >= 3200 && !isUploaded) {
                setIsUploading(false);
                setIsUploaded(true);
            }
        }
        // 3.4s ~ 6.0s 가상 마우스가 가로 코 너비 슬라이더 손잡이로 비행 후 드래그 (x: 22% -> 38%, y: 53%)
        else if (time >= 3400 && time < 5000) {
            const progress = (time - 3400) / 1600;
            const ease = 1 - Math.pow(1 - progress, 3);
            setMouse({
                x: 25 + (22 - 25) * ease,
                y: 25 + (53 - 25) * ease
            });
        }
        else if (time >= 5000 && time < 7200) {
            // 드래그 진행
            setMouseClicked(true);
            const progress = (time - 5000) / 2200;
            const currentX = 22 + (38 - 22) * progress;
            setMouse({ x: currentX, y: 53 });
            // 슬라이더 숫자 15 -> 32 동적 매핑
            setWidthSlider(Math.round(15 + (32 - 15) * progress));
        }
        else if (time >= 7200 && time < 7800) {
            setMouseClicked(false);
        }
        // 7.8s ~ 9.5s 최대 색상 수 슬라이더 손잡이로 비행 후 드래그 (x: 22% -> 28%, y: 72%)
        else if (time >= 7850 && time < 8800) {
            const progress = (time - 7850) / 950;
            const ease = 1 - Math.pow(1 - progress, 3);
            setMouse({
                x: 38 + (22 - 38) * ease,
                y: 53 + (72 - 53) * ease
            });
        }
        else if (time >= 8800 && time < 9600) {
            setMouseClicked(true);
            const progress = (time - 8800) / 800;
            const currentX = 22 + (28 - 22) * progress;
            setMouse({ x: currentX, y: 72 });
            setColorSlider(Math.round(2 + (4 - 2) * progress));
        }
        else if (time >= 9600 && time < 10200) {
            setMouseClicked(false);
        }
        // 10.2s ~ 11.2s 차트로 변환하기 버튼으로 비행 (좌표: x: 25%, y: 88%)
        else if (time >= 10200 && time < 11400) {
            const progress = (time - 10200) / 1200;
            const ease = 1 - Math.pow(1 - progress, 3);
            setMouse({
                x: 28 + (25 - 28) * ease,
                y: 72 + (88 - 72) * ease
            });
            if (time > 11350 && !isConverting && !isConverted) {
                setMouseClicked(true);
                setRipple({ x: 25, y: 88, show: true });
                setIsConverting(true);
                setTimeout(() => setRipple(r => ({ ...r, show: false })), 400);
            }
        }
        else if (time >= 11400 && time < 14000) {
            setMouseClicked(false);
            // AI 변환 중 로딩 0% -> 100% 매핑
            const progress = Math.min((time - 11400) / 2200, 1);
            setConvertProgress(Math.round(progress * 100));
            if (progress >= 1 && !isConverted) {
                setIsConverting(false);
                setIsConverted(true);
            }
        }
        // 14.0s ~ 16.5s 우측 하단 "에디터 연동" 버튼으로 비행 후 클릭 (x: 75%, y: 90%)
        else if (time >= 14000 && time < 15500) {
            const progress = (time - 14000) / 1500;
            const ease = 1 - Math.pow(1 - progress, 3);
            setMouse({
                x: 25 + (75 - 25) * ease,
                y: 88 + (90 - 88) * ease
            });
            if (time > 15450 && !toast) {
                setMouseClicked(true);
                setRipple({ x: 75, y: 90, show: true });
                setToast(locale === 'ko' 
                    ? '🪄 차트 데이터를 도안 에디터로 성공적으로 연동했습니다!' 
                    : '🪄 Chart synced to Pattern Editor successfully!'
                );
                setTimeout(() => setRipple(r => ({ ...r, show: false })), 400);
            }
        }
        else if (time >= 15500 && time < 17000) {
            setMouseClicked(false);
        }
        else if (time >= 17000 && time < 18000) {
            setToast(null);
            setMouseClicked(false);
        }
    }, [time, locale]);

    const getSubtitleMessage = () => {
        if (time < 1000) return locale === 'ko' ? '시연 준비 중...' : 'Preparing Converter Demo...';
        if (time >= 1000 && time < 2200) return locale === 'ko' ? '1. 이미지 업로드 영역을 클릭해 강아지 프로필 사진을 선택합니다.' : '1. Click to select a puppy profile photo.';
        if (time >= 2200 && time < 3400) return locale === 'ko' ? '강아지 원본 사진 업로드 성공! (AI 기하학적 패스 구성 완료)' : 'Dog image uploaded! (AI structural path map initialized)';
        if (time >= 3400 && time < 7800) return locale === 'ko' ? `2. [차트 가로 너비(코)] 슬라이더를 부드럽게 드래그하여 ${widthSlider}코로 설정합니다.` : `2. Drag [Chart Width (Sts)] slider to set size to ${widthSlider} stitches.`;
        if (time >= 7800 && time < 10200) return locale === 'ko' ? `3. [최대 색상 수] 슬라이더를 당겨 사용할 실 개수를 ${colorSlider}색으로 조절합니다.` : `3. Adjust [Max Colors] slider to set limits to ${colorSlider} palette colors.`;
        if (time >= 10200 && time < 11400) return locale === 'ko' ? '4. 하단의 [🪄 차트로 변환하기] 버튼을 기분 좋게 클릭합니다.' : '4. Click the bottom [🪄 Convert to Chart] button.';
        if (time >= 11400 && time < 14000) return locale === 'ko' ? `AI 엔진 연산 및 색상 양자화 변환 매핑 중... (${convertProgress}%)` : `AI Engine computing & color quantization mapping... (${convertProgress}%)`;
        if (time >= 14000 && time < 15500) return locale === 'ko' ? '5. 완료! 오른쪽 미리보기에 픽셀화된 뜨개 강아지 배색 차트가 렌더링되었습니다.' : '5. Success! The pixelated dog chart is rendered in the preview.';
        if (time >= 15500 && time < 17000) return locale === 'ko' ? '6. [에디터에서 수정]을 클릭해 추가 세밀 드로잉을 위해 도안을 에디터로 보냅니다.' : '6. Click [Edit in Editor] to sync chart details to your active project.';
        return locale === 'ko' ? '시연 루프 완료! 잠시 후 처음부터 재생됩니다.' : 'Loop finished! Restarting dog conversion...';
    };

    return (
        <div className="w-full relative bg-[#FAF6F0] rounded-2xl border border-[#EFE7DC] shadow-soft overflow-hidden p-4 md:p-6 flex flex-col justify-between" style={{ height: '480px' }}>
            <div className="flex justify-between items-center mb-3 border-b border-[#EFE7DC] pb-3 select-none">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="text-xs font-black text-stone-400 ml-2 font-mono uppercase tracking-wider">{locale === 'ko' ? '차트 변환기 시뮬레이터' : 'AI Chart Converter Simulator'}</span>
                </div>
                <div className="text-[10px] font-black text-[#F28E9B] uppercase tracking-widest bg-rose-50 border border-rose-100 px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F28E9B] animate-pulse" /> LIVE SIM
                </div>
            </div>



            <div className="relative grid grid-cols-2 gap-4" style={{ height: '320px' }}>
                <div className="flex flex-col gap-2 overflow-y-auto pr-1">
                    <div className="bg-white border border-[#EFE7DC] rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-inner relative" style={{ height: '115px' }}>
                        {isUploading ? (
                            <div className="flex flex-col items-center justify-center gap-2">
                                <RefreshCw className="w-6 h-6 text-[#F28E9B] animate-spin" />
                                <span className="text-[9px] font-black text-stone-400">Loading Image...</span>
                            </div>
                        ) : isUploaded ? (
                            <div className="w-full h-full flex flex-col items-center justify-center p-1 select-none">
                                <svg viewBox="0 0 100 100" className="w-12 h-12 mb-1 drop-shadow-sm">
                                    <circle cx="50" cy="50" r="45" fill="#FAF6F0" stroke="#EFE7DC" strokeWidth="2" />
                                    <path d="M22 35 C15 50 15 65 24 72 C28 65 28 50 25 35 Z" fill="#B8A399" />
                                    <path d="M78 35 C85 50 85 65 76 72 C72 65 72 50 75 35 Z" fill="#B8A399" />
                                    <circle cx="50" cy="53" r="28" fill="#B8A399" />
                                    <ellipse cx="50" cy="57" r="20" fill="#ffffff" />
                                    <circle cx="42" cy="48" r="4" fill="#3A3530" />
                                    <circle cx="58" cy="48" r="4" fill="#3A3530" />
                                    <circle cx="43" cy="47" r="1.2" fill="#ffffff" />
                                    <circle cx="59" cy="47" r="1.2" fill="#ffffff" />
                                    <polygon points="46,55 54,55 50,60" fill="#3A3530" />
                                    <circle cx="34" cy="57" r="4.5" fill="#FCE8E6" />
                                    <circle cx="66" cy="57" r="4.5" fill="#FCE8E6" />
                                </svg>
                                <span className="text-[9px] font-black text-[#F28E9B] uppercase font-mono tracking-widest bg-rose-50 px-2 py-0.2 rounded-full border border-rose-100">dog_profile.jpg</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center select-none">
                                <div className="w-8 h-8 rounded-full bg-stone-50 border border-stone-150 flex items-center justify-center mb-1.5">
                                    <Upload className="w-4 h-4 text-stone-400" />
                                </div>
                                <span className="text-[10px] font-extrabold text-[#3A3530] mb-0.5">{locale === 'ko' ? '이미지를 끌어다 놓으세요' : 'Drag & Drop Image'}</span>
                                <span className="text-[8px] font-black text-stone-400">{locale === 'ko' ? '클릭하여 폴더에서 선택' : 'or click to browse folder'}</span>
                            </div>
                        )}
                    </div>

                    <div className="bg-white border border-[#EFE7DC] rounded-xl p-3 flex flex-col gap-2.5 shadow-sm text-stone-600 select-none">
                        <div className="flex items-center gap-1.5 border-b border-stone-50 pb-1.5">
                            <Sliders className="w-3.5 h-3.5 text-[#F28E9B]" />
                            <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-widest">{locale === 'ko' ? '변환 설정' : 'SETTINGS'}</h4>
                        </div>
                        
                        <div>
                            <div className="flex justify-between text-[9px] font-black mb-1 text-stone-400">
                                <span>{locale === 'ko' ? '차트 가로 너비 (코)' : 'Chart Width (Sts)'}</span>
                                <span className="text-stone-700 font-mono">{widthSlider}</span>
                            </div>
                            <div className="h-1.5 bg-stone-100 rounded-full relative overflow-hidden border border-stone-200/50">
                                <div className="absolute top-0 left-0 h-full bg-[#F28E9B]" style={{ width: `${(widthSlider / 50) * 100}%` }} />
                                <div 
                                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#F28E9B] shadow-sm cursor-pointer"
                                    style={{ left: `calc(${(widthSlider / 50) * 100}% - 7px)` }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-[9px] font-black mb-1 text-stone-400">
                                <span>{locale === 'ko' ? '최대 색상 수' : 'Max Colors'}</span>
                                <span className="text-stone-700 font-mono">{colorSlider}</span>
                            </div>
                            <div className="h-1.5 bg-stone-100 rounded-full relative overflow-hidden border border-stone-200/50">
                                <div className="absolute top-0 left-0 h-full bg-[#F28E9B]" style={{ width: `${(colorSlider / 8) * 100}%` }} />
                                <div 
                                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#F28E9B] shadow-sm cursor-pointer"
                                    style={{ left: `calc(${(colorSlider / 8) * 100}% - 7px)` }}
                                />
                            </div>
                        </div>

                        <div className="pt-1.5">
                            <button
                                disabled={!isUploaded || isConverting}
                                className={`w-full py-2 rounded-xl text-[10px] font-black text-white flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 ${
                                    isConverting 
                                    ? 'bg-[#ea939e]' 
                                    : isUploaded 
                                    ? 'bg-[#F28E9B] hover:bg-[#e07b88]' 
                                    : 'bg-stone-300 shadow-none cursor-not-allowed text-stone-400'
                                }`}
                            >
                                <Sparkles className="w-3.5 h-3.5 text-white animate-spin-slow" />
                                <span>
                                    {isConverting 
                                        ? `${locale === 'ko' ? 'AI 분석 중...' : 'AI Quantizing...'} (${convertProgress}%)` 
                                        : locale === 'ko' ? '🪄 차트로 변환하기' : '🪄 Convert to Chart'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="col-span-1 bg-white border border-[#EFE7DC] rounded-xl flex flex-col justify-between p-3.5 shadow-sm relative overflow-hidden select-none">
                    <div className="border-b border-stone-50 pb-2 flex justify-between items-center">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{locale === 'ko' ? '차트 미리보기' : 'CHART PREVIEW'}</span>
                        {isConverted && (
                            <span className="text-[8px] font-black text-green-500 uppercase tracking-widest bg-green-50 px-1.5 py-0.2 border border-green-150 rounded">Success</span>
                        )}
                    </div>

                    {isConverting && (
                        <div className="flex-1 flex flex-col items-center justify-center p-4">
                            <div className="w-8 h-8 rounded-full border-4 border-rose-50 border-t-[#F28E9B] animate-spin mb-2" />
                            <div className="w-24 bg-stone-100 rounded-full h-1 overflow-hidden border border-stone-200/50">
                                <div className="bg-[#F28E9B] h-full transition-all duration-150" style={{ width: `${convertProgress}%` }} />
                            </div>
                        </div>
                    )}

                    {!isConverting && !isConverted && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-stone-400 select-none">
                            <ImageIcon className="w-10 h-10 text-stone-200 mb-2 animate-pulse" />
                            <span className="text-[10px] font-extrabold text-stone-400">{locale === 'ko' ? '차트 미리보기가 표시됩니다' : 'Chart Preview Area'}</span>
                            <span className="text-[8px] font-black text-stone-300 max-w-[140px] leading-relaxed mt-0.5">
                                {locale === 'ko' ? '왼쪽 패널에 사진을 넣고 변환을 시작하세요!' : 'Upload a dog profile photo and hit convert to render.'}
                            </span>
                        </div>
                    )}

                    {!isConverting && isConverted && (
                        <div className="flex-1 flex items-center justify-center p-3 animate-in fade-in zoom-in duration-300">
                            <div className="grid grid-cols-14 gap-px bg-[#EFE7DC] p-px rounded border border-[#EFE7DC]" style={{ width: '154px', height: '154px' }}>
                                {dogGrid.map((row, rIdx) => 
                                    row.map((cellColor, cIdx) => (
                                        <div 
                                            key={`${rIdx}-${cIdx}`}
                                            className="bg-white flex items-center justify-center font-mono select-none transition-colors duration-200"
                                            style={{ 
                                                backgroundColor: cellColor,
                                                width: '10px',
                                                height: '10px'
                                            }}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    <div className="pt-2 border-t border-stone-50 select-none">
                        <button
                            disabled={!isConverted}
                            className={`w-full py-2 rounded-lg text-[9px] font-black text-white flex items-center justify-center gap-1 transition-all ${
                                isConverted 
                                ? 'bg-stone-900 hover:bg-stone-850 active:scale-95 shadow-md' 
                                : 'bg-stone-100 text-stone-300 cursor-not-allowed'
                            }`}
                        >
                            <span>{locale === 'ko' ? '에디터에서 수정하기' : 'Edit in Pattern Editor'}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-white" />
                        </button>
                    </div>
                </div>

                {ripple.show && (
                    <div 
                        className="absolute pointer-events-none rounded-full border-4 border-rose-400/80 animate-ping z-50 bg-rose-200/20"
                        style={{
                            left: `${ripple.x}%`,
                            top: `${ripple.y}%`,
                            width: '32px',
                            height: '32px',
                            transform: 'translate(-50%, -50%)',
                            animationDuration: '0.4s'
                        }}
                    />
                )}

                <div 
                    className="absolute pointer-events-none transition-all duration-75 ease-out z-50 flex items-center justify-center"
                    style={{
                        left: `${mouse.x}%`,
                        top: `${mouse.y}%`,
                        transform: `translate(-6px, -6px) scale(${mouseClicked ? 0.85 : 1})`,
                    }}
                >
                    <MousePointer className="w-6 h-6 text-stone-800 fill-white drop-shadow-md filter" />
                </div>
            </div>

            {toast && (
                <div className="absolute top-28 left-1/2 -translate-x-1/2 bg-stone-900/90 backdrop-blur-sm text-white text-[11px] font-black px-4 py-2.5 rounded-full shadow-lg border border-stone-700/50 flex items-center gap-2 z-50 animate-in slide-in-from-bottom-2 duration-300">
                    <Check className="w-3.5 h-3.5 text-[#F28E9B] stroke-[3]" />
                    <span>{toast}</span>
                </div>
            )}

            <div className="mt-4 p-3 bg-white border border-[#EFE7DC] rounded-xl flex items-start gap-2.5 shadow-inner select-none">
                <Info className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
                <div>
                    <h5 className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">{locale === 'ko' ? '시연 가이드 자막' : 'DEMO SUBTITLES'}</h5>
                    <p className="text-xs text-stone-600 font-extrabold leading-normal transition-all duration-300">
                        {getSubtitleMessage()}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 3. AI 도안 번역기 벡터 시연 플레이어
// ==========================================
export function VectorTranslatorDemo({ locale }: { locale: string }) {
    const [mouse, setMouse] = useState({ x: 92, y: 88 });
    const [mouseClicked, setMouseClicked] = useState(false);
    const [ripple, setRipple] = useState<{ x: number; y: number; show: boolean }>({ x: 0, y: 0, show: false });
    const [toast, setToast] = useState<string | null>(null);
    const [time, setTime] = useState(0);
    const loopDuration = 18000;
    const isMounted = useRef(true);

    // 가상 상태 모델
    const [isTyping, setIsTyping] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [translateProgress, setTranslateProgress] = useState(0);
    const [isTranslated, setIsTranslated] = useState(false);
    const [hoveredTerm, setHoveredTerm] = useState<'K' | 'P' | 'yo' | 'k2tog' | null>(null);
    const [userHoveredTerm, setUserHoveredTerm] = useState<'K' | 'P' | 'yo' | 'k2tog' | null>(null);

    const baseEnglish = `Row 1: *K2, P2; rep from * to end.\\nRow 2: *yo, k2tog, K2; rep from * to end.`;
    const typedSuffix = `\\nRow 3: *K1, P1; rep from * to end.`;
    const [englishInput, setEnglishInput] = useState(baseEnglish);

    const translatedKorean = `Row 1: *K2, P2; rep from * to end.\\n➡️ 1단: *겉뜨기(K) 2코, 안뜨기(P) 2코; 반복하여 끝까지 진행.\\n\\nRow 2: *yo, k2tog, K2; rep from * to end.\\n➡️ 2단: *바늘비우기(yo), 왼코겹치기(k2tog), 겉뜨기(K) 2코; 반복하여 끝까지 진행.\\n\\nRow 3: *K1, P1; rep from * to end.\\n➡️ 3단: *겉뜨기(K) 1코, 안뜨기(P) 1코; 반복하여 끝까지 진행.`;
    const [koreanOutput, setKoreanOutput] = useState('');

    const glossaryDb = {
        K: {
            term: 'K (Knit)',
            kor: '겉뜨기',
            desc: {
                ko: '뜨개질의 가장 기본적인 코로, 실을 대바늘 뒤에 두고 앞에서 뒤로 찔러 넣어 루프를 앞으로 끌어오는 기법입니다.',
                en: 'The most basic knitting stitch, where the yarn is held in back and pulled through the stitch from front to back.'
            }
        },
        P: {
            term: 'P (Purl)',
            kor: '안뜨기',
            desc: {
                ko: '실을 대바늘 앞에 두고 뒤에서 앞으로 찔러 넣어 루프를 뒤로 끌어오는 기법으로, 겉뜨기와 반대 모양을 만듭니다.',
                en: 'The second most basic stitch, where the yarn is held in front and pulled through the stitch from back to front.'
            }
        },
        yo: {
            term: 'yo (Yarn Over)',
            kor: '바늘비우기',
            desc: {
                ko: '실을 바늘에 한 바퀴 걸쳐 감아 의도적인 구멍(비침무늬)을 만들며 코를 늘리는 시각적인 뜨개 기법입니다.',
                en: 'Wrap the yarn around the needle once to create a decorative hole (eyelet) and increase the stitch count.'
            }
        },
        k2tog: {
            term: 'k2tog (Knit 2 Together)',
            kor: '왼코겹치기',
            desc: {
                ko: '두 개의 코를 동시에 겉뜨기하여 한 코로 줄이는 기법으로, 편물이 오른쪽에서 왼쪽으로 기울어지게 만듭니다.',
                en: 'Knit two stitches together at the same time to decrease the stitch count by one, slanting to the right.'
            }
        }
    };

    useEffect(() => {
        isMounted.current = true;
        let lastTime = performance.now();
        let animationFrameId: number;

        const updateFrame = (now: number) => {
            if (!isMounted.current) return;
            const delta = now - lastTime;
            lastTime = now;
            setTime((prevTime) => (prevTime + delta) % loopDuration);
            animationFrameId = requestAnimationFrame(updateFrame);
        };
        animationFrameId = requestAnimationFrame(updateFrame);
        return () => {
            isMounted.current = false;
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    useEffect(() => {
        // 0s ~ 1.0s 초기화
        if (time >= 0 && time < 1000) {
            setMouse({ x: 92, y: 88 });
            setMouseClicked(false);
            setIsTyping(false);
            setIsTranslating(false);
            setTranslateProgress(0);
            setIsTranslated(false);
            setHoveredTerm(null);
            setEnglishInput(baseEnglish);
            setKoreanOutput('');
            setToast(null);
        }
        // 1.0s ~ 2.0s 가상 마우스가 원문 입력창 끝(x: 35%, y: 35%)으로 이동
        else if (time >= 1000 && time < 2000) {
            const progress = (time - 1000) / 1000;
            const ease = 1 - Math.pow(1 - progress, 3);
            setMouse({
                x: 92 + (35 - 92) * ease,
                y: 88 + (35 - 88) * ease
            });
            if (time > 1950 && !isTyping && englishInput === baseEnglish) {
                setMouseClicked(true);
                setRipple({ x: 35, y: 35, show: true });
                setIsTyping(true);
                setTimeout(() => setRipple(r => ({ ...r, show: false })), 400);
            }
        }
        // 2.0s ~ 3.8s 타이핑 연출
        else if (time >= 2000 && time < 3800) {
            setMouseClicked(false);
            const progress = (time - 2000) / 1800; // 0 ~ 1
            const charCount = Math.floor(progress * typedSuffix.length);
            setEnglishInput(baseEnglish + typedSuffix.substring(0, charCount));
        }
        // 3.8s ~ 5.0s 가상 마우스가 "AI 번역하기" 버튼(x: 25%, y: 88%)으로 이동
        else if (time >= 3800 && time < 5000) {
            setIsTyping(false);
            setEnglishInput(baseEnglish + typedSuffix);
            const progress = (time - 3800) / 1200;
            const ease = 1 - Math.pow(1 - progress, 3);
            setMouse({
                x: 35 + (25 - 35) * ease,
                y: 35 + (88 - 35) * ease
            });
            if (time > 4950 && !isTranslating && !isTranslated) {
                setMouseClicked(true);
                setRipple({ x: 25, y: 88, show: true });
                setIsTranslating(true);
                setTimeout(() => setRipple(r => ({ ...r, show: false })), 400);
            }
        }
        // 5.0s ~ 7.5s AI 도안 분석 및 번역 진행 (스캔라인 및 진행률 0% ~ 100%)
        else if (time >= 5000 && time < 7500) {
            setMouseClicked(false);
            const progress = Math.min((time - 5000) / 2500, 1);
            setTranslateProgress(Math.round(progress * 100));
            if (progress >= 1 && !isTranslated) {
                setIsTranslating(false);
                setIsTranslated(true);
            }
        }
        // 7.5s ~ 11.5s 국문 출력 타이핑 효과 (Typewriter)
        else if (time >= 7500 && time < 11500) {
            const progress = (time - 7500) / 4000; // 4초간 국문 글자 출력
            const charCount = Math.floor(progress * translatedKorean.length);
            setKoreanOutput(translatedKorean.substring(0, charCount));
        }
        // 11.5s ~ 15.5s 가상 마우스가 각각의 번역 단어로 이동하며 지능형 약어 사전 호버링 연출
        else if (time >= 11500 && time < 15500) {
            setKoreanOutput(translatedKorean);
            
            // 4개 약어를 순서대로 순회
            // K (겉뜨기): 11.5s ~ 12.5s (x: 58%, y: 22%)
            // P (안뜨기): 12.5s ~ 13.5s (x: 82%, y: 22%)
            // yo (바늘비우기): 13.5s ~ 14.5s (x: 62%, y: 40%)
            // k2tog (왼코겹치기): 14.5s ~ 15.5s (x: 80%, y: 40%)
            if (time >= 11500 && time < 12500) {
                const progress = (time - 11500) / 1000;
                const ease = 1 - Math.pow(1 - progress, 3);
                setMouse({
                    x: 25 + (58 - 25) * ease,
                    y: 88 + (22 - 88) * ease
                });
                setHoveredTerm('K');
            }
            else if (time >= 12500 && time < 13500) {
                const progress = (time - 12500) / 1000;
                const ease = 1 - Math.pow(1 - progress, 3);
                setMouse({
                    x: 58 + (82 - 58) * ease,
                    y: 22 + (22 - 22) * ease
                });
                setHoveredTerm('P');
            }
            else if (time >= 13500 && time < 14500) {
                const progress = (time - 13500) / 1000;
                const ease = 1 - Math.pow(1 - progress, 3);
                setMouse({
                    x: 82 + (62 - 82) * ease,
                    y: 22 + (40 - 22) * ease
                });
                setHoveredTerm('yo');
            }
            else if (time >= 14500 && time < 15500) {
                const progress = (time - 14500) / 1000;
                const ease = 1 - Math.pow(1 - progress, 3);
                setMouse({
                    x: 62 + (80 - 62) * ease,
                    y: 40 + (40 - 40) * ease
                });
                setHoveredTerm('k2tog');
            }
        }
        // 15.5s ~ 16.5s 가상 마우스가 우측 하단 "도안 복사" (x: 75%, y: 88%) 위치로 이동하며 사전 닫힘
        else if (time >= 15500 && time < 16500) {
            setHoveredTerm(null);
            const progress = (time - 15500) / 1000;
            const ease = 1 - Math.pow(1 - progress, 3);
            setMouse({
                x: 80 + (75 - 80) * ease,
                y: 40 + (88 - 40) * ease
            });
            if (time > 16400 && !toast) {
                setMouseClicked(true);
                setRipple({ x: 75, y: 88, show: true });
                setToast(locale === 'ko' 
                    ? '📋 번역된 도안이 클립보드에 성공적으로 복사되었습니다!' 
                    : '📋 Translated pattern copied to clipboard successfully!'
                );
                setTimeout(() => setRipple(r => ({ ...r, show: false })), 400);
            }
        }
        // 16.5s ~ 17.5s 클립보드 복사 상태 유지
        else if (time >= 16500 && time < 17500) {
            setMouseClicked(false);
        }
        // 17.5s ~ 18.0s 토스트 숨김 및 리셋 준비
        else if (time >= 17500 && time < 18000) {
            setToast(null);
            setMouseClicked(false);
        }
    }, [time, locale]);

    const getSubtitleMessage = () => {
        if (time < 1000) return locale === 'ko' ? '시연 준비 중...' : 'Preparing Translator Demo...';
        if (time >= 1000 && time < 2000) return locale === 'ko' ? '1. 번역하고자 하는 원문 도안 입력 영역을 마우스로 가볍게 탭합니다.' : '1. Tap the source pattern input textarea to prepare text.';
        if (time >= 2000 && time < 3800) return locale === 'ko' ? '기존 서술형 영문 도안에 이어 새로운 3단 행을 가상으로 직접 타이핑합니다.' : 'Typing a new row 3 containing abbreviation terms into the editor...';
        if (time >= 3800 && time < 5000) return locale === 'ko' ? '2. 하단 중앙의 [🪄 AI 도안 번역하기] 버튼을 당당히 클릭합니다.' : '2. Click the central [🪄 Translate Pattern] action button.';
        if (time >= 5000 && time < 7500) return locale === 'ko' ? `byKnit AI 엔진이 다국어 기호 및 도안 축약어 매핑을 실시간 연산 중... (${translateProgress}%)` : `byKnit translation engine mapping foreign symbols and terms... (${translateProgress}%)`;
        if (time >= 7500 && time < 11500) return locale === 'ko' ? '3. 완료! 우측 번역창에 영문 축약어가 깔끔한 국문 겉뜨기/안뜨기로 번역 출력됩니다.' : '3. Rendered! View the translated Korean stitches in the target panel.';
        if (time >= 11500 && time < 15500) return locale === 'ko' ? '4. 각각의 약어 단어 위로 마우스를 호버하면, 지능형 약어 사전을 통해 용어 정의가 즉시 동적 제공됩니다.' : '4. Hover over each abbreviation to view real-time glossary details in our smart database.';
        if (time >= 15500 && time < 16500) return locale === 'ko' ? '5. 우측 하단 [📋 도안 복사] 버튼을 클릭해 동기화된 도안을 편리하게 복사합니다.' : '5. Click [📋 Copy Pattern] at the bottom-right to copy results.';
        return locale === 'ko' ? '시연 루프 완료! 잠시 후 처음부터 다시 재생됩니다.' : 'Loop finished! Restarting pattern translation...';
    };

    const renderLineWithBadges = (line: string) => {
        const parts = line.split(/(겉뜨기\(K\)|안뜨기\(P\)|바늘비우기\(yo\)|왼코겹치기\(k2tog\))/);
        return parts.map((part, pIdx) => {
            if (part === '겉뜨기(K)') {
                const isHovered = (userHoveredTerm || hoveredTerm) === 'K';
                return (
                    <span 
                        key={pIdx} 
                        onMouseEnter={() => setUserHoveredTerm('K')}
                        onMouseLeave={() => setUserHoveredTerm(null)}
                        className={`px-1.5 py-0.2 mx-0.5 rounded font-black cursor-help inline-block text-[9.5px] transform transition-all duration-200 border ${
                            isHovered 
                            ? 'bg-[#F28E9B] border-[#F28E9B] text-white scale-[1.08] shadow-md shadow-rose-200/50' 
                            : 'bg-rose-50 border-[#F28E9B] text-[#F28E9B] hover:scale-[1.02]'
                        }`}
                    >
                        겉뜨기(K)
                    </span>
                );
            }
            if (part === '안뜨기(P)') {
                const isHovered = (userHoveredTerm || hoveredTerm) === 'P';
                return (
                    <span 
                        key={pIdx} 
                        onMouseEnter={() => setUserHoveredTerm('P')}
                        onMouseLeave={() => setUserHoveredTerm(null)}
                        className={`px-1.5 py-0.2 mx-0.5 rounded font-black cursor-help inline-block text-[9.5px] transform transition-all duration-200 border ${
                            isHovered 
                            ? 'bg-[#F28E9B] border-[#F28E9B] text-white scale-[1.08] shadow-md shadow-rose-200/50' 
                            : 'bg-rose-50 border-[#F28E9B] text-[#F28E9B] hover:scale-[1.02]'
                        }`}
                    >
                        안뜨기(P)
                    </span>
                );
            }
            if (part === '바늘비우기(yo)') {
                const isHovered = (userHoveredTerm || hoveredTerm) === 'yo';
                return (
                    <span 
                        key={pIdx} 
                        onMouseEnter={() => setUserHoveredTerm('yo')}
                        onMouseLeave={() => setUserHoveredTerm(null)}
                        className={`px-1.5 py-0.2 mx-0.5 rounded font-black cursor-help inline-block text-[9.5px] transform transition-all duration-200 border ${
                            isHovered 
                            ? 'bg-[#F28E9B] border-[#F28E9B] text-white scale-[1.08] shadow-md shadow-rose-200/50' 
                            : 'bg-rose-50 border-[#F28E9B] text-[#F28E9B] hover:scale-[1.02]'
                        }`}
                    >
                        바늘비우기(yo)
                    </span>
                );
            }
            if (part === '왼코겹치기(k2tog)') {
                const isHovered = (userHoveredTerm || hoveredTerm) === 'k2tog';
                return (
                    <span 
                        key={pIdx} 
                        onMouseEnter={() => setUserHoveredTerm('k2tog')}
                        onMouseLeave={() => setUserHoveredTerm(null)}
                        className={`px-1.5 py-0.2 mx-0.5 rounded font-black cursor-help inline-block text-[9.5px] transform transition-all duration-200 border ${
                            isHovered 
                            ? 'bg-[#F28E9B] border-[#F28E9B] text-white scale-[1.08] shadow-md shadow-rose-200/50' 
                            : 'bg-rose-50 border-[#F28E9B] text-[#F28E9B] hover:scale-[1.02]'
                        }`}
                    >
                        왼코겹치기(k2tog)
                    </span>
                );
            }
            return <span key={pIdx}>{part}</span>;
        });
    };

    return (
        <div className="w-full relative bg-[#FAF6F0] rounded-2xl border border-[#EFE7DC] shadow-soft overflow-hidden p-4 md:p-6 flex flex-col justify-between" style={{ height: '480px' }}>
            {/* 가상 헤더 */}
            <div className="flex justify-between items-center mb-3 border-b border-[#EFE7DC] pb-3 select-none">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="text-xs font-black text-stone-400 ml-2 font-mono uppercase tracking-wider">{locale === 'ko' ? 'AI 도안 번역기 시뮬레이터' : 'AI Pattern Translator Simulator'}</span>
                </div>
                <div className="text-[10px] font-black text-[#F28E9B] uppercase tracking-widest bg-rose-50 border border-rose-100 px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F28E9B] animate-pulse" /> LIVE SIM
                </div>
            </div>

            {/* AI 로고 뱃지 */}
            <div className="mb-3 bg-stone-900 text-white rounded-xl p-2.5 flex items-center justify-between select-none shadow-sm animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#F28E9B] flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-white animate-spin-slow" />
                    </div>
                    <span className="text-[10px] md:text-xs font-black tracking-wide">
                        {locale === 'ko' 
                            ? 'byKnit AI 번역: 영문 도안(K, P, yo, k2tog)의 자동 한국어 뜨개어 매핑 및 기호 시각화 지원' 
                            : 'byKnit AI Translate: English abbreviations to native terms mapping.'}
                    </span>
                </div>
                <span className="text-[8px] font-black font-mono tracking-widest bg-stone-850 px-2 py-0.5 rounded border border-stone-800">MODEL-V3</span>
            </div>

            {/* 메인 번역 레이아웃 */}
            <div className="relative grid grid-cols-2 gap-4" style={{ height: '320px' }}>
                
                {/* 1. 원문 입력 박스 (English) */}
                <div className="flex flex-col justify-between bg-white border border-[#EFE7DC] rounded-xl p-3.5 shadow-sm relative overflow-hidden select-none">
                    <div className="flex justify-between items-center border-b border-stone-50 pb-2 mb-2">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1">
                            <Globe className="w-3 h-3 text-stone-300" />
                            <span>{locale === 'ko' ? '원문 (영어)' : 'SOURCE (ENGLISH)'}</span>
                        </span>
                        <span className="text-[9px] font-bold text-stone-400 bg-stone-50 border border-stone-150 px-1.5 py-0.2 rounded font-mono">ENG</span>
                    </div>

                    <div className="flex-1 font-mono text-[10.5px] leading-relaxed text-stone-600 font-semibold p-1.5 bg-[#FAF6F0]/40 rounded-lg border border-[#EFE7DC]/50 outline-none whitespace-pre-line relative text-left">
                        {englishInput}
                        {isTyping && (
                            <span className="inline-block w-1.5 h-3.5 bg-[#F28E9B] ml-0.5 animate-pulse" style={{ verticalAlign: 'middle' }} />
                        )}
                    </div>

                    <div className="pt-2 border-t border-stone-50 mt-2">
                        <button
                            disabled={isTranslating}
                            className={`w-full py-2 rounded-xl text-[10px] font-black text-white flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 ${
                                isTranslating 
                                ? 'bg-[#ea939e]' 
                                : 'bg-[#F28E9B] hover:bg-[#e07b88]'
                            }`}
                        >
                            <Languages className="w-3.5 h-3.5 text-white" />
                            <span>{locale === 'ko' ? '🪄 AI 도안 번역하기' : '🪄 Translate Pattern'}</span>
                        </button>
                    </div>
                </div>

                {/* 2. 번역 완료 박스 (Korean) */}
                <div className="flex flex-col justify-between bg-white border border-[#EFE7DC] rounded-xl p-3.5 shadow-sm relative overflow-hidden select-none">
                    <div className="flex justify-between items-center border-b border-stone-50 pb-2 mb-2">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1">
                            <FileText className="w-3 h-3 text-stone-300" />
                            <span>{locale === 'ko' ? '번역본 (한국어)' : 'TARGET (KOREAN)'}</span>
                        </span>
                        <span className="text-[9px] font-bold text-rose-400 bg-rose-50 border border-rose-100 px-1.5 py-0.2 rounded font-mono">KOR</span>
                    </div>

                    <div className="flex-1 font-mono text-[10.5px] leading-relaxed text-stone-700 font-extrabold p-2 bg-stone-50/50 border border-stone-150 rounded-lg whitespace-pre-line relative overflow-hidden text-left">
                        {/* 네온 스캔라인 연출 */}
                        {isTranslating && (
                            <div 
                                className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#F28E9B] to-transparent shadow-[0_0_10px_#F28E9B] z-10"
                                style={{
                                    animation: 'scan 1.5s infinite linear'
                                }}
                            />
                        )}

                        {/* 번역 텍스트 출력 */}
                        {isTranslating ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                <div className="text-[11px] font-black text-[#F28E9B] uppercase font-mono tracking-widest">{locale === 'ko' ? '구문 트리 분석 중...' : 'PARSING TERMS...'}</div>
                                <div className="w-24 bg-stone-150 rounded-full h-1 overflow-hidden">
                                    <div className="bg-[#F28E9B] h-full transition-all duration-100" style={{ width: `${translateProgress}%` }} />
                                </div>
                            </div>
                        ) : isTranslated ? (
                            <div className="h-full overflow-y-auto">
                                {koreanOutput.split('\\n').map((line, idx) => {
                                    if (line.trim() === '') {
                                        return <div key={idx} className="h-1.5" />;
                                    }
                                    const isEngLine = line.startsWith('Row');
                                    
                                    return (
                                        <div 
                                            key={idx} 
                                            className={`leading-normal ${isEngLine ? 'text-stone-400 font-semibold text-[9.5px]' : 'text-stone-700 font-extrabold text-[11px] mb-1.5'}`}
                                        >
                                            {isEngLine ? line : renderLineWithBadges(line)}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-stone-300">
                                <Languages className="w-9 h-9 text-stone-200 mb-1.5 animate-pulse" />
                                <span className="text-[10px] font-black">{locale === 'ko' ? '대기 중...' : 'Waiting for input'}</span>
                            </div>
                        )}
                    </div>

                    <div className="pt-2 border-t border-stone-50 mt-2">
                        <button
                            disabled={!isTranslated}
                            className={`w-full py-2 rounded-xl text-[9px] font-black text-white flex items-center justify-center gap-1 transition-all ${
                                isTranslated 
                                ? 'bg-stone-900 hover:bg-stone-850 active:scale-95 shadow-md' 
                                : 'bg-stone-100 text-stone-300 cursor-not-allowed'
                            }`}
                        >
                            <Copy className="w-3.5 h-3.5 text-white" />
                            <span>{locale === 'ko' ? '도안 복사하기' : 'Copy Pattern'}</span>
                        </button>
                    </div>
                </div>

                {/* 3. 글래스모피즘 스마트 사전 팝업 카드 */}
                {(() => {
                    const activeTerm = userHoveredTerm || hoveredTerm;
                    if (!activeTerm) return null;
                    return (
                        <div className="absolute top-[80px] right-[20px] md:right-[40px] w-[185px] bg-white/90 backdrop-blur-md border border-[#F28E9B]/30 rounded-2xl p-3 shadow-lg z-50 animate-in zoom-in-95 duration-200 select-none text-left">
                            <div className="flex items-center gap-1.5 mb-1.5 border-b border-rose-50 pb-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-[#F28E9B]" />
                                <span className="text-[10px] font-black text-[#F28E9B] uppercase tracking-wider">{locale === 'ko' ? '지능형 약어 사전' : 'ABBR DICTIONARY'}</span>
                            </div>
                            <h5 className="text-[11px] font-black text-stone-700 leading-tight">
                                {glossaryDb[activeTerm].term}
                            </h5>
                            <p className="text-[9px] font-black text-[#F28E9B] mb-1.5 leading-none">
                                {locale === 'ko' 
                                    ? `한국어: ${glossaryDb[activeTerm].kor}` 
                                    : `Korean: ${glossaryDb[activeTerm].kor}`}
                            </p>
                            <p className="text-[8.5px] font-bold text-stone-500 leading-relaxed">
                                {locale === 'ko' 
                                    ? glossaryDb[activeTerm].desc.ko 
                                    : glossaryDb[activeTerm].desc.en}
                            </p>
                        </div>
                    );
                })()}

                {ripple.show && (
                    <div 
                        className="absolute pointer-events-none rounded-full border-4 border-rose-400/80 animate-ping z-50 bg-rose-200/20"
                        style={{
                            left: `${ripple.x}%`,
                            top: `${ripple.y}%`,
                            width: '32px',
                            height: '32px',
                            transform: 'translate(-50%, -50%)',
                            animationDuration: '0.4s'
                        }}
                    />
                )}

                <div 
                    className="absolute pointer-events-none transition-all duration-75 ease-out z-50 flex items-center justify-center"
                    style={{
                        left: `${mouse.x}%`,
                        top: `${mouse.y}%`,
                        transform: `translate(-6px, -6px) scale(${mouseClicked ? 0.85 : 1})`,
                    }}
                >
                    <MousePointer className="w-6 h-6 text-stone-800 fill-white drop-shadow-md filter" />
                </div>
            </div>

            {toast && (
                <div className="absolute top-28 left-1/2 -translate-x-1/2 bg-stone-900/90 backdrop-blur-sm text-white text-[11px] font-black px-4 py-2.5 rounded-full shadow-lg border border-stone-700/50 flex items-center gap-2 z-50 animate-in slide-in-from-bottom-2 duration-300">
                    <Check className="w-3.5 h-3.5 text-[#F28E9B] stroke-[3]" />
                    <span>{toast}</span>
                </div>
            )}

            <div className="mt-4 p-3 bg-white border border-[#EFE7DC] rounded-xl flex items-start gap-2.5 shadow-inner select-none">
                <Info className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
                <div>
                    <h5 className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">{locale === 'ko' ? '시연 가이드 자막' : 'DEMO SUBTITLES'}</h5>
                    <p className="text-xs text-stone-600 font-extrabold leading-normal transition-all duration-300">
                        {getSubtitleMessage()}
                    </p>
                </div>
            </div>

            {/* CSS Animation Keyframes for Scans (Embedded within the component container) */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            ` }} />
        </div>
    );
}

// ==========================================
// 4. 스마트 계산기 6종 통합 시뮬레이터 플레이어
// ==========================================
type CalcTab = 'basic' | 'gauge' | 'yarn' | 'raglan' | 'socks' | 'grading';

export function VectorCalculatorDemo({ locale }: { locale: string }) {
    const [mouse, setMouse] = useState({ x: 92, y: 88 });
    const [mouseClicked, setMouseClicked] = useState(false);
    const [ripple, setRipple] = useState<{ x: number; y: number; show: boolean }>({ x: 0, y: 0, show: false });
    const [toast, setToast] = useState<string | null>(null);
    const [time, setTime] = useState(0);
    const loopDuration = 18000;
    const isMounted = useRef(true);

    // 자동 시뮬레이션 탭 & 수동 오버라이드 탭 상태
    const [simActiveTab, setSimActiveTab] = useState<CalcTab>('basic');
    const [userActiveTab, setUserActiveTab] = useState<CalcTab | null>(null);
    const activeTab = userActiveTab || simActiveTab;

    // --- 수동 입력을 위한 양방향 바인딩 State들 ---
    // 1) 기본 변환
    const [manualGaugeSts, setManualGaugeSts] = useState<number>(11);
    const [manualGaugeRows, setManualGaugeRows] = useState<number>(33);
    const [manualWidth, setManualWidth] = useState<number>(25);
    const [manualLength, setManualLength] = useState<number>(30);

    // 2) 게이지 변환
    const [manualPatternSts, setManualPatternSts] = useState<number>(22);
    const [manualPatternRows, setManualPatternRows] = useState<number>(30);
    const [manualMySts, setManualMySts] = useState<number>(20);
    const [manualMyRows, setManualMyRows] = useState<number>(28);
    const [manualPatternInputSts, setManualPatternInputSts] = useState<number>(100);

    // 3) 실 계산
    const [manualPatternBalls, setManualPatternBalls] = useState<number>(5);
    const [manualPatternLength, setManualPatternLength] = useState<number>(100);
    const [manualMyLength, setManualMyLength] = useState<number>(80);

    // 4) 레글런
    const [manualRaglanGauge, setManualRaglanGauge] = useState<number>(20);
    const [manualNeckSize, setManualNeckSize] = useState<number>(38);
    const [manualChestSize, setManualChestSize] = useState<number>(96);
    const [manualEaseSize, setManualEaseSize] = useState<number>(5);
    const [isRaglanStandardClicked, setIsRaglanStandardClicked] = useState(false);

    // 5) 양말
    const [manualSockGauge, setManualSockGauge] = useState<number>(30);
    const [manualSockSize, setManualSockSize] = useState<number>(240);
    const [manualSockHeight, setManualSockHeight] = useState<number>(10);

    // 6) 그레이딩
    const [manualGradingWidth, setManualGradingWidth] = useState<number>(50);
    const [manualGradingTargetWidth, setManualGradingTargetWidth] = useState<number>(55);
    const [manualGradingSts, setManualGradingSts] = useState<number>(100);

    // --- 시뮬레이션용 데이터셋 (time에 따라 가상 타이핑 및 폼 자동 갱신) ---
    useEffect(() => {
        isMounted.current = true;
        let lastTime = performance.now();
        let animationFrameId: number;

        const updateFrame = (now: number) => {
            if (!isMounted.current) return;
            const delta = now - lastTime;
            lastTime = now;
            setTime((prevTime) => (prevTime + delta) % loopDuration);
            animationFrameId = requestAnimationFrame(updateFrame);
        };
        animationFrameId = requestAnimationFrame(updateFrame);
        return () => {
            isMounted.current = false;
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // 18초 루프 시뮬레이션 타임라인 컨트롤러
    useEffect(() => {
        // 수동 탭이 활성화되어 있으면 자동 시뮬레이터 마우스와 상태 제어를 일시 정지시킵니다.
        if (userActiveTab !== null) {
            setMouseClicked(false);
            return;
        }

        // 0s ~ 1.0s 초기화
        if (time >= 0 && time < 1000) {
            setMouse({ x: 92, y: 88 });
            setMouseClicked(false);
            setSimActiveTab('basic');
            setManualGaugeSts(11);
            setManualGaugeRows(33);
            setManualWidth(0);
            setManualLength(0);
            setToast(null);
        }
        // 1.0s ~ 4.0s: 기본 변환 (cm -> 코/단) 시연
        else if (time >= 1000 && time < 4000) {
            setSimActiveTab('basic');
            if (time < 2200) {
                // 적용하기 버튼으로 비행
                const progress = (time - 1000) / 1200;
                const ease = 1 - Math.pow(1 - progress, 3);
                setMouse({
                    x: 92 + (55 - 92) * ease,
                    y: 88 + (35 - 88) * ease
                });
                if (time > 2100 && manualWidth === 0) {
                    setMouseClicked(true);
                    setRipple({ x: 55, y: 35, show: true });
                    setManualGaugeSts(11);
                    setManualGaugeRows(33);
                    setTimeout(() => setRipple(r => ({ ...r, show: false })), 400);
                }
            } else if (time >= 2200 && time < 3000) {
                setMouseClicked(false);
                // 너비 입력창으로 비행 및 가상 타이핑
                const progress = (time - 2200) / 800;
                const ease = 1 - Math.pow(1 - progress, 2);
                setMouse({
                    x: 55 + (42 - 55) * ease,
                    y: 35 + (65 - 35) * ease
                });
                setManualWidth(Math.round(progress * 25));
            } else if (time >= 3000 && time < 3800) {
                // 길이 입력창으로 비행 및 가상 타이핑
                const progress = (time - 3000) / 800;
                const ease = 1 - Math.pow(1 - progress, 2);
                setMouse({
                    x: 42 + (58 - 42) * ease,
                    y: 65 + (65 - 65) * ease
                });
                setManualLength(Math.round(progress * 30));
            } else {
                setManualWidth(25);
                setManualLength(30);
            }
        }
        // 4.0s ~ 7.0s: 게이지 변환 탭 스위칭 및 시연
        else if (time >= 4000 && time < 7000) {
            if (time < 5000) {
                // 게이지 변환 탭 클릭으로 비행
                const progress = (time - 4000) / 1000;
                const ease = 1 - Math.pow(1 - progress, 3);
                setMouse({
                    x: 58 + (26 - 58) * ease,
                    y: 65 + (15 - 65) * ease
                });
                if (time > 4900 && simActiveTab !== 'gauge') {
                    setMouseClicked(true);
                    setRipple({ x: 26, y: 15, show: true });
                    setSimActiveTab('gauge');
                    setManualPatternInputSts(0);
                    setTimeout(() => setRipple(r => ({ ...r, show: false })), 400);
                }
            } else if (time >= 5000 && time < 6200) {
                setMouseClicked(false);
                // 도안 콧수 입력란으로 비행 및 타이핑 연출
                const progress = (time - 5000) / 1200;
                const ease = 1 - Math.pow(1 - progress, 2);
                setMouse({
                    x: 26 + (40 - 26) * ease,
                    y: 15 + (55 - 15) * ease
                });
                setManualPatternInputSts(Math.round(progress * 100));
            } else if (time >= 6200 && time < 7000) {
                // 변환하기 버튼 가상 클릭
                const progress = (time - 6200) / 800;
                const ease = 1 - Math.pow(1 - progress, 3);
                setMouse({
                    x: 40 + (48 - 40) * ease,
                    y: 55 + (85 - 55) * ease
                });
                if (time > 6900 && !mouseClicked) {
                    setMouseClicked(true);
                    setRipple({ x: 48, y: 85, show: true });
                    setManualPatternInputSts(100);
                    setTimeout(() => setRipple(r => ({ ...r, show: false })), 400);
                }
            }
        }
        // 7.0s ~ 10.0s: 실 계산 탭 시연
        else if (time >= 7000 && time < 10000) {
            setMouseClicked(false);
            if (time < 8000) {
                // 실 계산 탭으로 이동 및 클릭
                const progress = (time - 7000) / 1000;
                const ease = 1 - Math.pow(1 - progress, 3);
                setMouse({
                    x: 48 + (41 - 48) * ease,
                    y: 85 + (15 - 85) * ease
                });
                if (time > 7900 && simActiveTab !== 'yarn') {
                    setMouseClicked(true);
                    setRipple({ x: 41, y: 15, show: true });
                    setSimActiveTab('yarn');
                    setManualPatternBalls(5);
                    setManualPatternLength(100);
                    setManualMyLength(80);
                    setTimeout(() => setRipple(r => ({ ...r, show: false })), 400);
                }
            } else {
                setMouseClicked(false);
                // 실 길이/소요 볼 수 게이지 차오름 대기
            }
        }
        // 10.0s ~ 13.0s: 레글런 스웨터 계산 & SVG 배분 시각화
        else if (time >= 10000 && time < 13000) {
            if (time < 11200) {
                // 레글런 탭으로 비행 및 클릭
                const progress = (time - 10000) / 1200;
                const ease = 1 - Math.pow(1 - progress, 3);
                setMouse({
                    x: 41 + (55 - 41) * ease,
                    y: 15 + (15 - 15) * ease
                });
                if (time > 11100 && simActiveTab !== 'raglan') {
                    setMouseClicked(true);
                    setRipple({ x: 55, y: 15, show: true });
                    setSimActiveTab('raglan');
                    setIsRaglanStandardClicked(false);
                    setTimeout(() => setRipple(r => ({ ...r, show: false })), 400);
                }
            } else if (time >= 11200 && time < 12200) {
                setMouseClicked(false);
                // '표준 사이즈 사용' 버튼으로 비행 및 클릭
                const progress = (time - 11200) / 1000;
                const ease = 1 - Math.pow(1 - progress, 3);
                setMouse({
                    x: 55 + (50 - 55) * ease,
                    y: 15 + (48 - 15) * ease
                });
                if (time > 12100 && !isRaglanStandardClicked) {
                    setMouseClicked(true);
                    setRipple({ x: 50, y: 48, show: true });
                    setIsRaglanStandardClicked(true);
                    setManualRaglanGauge(20);
                    setManualNeckSize(38);
                    setManualChestSize(96);
                    setManualEaseSize(5);
                    setTimeout(() => setRipple(r => ({ ...r, show: false })), 400);
                }
            } else {
                setMouseClicked(false);
            }
        }
        // 13.0s ~ 16.0s: 그레이딩 탭 순회
        else if (time >= 13000 && time < 16000) {
            setMouseClicked(false);
            if (time < 14500) {
                // 그레이딩 탭으로 비행 및 클릭
                const progress = (time - 13000) / 1500;
                const ease = 1 - Math.pow(1 - progress, 3);
                setMouse({
                    x: 50 + (80 - 50) * ease,
                    y: 48 + (15 - 48) * ease
                });
                if (time > 14400 && simActiveTab !== 'grading') {
                    setMouseClicked(true);
                    setRipple({ x: 80, y: 15, show: true });
                    setSimActiveTab('grading');
                    setManualGradingWidth(50);
                    setManualGradingTargetWidth(55);
                    setManualGradingSts(100);
                    setTimeout(() => setRipple(r => ({ ...r, show: false })), 400);
                }
            } else {
                setMouseClicked(false);
            }
        }
        // 16.0s ~ 18.0s: 복사하기 및 루프 종료
        else if (time >= 16000 && time < 18000) {
            if (time < 17200) {
                // 복사하기 버튼으로 비행
                const progress = (time - 16000) / 1200;
                const ease = 1 - Math.pow(1 - progress, 3);
                setMouse({
                    x: 80 + (88 - 80) * ease,
                    y: 15 + (88 - 15) * ease
                });
                if (time > 17100 && !toast) {
                    setMouseClicked(true);
                    setRipple({ x: 88, y: 88, show: true });
                    setToast(locale === 'ko'
                        ? '📐 Knitting Math Lab 게이지 연산 데이터가 클립보드에 복사되었습니다!'
                        : '📐 Knitting Math Lab gauge data copied to clipboard!'
                    );
                    setTimeout(() => setRipple(r => ({ ...r, show: false })), 400);
                }
            } else {
                setMouseClicked(false);
            }
        }
    }, [time, userActiveTab, simActiveTab, locale]);

    // 자막 가이드라인 메시지 획득
    const getSubtitleMessage = () => {
        if (userActiveTab !== null) {
            return locale === 'ko'
                ? '💡 수동 모드 활성화됨: 상단 탭을 자유롭게 변경하고 좌측 폼에 수치를 입력해보세요! 우측 패널에 연산 결과가 실시간 동적 계산됩니다.'
                : '💡 Manual Mode Active: Change tabs and input values freely! The target panel will calculate and update on-the-fly.';
        }
        if (time < 1000) return locale === 'ko' ? '📐 Knitting Math Lab 게이지 공학 시뮬레이터를 구성 중...' : '📐 Preparing Knitting Math Lab Engineering Simulator...';
        if (time >= 1000 && time < 4000) {
            return locale === 'ko'
                ? `1. 기본 변환: 내 게이지(${manualGaugeSts}코/${manualGaugeRows}단)를 상정한 뒤 너비 ${manualWidth}cm, 길이 ${manualLength}cm 편물의 필요한 콧수와 단수를 자동 공학 계산합니다.`
                : `1. Basic Conversion: Computes required stitches and rows using gauge (${manualGaugeSts} sts / ${manualGaugeRows} rows) for a ${manualWidth}x${manualLength}cm pattern.`;
        }
        if (time >= 4000 && time < 7000) {
            return locale === 'ko'
                ? `2. 게이지 변환: 도안의 게이지와 내 실의 게이지가 서로 다를 때, 도안 콧수(${manualPatternInputSts}코)를 내 콧수 기준(${Math.round(manualPatternInputSts * manualMySts / manualPatternSts)}코)으로 즉각 치환합니다.`
                : `2. Gauge Matching: Automatically converts pattern stitch count (${manualPatternInputSts} sts) to custom gauge stitches (${Math.round(manualPatternInputSts * manualMySts / manualPatternSts)} sts) when swatch metrics differ.`;
        }
        if (time >= 7000 && time < 10000) {
            return locale === 'ko'
                ? `3. 실 계산: 원작 실과 내가 교체하여 쓸 실의 미터(m) 수치를 대조 분석하여, 총 소요 볼 수(6.3볼)를 막대 차트 게이지와 함께 시각화합니다.`
                : `3. Yarn Substitution: Compares meters per ball between pattern and substitute yarns, rendering required ball metrics (6.3 balls) with reactive bar graphs.`;
        }
        if (time >= 10000 && time < 13000) {
            return locale === 'ko'
                ? `4. 탑다운 레글런: 목둘레(${manualNeckSize}cm)와 가슴둘레를 입력하면 스웨터의 목시작코와 등판/앞판/소매 4방향 분할 분배도를 정교한 스웨터 SVG 그래픽으로 구현합니다.`
                : `4. Top-Down Raglan: Analyzes neckline (${manualNeckSize}cm) and chest dimensions to construct a structural sweater blueprint (SVG) detailing neck cast-on and sleeve allocations.`;
        }
        if (time >= 13000 && time < 16000) {
            return locale === 'ko'
                ? `5. 사이즈 그레이딩: 원작 편물 사이즈(${manualGradingWidth}cm/100코) 대 목표 사이즈(${manualGradingTargetWidth}cm) 비례식을 통해 증감 결과(+10코)를 막대 확장 차트로 보여줍니다.`
                : `5. Pattern Grading: Computes structural increments (+10 sts) across custom size adjustments using original layout scales.`;
        }
        return locale === 'ko' ? '시연 루프 완료! 잠시 후 1단계부터 다시 시연이 자동 순환됩니다.' : 'Simulation loop completed! Restarting in a moment.';
    };

    // --- 각 탭별 우측 결과 및 시각화 그래픽 렌더러 ---
    const renderRightVisualPanel = () => {
        if (activeTab === 'basic') {
            const calculatedSts = Math.round(manualWidth * (manualGaugeSts / 10));
            const calculatedRows = Math.round(manualLength * (manualGaugeRows / 10));
            return (
                <div className="h-full flex flex-col justify-between select-none">
                    <div className="border-b border-stone-100 pb-2 mb-3">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{locale === 'ko' ? '실시간 연산 결과' : 'CALCULATION RESULT'}</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-3">
                        <div className="bg-rose-50/50 border border-rose-100/50 rounded-2xl p-4 shadow-sm text-center">
                            <span className="text-[10px] font-black text-[#F28E9B] uppercase tracking-wider block mb-1">{locale === 'ko' ? '필요한 콧수' : 'REQUIRED STITCHES'}</span>
                            <div className="text-3xl font-black text-stone-850 font-mono tracking-tight animate-pulse">
                                {calculatedSts} <span className="text-sm font-extrabold text-stone-500">{locale === 'ko' ? '코' : 'Sts'}</span>
                            </div>
                        </div>
                        <div className="bg-[#FAF6F0]/80 border border-[#EFE7DC] rounded-2xl p-4 shadow-sm text-center">
                            <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">{locale === 'ko' ? '필요한 단수' : 'REQUIRED ROWS'}</span>
                            <div className="text-3xl font-black text-stone-800 font-mono tracking-tight">
                                {calculatedRows} <span className="text-sm font-extrabold text-stone-500">{locale === 'ko' ? '단' : 'Rows'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="pt-2 text-[9px] font-black text-stone-400 leading-relaxed text-left border-t border-stone-50">
                        {locale === 'ko'
                            ? `* 계산 근거: [게이지 10cm당 ${manualGaugeSts}코 / ${manualGaugeRows}단] 비례 산출식 반영.`
                            : `* Basis: Proportional math calculated using custom gauge metrics.`}
                    </div>
                </div>
            );
        }

        if (activeTab === 'gauge') {
            const myStsResult = Math.round(manualPatternInputSts * manualMySts / manualPatternSts);
            const myRowsResult = Math.round(manualPatternInputSts * manualMyRows / manualPatternRows);
            return (
                <div className="h-full flex flex-col justify-between select-none">
                    <div className="border-b border-stone-100 pb-2 mb-2">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{locale === 'ko' ? '나의 게이지 환산' : 'GAUGE MATCHING RESULT'}</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-3">
                        <div className="bg-white border border-[#EFE7DC] rounded-2xl p-3.5 shadow-sm text-left relative overflow-hidden">
                            <div className="absolute top-2 right-2 px-1.5 py-0.2 bg-stone-100 border border-stone-200 text-[8px] font-black text-stone-500 rounded uppercase">ORIGINAL</div>
                            <span className="text-[9px] font-black text-stone-400 block mb-0.5">{locale === 'ko' ? '도안 원작 코수' : 'Pattern Cast-on'}</span>
                            <div className="text-xl font-mono text-stone-500 font-bold">{manualPatternInputSts}코</div>
                        </div>
                        <div className="flex items-center justify-center -my-1.5">
                            <div className="w-6 h-6 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-[#F28E9B] text-xs font-black">⬇</div>
                        </div>
                        <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-3.5 shadow-sm text-left relative overflow-hidden">
                            <div className="absolute top-2 right-2 px-1.5 py-0.2 bg-[#F28E9B] text-white text-[8px] font-black rounded uppercase tracking-wider animate-pulse">MY SIZE</div>
                            <span className="text-[9px] font-black text-[#F28E9B] block mb-0.5">{locale === 'ko' ? '나의 환산 코수' : 'Your Customized Cast-on'}</span>
                            <div className="text-2xl font-mono text-[#F28E9B] font-black">{isNaN(myStsResult) ? 0 : myStsResult}코</div>
                        </div>
                    </div>
                    <div className="pt-2 text-[9px] font-black text-stone-400 leading-relaxed text-left border-t border-stone-50">
                        {locale === 'ko'
                            ? `* 도안 게이지 대비 ${Math.round((manualMySts / manualPatternSts) * 100)}% 스케일 비례 콧수 변환 적용 완료.`
                            : `* Applied proportional stitch scale translation.`}
                    </div>
                </div>
            );
        }

        if (activeTab === 'yarn') {
            const originalTotalLength = manualPatternBalls * manualPatternLength;
            const requiredBalls = Math.ceil(originalTotalLength / manualMyLength);
            const displayBalls = originalTotalLength / manualMyLength;
            return (
                <div className="h-full flex flex-col justify-between select-none">
                    <div className="border-b border-stone-100 pb-2 mb-2">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{locale === 'ko' ? '대체 실 소요량 분석' : 'YARN CONSUMPTION'}</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-3">
                        <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-black text-stone-400">
                                <span>{locale === 'ko' ? '원작 패턴 총 길이' : 'Pattern Total'}</span>
                                <span className="font-mono text-stone-700">{originalTotalLength} m</span>
                            </div>
                            <div className="h-3 bg-stone-100 rounded-lg overflow-hidden relative border border-stone-200/50">
                                <div className="absolute top-0 left-0 h-full bg-[#B8A399]" style={{ width: '80%' }} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-black text-[#F28E9B]">
                                <span>{locale === 'ko' ? '대체 실 필요 길이' : 'Alternative Needed'}</span>
                                <span className="font-mono text-[#F28E9B] font-black">{originalTotalLength} m</span>
                            </div>
                            <div className="h-3 bg-stone-100 rounded-lg overflow-hidden relative border border-stone-200/50">
                                <div className="absolute top-0 left-0 h-full bg-[#F28E9B] animate-pulse" style={{ width: '100%' }} />
                            </div>
                        </div>
                        <div className="bg-[#FFF9EB] border border-[#FFE7B3] rounded-xl p-3 text-center shadow-inner mt-1">
                            <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block mb-0.5">{locale === 'ko' ? '필요 볼 수 계산 결과' : 'BALLS TO BUY'}</span>
                            <div className="text-xl font-mono text-amber-900 font-black">
                                {requiredBalls} <span className="text-xs font-bold text-amber-850">{locale === 'ko' ? '볼 필요' : 'Balls'}</span>
                            </div>
                            <span className="text-[8.5px] font-bold text-amber-700 block mt-0.5">
                                {locale === 'ko' ? `(정확한 수치: ${displayBalls.toFixed(1)}볼)` : `(Exact metric: ${displayBalls.toFixed(1)} balls)`}
                            </span>
                        </div>
                    </div>
                    <div className="pt-2 text-[9px] font-black text-stone-400 leading-relaxed text-left border-t border-stone-50">
                        {locale === 'ko'
                            ? `* 소수점 올림 처리하여 보수적으로 실 뭉치 단위를 산출하였습니다.`
                            : `* Conservative ball rounding applied to prevent yarn shortage.`}
                    </div>
                </div>
            );
        }

        if (activeTab === 'raglan') {
            // 레글런 스웨터 계산식
            const castOnSts = Math.round(manualNeckSize * (manualRaglanGauge / 10) * 1.0);
            // 76코 기준 분할 배분 모형
            const backSts = Math.round(castOnSts * 0.32);
            const frontSts = Math.round(castOnSts * 0.32);
            const sleeveSts = Math.round(castOnSts * 0.13);
            const lineSts = 2; // 레글런 선 4곳 각각 2코
            
            return (
                <div className="h-full flex flex-col justify-between select-none">
                    <div className="border-b border-stone-100 pb-1.5 mb-1.5 flex justify-between items-center">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{locale === 'ko' ? '스웨터 분할 구조도' : 'SWEATER BLUEPRINT'}</span>
                        <span className="text-[8.5px] font-black text-rose-400 font-mono tracking-widest animate-pulse">TOTAL {castOnSts} STS</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center p-1">
                        {/* 스웨터 SVG 시각 인포그래픽 */}
                        <svg viewBox="0 0 160 120" className="w-[125px] h-[95px] drop-shadow-md">
                            {/* 목둘레 넥라인 */}
                            <path d="M50 30 C50 15, 110 15, 110 30" fill="none" stroke="#FAF6F0" strokeWidth="6" />
                            <path d="M50 30 C50 15, 110 15, 110 30" fill="none" stroke="#F28E9B" strokeWidth="2.5" className="animate-pulse" />
                            
                            {/* 몸통 본체 */}
                            <path d="M50 30 L30 55 L45 62 L52 45 L52 110 L108 110 L108 45 L115 62 L130 55 L110 30 Z" fill="#FAF6F0" stroke="#EFE7DC" strokeWidth="2" />
                            
                            {/* 소매단 구분용 절개선선 */}
                            <line x1="52" y1="45" x2="30" y2="55" stroke="#EFE7DC" strokeWidth="1.5" strokeDasharray="2,2" />
                            <line x1="108" y1="45" x2="130" y2="55" stroke="#EFE7DC" strokeWidth="1.5" strokeDasharray="2,2" />
                            
                            {/* SVG 부위별 콧수 텍스트 배분 라벨 */}
                            {/* 목 (Neck) */}
                            <text x="80" y="16" textAnchor="middle" fill="#F28E9B" fontSize="8.5" fontWeight="900" className="font-mono">
                                {castOnSts}코
                            </text>
                            
                            {/* 등판/앞판 (Body) */}
                            <text x="80" y="80" textAnchor="middle" fill="rgba(58,53,48,0.7)" fontSize="8" fontWeight="800">
                                {locale === 'ko' ? `몸판 ${backSts}코` : `Body ${backSts}`}
                            </text>
                            
                            {/* 소매 (Sleeve) */}
                            <text x="32" y="42" textAnchor="middle" fill="rgba(58,53,48,0.5)" fontSize="7" fontWeight="800">
                                {sleeveSts}
                            </text>
                            <text x="128" y="42" textAnchor="middle" fill="rgba(58,53,48,0.5)" fontSize="7" fontWeight="800">
                                {sleeveSts}
                            </text>
                        </svg>
                        <div className="mt-1 px-2.5 py-0.8 bg-rose-50 border border-rose-100 rounded text-[8px] font-black text-rose-500 tracking-wide text-center">
                            {locale === 'ko' ? `목시작: ${castOnSts}코 / 소매: ${sleeveSts}코 분배` : `Cast-on: ${castOnSts} / Sleeve: ${sleeveSts}`}
                        </div>
                    </div>
                    <div className="pt-1.5 text-[8.5px] font-black text-stone-400 leading-tight text-left border-t border-stone-50">
                        {locale === 'ko'
                            ? `* 소매 배분식: 전체 목둘레 콧수에서 레글런선 8코 제외 후 분할.`
                            : `* Custom allocation calculated (excluding 8 sts of raglan lines).`}
                    </div>
                </div>
            );
        }

        if (activeTab === 'socks') {
            const castOnSocks = Math.round((manualSockSize / 10) * (manualSockGauge / 10) * 0.83); // 양말 배율 비례식
            const heelSts = Math.round(castOnSocks / 2);
            return (
                <div className="h-full flex flex-col justify-between select-none">
                    <div className="border-b border-stone-100 pb-2 mb-2">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{locale === 'ko' ? '양말 사이즈 설계서' : 'SOCK DESIGN BLUEPRINT'}</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center p-1">
                        <svg viewBox="0 0 100 100" className="w-[85px] h-[85px] drop-shadow-sm">
                            {/* 발목부위 */}
                            <path d="M30 10 L60 10 L60 50 C60 55, 65 60, 75 60 L85 65 L70 85 L35 70 C25 65, 30 50, 30 10 Z" fill="#FAF6F0" stroke="#EFE7DC" strokeWidth="2" />
                            {/* 뒤꿈치 */}
                            <path d="M50 52 C50 65, 38 68, 35 70" fill="none" stroke="#F28E9B" strokeWidth="2" strokeDasharray="2,2" />
                            <text x="45" y="30" textAnchor="middle" fill="rgba(58,53,48,0.7)" fontSize="7" fontWeight="800">
                                {locale === 'ko' ? `시작 ${castOnSocks}코` : `Cuff ${castOnSocks}`}
                            </text>
                            <text x="42" y="62" textAnchor="middle" fill="#F28E9B" fontSize="6.5" fontWeight="950" className="font-mono">
                                {locale === 'ko' ? `뒤꿈치: ${heelSts}코` : `Heel: ${heelSts}`}
                            </text>
                        </svg>
                        <div className="mt-1 px-2.5 py-0.8 bg-[#FAF6F0] border border-[#EFE7DC] rounded text-[8px] font-black text-stone-600 tracking-wide text-center">
                            {locale === 'ko' ? `발사이즈: ${manualSockSize}mm / 시작콧수: ${castOnSocks}코` : `Size: ${manualSockSize}mm / Cuff: ${castOnSocks} Sts`}
                        </div>
                    </div>
                    <div className="pt-2 text-[9px] font-black text-stone-400 leading-relaxed text-left border-t border-stone-50">
                        {locale === 'ko'
                            ? `* 한국 표준 발치수 비례식에 의거한 양말 설계 구조입니다.`
                            : `* Configured to Korean Sock Standard proportions.`}
                    </div>
                </div>
            );
        }

        if (activeTab === 'grading') {
            const ratio = manualGradingTargetWidth / manualGradingWidth;
            const targetSts = Math.round(manualGradingSts * ratio);
            const diffSts = targetSts - manualGradingSts;
            const percentage = Math.min(Math.round((ratio - 1) * 100), 100);
            return (
                <div className="h-full flex flex-col justify-between select-none">
                    <div className="border-b border-stone-100 pb-2 mb-2">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{locale === 'ko' ? '편판 그레이딩 결과' : 'GRADING DETAILS'}</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center gap-3">
                        <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-3 shadow-sm flex justify-between items-center relative overflow-hidden">
                            <div>
                                <span className="text-[9px] font-black text-[#F28E9B] block mb-0.5">{locale === 'ko' ? '변환된 목표 코수' : 'Graded Target'}</span>
                                <div className="text-2xl font-mono text-stone-850 font-black">{targetSts}코</div>
                            </div>
                            <div className="bg-[#F28E9B] text-white font-mono text-[10px] font-black px-2.5 py-1 rounded-lg">
                                {diffSts >= 0 ? `+${diffSts}` : diffSts}코
                            </div>
                        </div>
                        <div className="space-y-1 mt-1 text-left">
                            <span className="text-[8.5px] font-black text-stone-400 block">{locale === 'ko' ? '사이즈 증감 비율' : 'Grading Increment Scale'}</span>
                            <div className="h-3 bg-stone-100 rounded-full overflow-hidden border border-stone-200/50 relative">
                                <div className="absolute top-0 left-0 h-full bg-[#F28E9B] animate-pulse" style={{ width: `${Math.max(50, 50 + percentage)}%` }} />
                                <span className="absolute inset-0 flex items-center justify-center text-[7.5px] font-black text-stone-600 font-mono">
                                    {percentage >= 0 ? `+${percentage}` : percentage}% Size Scale
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="pt-2 text-[9px] font-black text-stone-400 leading-relaxed text-left border-t border-stone-50">
                        {locale === 'ko'
                            ? `* 비례 치수 증감율에 의거하여 편판의 가로 코수를 보정하였습니다.`
                            : `* Adjustments calibrated using custom proportion factors.`}
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="w-full relative bg-[#FAF6F0] rounded-2xl border border-[#EFE7DC] shadow-soft overflow-hidden p-4 md:p-6 flex flex-col justify-between" style={{ height: '480px' }}>
            {/* 가상 헤더 */}
            <div className="flex justify-between items-center mb-3 border-b border-[#EFE7DC] pb-3 select-none">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="text-xs font-black text-stone-400 ml-2 font-mono uppercase tracking-wider">{locale === 'ko' ? 'Knitting Math Lab 시뮬레이터' : 'Knitting Math Lab Simulator'}</span>
                </div>
                <div className="text-[10px] font-black text-[#F28E9B] uppercase tracking-widest bg-rose-50 border border-rose-100 px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F28E9B] animate-pulse" /> LIVE SIM
                </div>
            </div>

            {/* 6종 계산기 탭바 */}
            <div className="flex flex-wrap gap-1.5 mb-4 border-b border-stone-150/60 pb-3 select-none">
                {(['basic', 'gauge', 'yarn', 'raglan', 'socks', 'grading'] as CalcTab[]).map((tabId) => {
                    const isActive = activeTab === tabId;
                    const getTabName = () => {
                        if (tabId === 'basic') return locale === 'ko' ? '기본 변환' : 'Basic Calc';
                        if (tabId === 'gauge') return locale === 'ko' ? '게이지 변환' : 'Gauge Swap';
                        if (tabId === 'yarn') return locale === 'ko' ? '실 계산' : 'Yarn Size';
                        if (tabId === 'raglan') return locale === 'ko' ? '레글런' : 'Raglan';
                        if (tabId === 'socks') return locale === 'ko' ? '양말' : 'Socks';
                        return locale === 'ko' ? '그레이딩' : 'Grading';
                    };
                    return (
                        <button
                            key={tabId}
                            onClick={() => setUserActiveTab(tabId)}
                            className={`px-3.5 py-1.5 rounded-full text-[10px] md:text-[11px] font-black tracking-tight transition-all duration-300 ${
                                isActive
                                ? 'bg-[#F28E9B] text-white shadow-md shadow-rose-200/50 scale-[1.05]'
                                : 'bg-white text-stone-500 hover:bg-rose-50/50 hover:text-[#F28E9B] border border-stone-150'
                            }`}
                        >
                            {getTabName()}
                        </button>
                    );
                })}
            </div>

            {/* 계산기 대시보드 레이아웃 */}
            <div className="relative grid grid-cols-5 gap-4" style={{ height: '310px' }}>
                {/* 1. 좌측 폼 입력 영역 (3/5 분할) */}
                <div className="col-span-3 bg-white border border-[#EFE7DC] rounded-xl p-3.5 shadow-sm text-stone-600 flex flex-col justify-between relative select-none">
                    {/* 게이지 상정 공통 영역 */}
                    {activeTab === 'basic' && (
                        <div className="space-y-3 flex-1 flex flex-col justify-between text-left animate-in fade-in duration-300">
                            <div>
                                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-2">{locale === 'ko' ? '기본 변환 게이지 상정' : 'GAUGE INPUT'}</span>
                                <div className="grid grid-cols-2 gap-2 bg-[#FAF6F0] p-2.5 border border-[#EFE7DC] rounded-xl">
                                    <div>
                                        <label className="text-[8.5px] font-black text-stone-400 block mb-0.5">{locale === 'ko' ? '콧수 / 10cm' : 'Stitches'}</label>
                                        <input
                                            type="number"
                                            value={manualGaugeSts}
                                            onChange={(e) => setManualGaugeSts(Number(e.target.value))}
                                            className="w-full bg-white border border-stone-150 rounded px-2 py-1 text-[11px] font-bold text-stone-700 font-mono outline-none focus:border-[#F28E9B]"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[8.5px] font-black text-stone-400 block mb-0.5">{locale === 'ko' ? '단수 / 10cm' : 'Rows'}</label>
                                        <input
                                            type="number"
                                            value={manualGaugeRows}
                                            onChange={(e) => setManualGaugeRows(Number(e.target.value))}
                                            className="w-full bg-white border border-stone-150 rounded px-2 py-1 text-[11px] font-bold text-stone-700 font-mono outline-none focus:border-[#F28E9B]"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[9px] font-black text-stone-400 block mb-1">{locale === 'ko' ? '가로 너비 (cm)' : 'Width (cm)'}</label>
                                    <input
                                        type="number"
                                        value={manualWidth || ''}
                                        onChange={(e) => setManualWidth(Number(e.target.value))}
                                        placeholder="예) 25"
                                        className="w-full bg-[#FAF6F0]/50 border border-stone-150 rounded-xl px-3 py-1.8 text-xs font-black text-stone-700 font-mono outline-none focus:border-[#F28E9B] focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-stone-400 block mb-1">{locale === 'ko' ? '세로 길이 (cm)' : 'Length (cm)'}</label>
                                    <input
                                        type="number"
                                        value={manualLength || ''}
                                        onChange={(e) => setManualLength(Number(e.target.value))}
                                        placeholder="예) 30"
                                        className="w-full bg-[#FAF6F0]/50 border border-stone-150 rounded-xl px-3 py-1.8 text-xs font-black text-stone-700 font-mono outline-none focus:border-[#F28E9B] focus:bg-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <button className="w-full py-2 bg-[#F28E9B] text-white text-[10px] font-black rounded-xl shadow-md hover:bg-[#e07b88] active:scale-95 transition-all">
                                    {locale === 'ko' ? '📐 게이지 환산 적용하기' : 'Apply Gauge Math'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'gauge' && (
                        <div className="space-y-2 flex-1 flex flex-col justify-between text-left animate-in fade-in duration-300">
                            <div>
                                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-1.5">{locale === 'ko' ? '원작 도안 게이지' : 'PATTERN ORIGINAL GAUGE'}</span>
                                <div className="grid grid-cols-2 gap-2 bg-[#FAF6F0] p-2 border border-[#EFE7DC] rounded-xl">
                                    <div>
                                        <input
                                            type="number"
                                            value={manualPatternSts}
                                            onChange={(e) => setManualPatternSts(Number(e.target.value))}
                                            className="w-full bg-white border border-stone-150 rounded px-2 py-0.8 text-[11px] font-bold text-stone-600 font-mono outline-none"
                                        />
                                    </div>
                                    <div className="text-[10px] font-bold text-stone-400 self-center">코 (Sts)</div>
                                </div>
                            </div>
                            <div>
                                <span className="text-[9px] font-black text-[#F28E9B] uppercase tracking-widest block mb-1.5">{locale === 'ko' ? '나의 실 게이지' : 'YOUR SWATCH GAUGE'}</span>
                                <div className="grid grid-cols-2 gap-2 bg-rose-50/20 p-2 border border-rose-100/50 rounded-xl">
                                    <div>
                                        <input
                                            type="number"
                                            value={manualMySts}
                                            onChange={(e) => setManualMySts(Number(e.target.value))}
                                            className="w-full bg-white border border-rose-200 rounded px-2 py-0.8 text-[11px] font-bold text-stone-600 font-mono outline-none"
                                        />
                                    </div>
                                    <div className="text-[10px] font-bold text-[#F28E9B] self-center">코 (Sts)</div>
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-stone-400 block mb-1">{locale === 'ko' ? '원작 도안 콧수 입력' : 'Pattern Stitch Count'}</label>
                                <input
                                    type="number"
                                    value={manualPatternInputSts || ''}
                                    onChange={(e) => setManualPatternInputSts(Number(e.target.value))}
                                    placeholder="예) 100"
                                    className="w-full bg-[#FAF6F0]/50 border border-stone-150 rounded-xl px-3 py-1.8 text-xs font-black text-stone-700 font-mono outline-none focus:border-[#F28E9B] focus:bg-white"
                                />
                            </div>
                            <div>
                                <button className="w-full py-2.5 bg-stone-900 text-white text-[10px] font-black rounded-xl hover:bg-stone-850 active:scale-95 transition-all">
                                    {locale === 'ko' ? '🪄 내 게이지 콧수로 변환' : 'Match to My Gauge'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'yarn' && (
                        <div className="space-y-3 flex-1 flex flex-col justify-between text-left animate-in fade-in duration-300">
                            <div>
                                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-2">{locale === 'ko' ? '원작 패턴의 실 메타 정보' : 'PATTERN YARN SPEC'}</span>
                                <div className="grid grid-cols-3 gap-2 bg-[#FAF6F0] p-2 border border-[#EFE7DC] rounded-xl text-center">
                                    <div>
                                        <label className="text-[8px] font-black text-stone-400 block mb-0.5">볼 수</label>
                                        <input
                                            type="number"
                                            value={manualPatternBalls}
                                            onChange={(e) => setManualPatternBalls(Number(e.target.value))}
                                            className="w-full bg-white border border-stone-150 rounded py-0.5 text-center text-[10px] font-bold font-mono outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-black text-stone-400 block mb-0.5">m/볼</label>
                                        <input
                                            type="number"
                                            value={manualPatternLength}
                                            onChange={(e) => setManualPatternLength(Number(e.target.value))}
                                            className="w-full bg-white border border-stone-150 rounded py-0.5 text-center text-[10px] font-bold font-mono outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-black text-stone-400 block mb-0.5">g/볼</label>
                                        <input
                                            type="text"
                                            defaultValue="50"
                                            disabled
                                            className="w-full bg-stone-50 border border-stone-200 rounded py-0.5 text-center text-[10px] font-bold font-mono outline-none text-stone-400 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-[#F28E9B] block mb-1">{locale === 'ko' ? '내가 사용할 대체 실 (m/볼)' : 'Your Yarn Meterage (m/ball)'}</label>
                                <input
                                    type="number"
                                    value={manualMyLength}
                                    onChange={(e) => setManualMyLength(Number(e.target.value))}
                                    placeholder="예) 80"
                                    className="w-full bg-rose-50/10 border border-rose-200 rounded-xl px-3 py-1.8 text-xs font-black text-stone-700 font-mono outline-none focus:border-[#F28E9B] focus:bg-white"
                                />
                            </div>
                            <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-[8.5px] font-black text-[#F28E9B] leading-normal">
                                {locale === 'ko'
                                    ? '💡 팁: 대체 실의 볼당 길이가 짧을수록 구매하셔야 하는 볼 수는 늘어납니다.'
                                    : '💡 Tip: Shorter yardage per ball increases total skeins required.'}
                            </div>
                        </div>
                    )}

                    {activeTab === 'raglan' && (
                        <div className="space-y-3 flex-1 flex flex-col justify-between text-left animate-in fade-in duration-300">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block">{locale === 'ko' ? '레글런 게이지 & 신체 치수' : 'MEASUREMENTS'}</span>
                                    <button
                                        onClick={() => {
                                            setIsRaglanStandardClicked(true);
                                            setManualRaglanGauge(20);
                                            setManualNeckSize(38);
                                            setManualChestSize(96);
                                            setManualEaseSize(5);
                                        }}
                                        className="text-[8px] font-black text-[#F28E9B] bg-rose-50 border border-rose-100 px-2 py-0.5 rounded cursor-pointer hover:bg-rose-100 active:scale-95"
                                    >
                                        {locale === 'ko' ? '표준 사이즈 자동 채우기' : 'Auto Fill Standard'}
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 bg-[#FAF6F0] p-2 border border-[#EFE7DC] rounded-xl text-center">
                                    <div>
                                        <label className="text-[8px] font-black text-stone-400 block mb-0.5">게이지 / 10cm</label>
                                        <input
                                            type="number"
                                            value={manualRaglanGauge}
                                            onChange={(e) => setManualRaglanGauge(Number(e.target.value))}
                                            className="w-full bg-white border border-stone-150 rounded py-0.5 text-center text-[10px] font-bold font-mono outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-black text-stone-400 block mb-0.5">목둘레 (cm)</label>
                                        <input
                                            type="number"
                                            value={manualNeckSize}
                                            onChange={(e) => setManualNeckSize(Number(e.target.value))}
                                            className="w-full bg-white border border-stone-150 rounded py-0.5 text-center text-[10px] font-bold font-mono outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[9px] font-black text-stone-400 block mb-1">가슴둘레 (cm)</label>
                                    <input
                                        type="number"
                                        value={manualChestSize}
                                        onChange={(e) => setManualChestSize(Number(e.target.value))}
                                        className="w-full bg-[#FAF6F0]/50 border border-stone-150 rounded-xl px-3 py-1.8 text-xs font-black text-stone-700 font-mono outline-none focus:border-[#F28E9B] focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-stone-400 block mb-1">여유분 (cm)</label>
                                    <input
                                        type="number"
                                        value={manualEaseSize}
                                        onChange={(e) => setManualEaseSize(Number(e.target.value))}
                                        className="w-full bg-[#FAF6F0]/50 border border-stone-150 rounded-xl px-3 py-1.8 text-xs font-black text-stone-700 font-mono outline-none focus:border-[#F28E9B] focus:bg-white"
                                    />
                                </div>
                            </div>
                            <div className="text-[8px] text-stone-400 leading-normal font-medium text-left bg-stone-50 border border-stone-150 rounded-lg p-2">
                                {locale === 'ko'
                                    ? '* 레글런 늘림 계산은 목둘레 코수로부터 시작하여 겨드랑이선까지 대칭 분배합니다.'
                                    : '* Cast-on is symmetrically allocated from collar to sleeve boundaries.'}
                            </div>
                        </div>
                    )}

                    {activeTab === 'socks' && (
                        <div className="space-y-3 flex-1 flex flex-col justify-between text-left animate-in fade-in duration-300">
                            <div>
                                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-2">{locale === 'ko' ? '대바늘 양말 게이지 사양' : 'SOCK GAUGE SPEC'}</span>
                                <div className="grid grid-cols-1 gap-2 bg-[#FAF6F0] p-2 border border-[#EFE7DC] rounded-xl text-center">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[9px] font-black text-stone-400">양말 콧수 / 10cm</label>
                                        <input
                                            type="number"
                                            value={manualSockGauge}
                                            onChange={(e) => setManualSockGauge(Number(e.target.value))}
                                            className="w-20 bg-white border border-stone-150 rounded py-0.5 text-center text-[10px] font-bold font-mono outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[9px] font-black text-stone-400 block mb-1">{locale === 'ko' ? '발사이즈 (mm)' : 'Foot Length (mm)'}</label>
                                    <input
                                        type="number"
                                        value={manualSockSize}
                                        onChange={(e) => setManualSockSize(Number(e.target.value))}
                                        className="w-full bg-[#FAF6F0]/50 border border-stone-150 rounded-xl px-3 py-1.8 text-xs font-black text-stone-700 font-mono outline-none focus:border-[#F28E9B] focus:bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-stone-400 block mb-1">{locale === 'ko' ? '발목 높이 (cm)' : 'Cuff Height (cm)'}</label>
                                    <input
                                        type="number"
                                        value={manualSockHeight}
                                        onChange={(e) => setManualSockHeight(Number(e.target.value))}
                                        className="w-full bg-[#FAF6F0]/50 border border-stone-150 rounded-xl px-3 py-1.8 text-xs font-black text-stone-700 font-mono outline-none focus:border-[#F28E9B] focus:bg-white"
                                    />
                                </div>
                            </div>
                            <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-[8.5px] font-black text-[#F28E9B] leading-normal text-left">
                                {locale === 'ko'
                                    ? '💡 팁: 양말은 착용 시 수축을 감안하여 신체 치수보다 약 10~15% 타이트하게 설계됩니다.'
                                    : '💡 Tip: Socks are scaled 10-15% tighter for snug fitting elastic stretch.'}
                            </div>
                        </div>
                    )}

                    {activeTab === 'grading' && (
                        <div className="space-y-3 flex-1 flex flex-col justify-between text-left animate-in fade-in duration-300">
                            <div>
                                <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest block mb-2">{locale === 'ko' ? '원작 설계 단면 치수' : 'ORIGINAL SCALE'}</span>
                                <div className="grid grid-cols-2 gap-2 bg-[#FAF6F0] p-2 border border-[#EFE7DC] rounded-xl text-center">
                                    <div>
                                        <label className="text-[8px] font-black text-stone-400 block mb-0.5">가로 단면 (cm)</label>
                                        <input
                                            type="number"
                                            value={manualGradingWidth}
                                            onChange={(e) => setManualGradingWidth(Number(e.target.value))}
                                            className="w-full bg-white border border-stone-150 rounded py-0.5 text-center text-[10px] font-bold font-mono outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-black text-stone-400 block mb-0.5">콧수 (코)</label>
                                        <input
                                            type="number"
                                            value={manualGradingSts}
                                            onChange={(e) => setManualGradingSts(Number(e.target.value))}
                                            className="w-full bg-white border border-stone-150 rounded py-0.5 text-center text-[10px] font-bold font-mono outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-[#F28E9B] block mb-1">{locale === 'ko' ? '목표 단면 치수 (cm)' : 'Target Grading Width (cm)'}</label>
                                <input
                                    type="number"
                                    value={manualGradingTargetWidth}
                                    onChange={(e) => setManualGradingTargetWidth(Number(e.target.value))}
                                    placeholder="예) 55"
                                    className="w-full bg-rose-50/10 border border-rose-200 rounded-xl px-3 py-1.8 text-xs font-black text-stone-700 font-mono outline-none focus:border-[#F28E9B] focus:bg-white"
                                />
                            </div>
                            <div className="p-2 bg-[#FAF6F0] border border-[#EFE7DC] rounded-xl text-[8.5px] font-black text-stone-500 leading-normal text-left">
                                {locale === 'ko'
                                    ? '💡 원작 가로 편판 게이지 배율을 100% 반영한 정밀 리스케일링 그레이딩 기법입니다.'
                                    : '💡 Professional rescaling grading method preserving original swatch layout.'}
                            </div>
                        </div>
                    )}

                    {/* 수동 복구 복귀 뱃지 */}
                    {userActiveTab !== null && (
                        <div className="absolute top-2 right-2 select-none animate-in fade-in duration-300">
                            <span
                                onClick={() => {
                                    setUserActiveTab(null);
                                    setTime(0);
                                }}
                                className="text-[8.5px] font-black text-[#F28E9B] hover:text-[#e07b88] bg-rose-50 border border-rose-100 hover:border-rose-200 px-2 py-0.8 rounded-lg cursor-pointer flex items-center gap-1 active:scale-95 transition-all shadow-sm"
                            >
                                <RefreshCw className="w-2.5 h-2.5 text-[#F28E9B] animate-spin-slow" />
                                {locale === 'ko' ? '자동재생 복귀' : 'Back to Demo'}
                            </span>
                        </div>
                    )}
                </div>

                {/* 2. 우측 결과 시각화 영역 (2/5 분할) */}
                <div className="col-span-2 bg-white border border-[#EFE7DC] rounded-xl p-3.5 shadow-sm relative overflow-hidden select-none">
                    {renderRightVisualPanel()}
                </div>

                {/* 가상 클릭 리플 서클 피드백 */}
                {userActiveTab === null && ripple.show && (
                    <div
                        className="absolute pointer-events-none rounded-full border-4 border-rose-400/80 animate-ping z-50 bg-rose-200/20"
                        style={{
                            left: `${ripple.x}%`,
                            top: `${ripple.y}%`,
                            width: '32px',
                            height: '32px',
                            transform: 'translate(-50%, -50%)',
                            animationDuration: '0.4s'
                        }}
                    />
                )}

                {/* 가상 마우스 포인터 (수동 모드 시 숨김) */}
                {userActiveTab === null && (
                    <div
                        className="absolute pointer-events-none transition-all duration-75 ease-out z-50 flex items-center justify-center"
                        style={{
                            left: `${mouse.x}%`,
                            top: `${mouse.y}%`,
                            transform: `translate(-6px, -6px) scale(${mouseClicked ? 0.85 : 1})`,
                        }}
                    >
                        <MousePointer className="w-6 h-6 text-stone-800 fill-white drop-shadow-md filter" />
                    </div>
                )}
            </div>

            {/* 토스트 배너 피드백 */}
            {toast && (
                <div className="absolute top-28 left-1/2 -translate-x-1/2 bg-stone-900/90 backdrop-blur-sm text-white text-[11px] font-black px-4 py-2.5 rounded-full shadow-lg border border-stone-700/50 flex items-center gap-2 z-50 animate-in slide-in-from-bottom-2 duration-300">
                    <Check className="w-3.5 h-3.5 text-[#F28E9B] stroke-[3]" />
                    <span>{toast}</span>
                </div>
            )}

            {/* 하단 가이드라인 자막 안내 보드 */}
            <div className="mt-4 p-3 bg-white border border-[#EFE7DC] rounded-xl flex items-start gap-2.5 shadow-inner select-none">
                <Info className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
                <div>
                    <h5 className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">{locale === 'ko' ? '시연 가이드 자막' : 'DEMO SUBTITLES'}</h5>
                    <p className="text-xs text-stone-600 font-extrabold leading-normal transition-all duration-300 text-left">
                        {getSubtitleMessage()}
                    </p>
                </div>
            </div>
        </div>
    );
}