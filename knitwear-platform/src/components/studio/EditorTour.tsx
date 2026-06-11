'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';

interface TourStep {
    target: string; // CSS selector
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
    {
        target: '#tour-tools',
        title: '도구 선택',
        description: '이동, 색칠, 심볼, 지우개 도구를 선택할 수 있습니다. 스페이스바를 누르면 일시적으로 이동 도구로 전환됩니다.',
        position: 'bottom'
    },
    {
        target: '#tour-undo',
        title: '실행 취소 / 다시 실행',
        description: '작업을 실행 취소하거나 다시 실행할 수 있습니다. Ctrl+Z / Ctrl+Y도 사용 가능합니다.',
        position: 'bottom'
    },
    {
        target: '.flex-1.bg-stone-100',
        title: '캔버스 영역',
        description: '여기서 도안을 그립니다. 마우스 휠로 확대/축소, 드래그로 이동할 수 있습니다.',
        position: 'right'
    },
    {
        target: '.w-80.bg-white',
        title: '사이드바',
        description: '그리드 크기, 심볼, 색상 팔레트를 관리할 수 있습니다. 심볼과 색상은 우클릭으로 삭제할 수 있습니다.',
        position: 'left'
    }
];

interface EditorTourProps {
    showTour: boolean;
    onCloseTour: () => void;
}

function TourOverlay({ showTour, onCloseTour }: EditorTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const updateTargetRect = useCallback(() => {
        if (!showTour) return;

        const step = tourSteps[currentStep];
        const element = document.querySelector(step.target);
        if (element) {
            setTargetRect(element.getBoundingClientRect());
        }
    }, [showTour, currentStep]);

    useEffect(() => {
        updateTargetRect();
        window.addEventListener('resize', updateTargetRect);
        window.addEventListener('scroll', updateTargetRect);

        return () => {
            window.removeEventListener('resize', updateTargetRect);
            window.removeEventListener('scroll', updateTargetRect);
        };
    }, [updateTargetRect]);

    const handleNext = () => {
        if (currentStep < tourSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onCloseTour();
            setCurrentStep(0);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleClose = () => {
        onCloseTour();
        setCurrentStep(0);
    };

    if (!mounted || !showTour || !targetRect) return null;

    const step = tourSteps[currentStep];

    // Calculate tooltip position
    const getTooltipStyle = (): React.CSSProperties => {
        const padding = 12;
        const tooltipWidth = 320;
        const tooltipHeight = 180;

        switch (step.position) {
            case 'bottom':
                return {
                    position: 'fixed',
                    top: targetRect.bottom + padding,
                    left: Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 16)),
                    width: tooltipWidth,
                };
            case 'top':
                return {
                    position: 'fixed',
                    bottom: window.innerHeight - targetRect.top + padding,
                    left: Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 16)),
                    width: tooltipWidth,
                };
            case 'left':
                return {
                    position: 'fixed',
                    top: Math.max(16, Math.min(targetRect.top + targetRect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - 16)),
                    right: window.innerWidth - targetRect.left + padding,
                    width: tooltipWidth,
                };
            case 'right':
                return {
                    position: 'fixed',
                    top: Math.max(16, Math.min(targetRect.top + targetRect.height / 2 - tooltipHeight / 2, window.innerHeight - tooltipHeight - 16)),
                    left: targetRect.right + padding,
                    width: tooltipWidth,
                };
            default:
                return {};
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999]">
            {/* Overlay with cutout */}
            <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                <defs>
                    <mask id="tour-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        <rect
                            x={targetRect.left - 8}
                            y={targetRect.top - 8}
                            width={targetRect.width + 16}
                            height={targetRect.height + 16}
                            rx="12"
                            fill="black"
                        />
                    </mask>
                </defs>
                <rect
                    x="0" y="0" width="100%" height="100%"
                    fill="rgba(0,0,0,0.6)"
                    mask="url(#tour-mask)"
                    style={{ pointerEvents: 'auto' }}
                    onClick={handleClose}
                />
            </svg>

            {/* Highlight border */}
            <div
                className="absolute border-2 border-sage-400 rounded-xl pointer-events-none animate-pulse"
                style={{
                    left: targetRect.left - 8,
                    top: targetRect.top - 8,
                    width: targetRect.width + 16,
                    height: targetRect.height + 16,
                    boxShadow: '0 0 0 4px rgba(107, 142, 99, 0.3)'
                }}
            />

            {/* Tooltip */}
            <div
                className="bg-white rounded-2xl shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-300"
                style={getTooltipStyle()}
            >
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <span className="text-xs font-bold text-sage-600 bg-sage-100 px-2 py-1 rounded-full">
                            {currentStep + 1} / {tourSteps.length}
                        </span>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <h3 className="text-lg font-bold text-stone-800 mb-2">{step.title}</h3>
                <p className="text-sm text-stone-600 mb-4 leading-relaxed">{step.description}</p>

                <div className="flex gap-2">
                    {currentStep > 0 && (
                        <button
                            onClick={handlePrev}
                            className="flex items-center gap-1 px-4 py-2 rounded-xl border-2 border-stone-200 text-stone-600 font-semibold text-sm hover:bg-stone-50 transition-all"
                        >
                            <ChevronLeft size={16} />
                            이전
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        className="flex-1 flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-[#6B8E63] hover:bg-[#5A7853] text-white font-semibold text-sm transition-all"
                    >
                        {currentStep < tourSteps.length - 1 ? (
                            <>
                                다음
                                <ChevronRight size={16} />
                            </>
                        ) : (
                            '시작하기!'
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default function EditorTour() {
    const [showTour, setShowTour] = useState(false);
    const [hasSeenTour, setHasSeenTour] = useState(true);

    useEffect(() => {
        // Only trigger onboarding tour automatically on desktop/tablet
        if (window.innerWidth < 640) {
            localStorage.setItem('hasSeenEditorTour', 'true');
            return;
        }
        const seen = localStorage.getItem('hasSeenEditorTour');
        if (!seen) {
            // Delay tour start to ensure elements are rendered
            setTimeout(() => {
                setShowTour(true);
                setHasSeenTour(false);
            }, 500);
        }
    }, []);

    const handleCloseTour = () => {
        setShowTour(false);
        localStorage.setItem('hasSeenEditorTour', 'true');
    };

    const handleStartTour = () => {
        setShowTour(true);
    };

    return (
        <>
            {/* Help Button - hidden on mobile */}
            <button
                onClick={handleStartTour}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#6B8E63] hover:bg-[#5A7853] text-white rounded-full shadow-lg hover:shadow-xl transition-all hidden sm:flex items-center justify-center group"
                title="도움말 보기"
            >
                <HelpCircle size={24} />
                <span className="absolute right-full mr-3 px-3 py-1.5 bg-stone-800 text-white text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    도움말
                </span>
            </button>

            {/* Tour Overlay */}
            <TourOverlay showTour={showTour} onCloseTour={handleCloseTour} />
        </>
    );
}
