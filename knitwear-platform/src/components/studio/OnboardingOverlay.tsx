'use client';

import React from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface OnboardingOverlayProps {
    t: (key: string) => string;
    step: number;
    setStep: (step: number) => void;
    onClose: () => void;
}

export function OnboardingOverlay({ t, step, setStep, onClose }: OnboardingOverlayProps) {
    const totalSteps = 5;

    const steps = [
        {
            title: t('onboarding.step1.title') || 'Welcome to the Grid Editor',
            description: t('onboarding.step1.description') || 'Create beautiful knitting patterns with our intuitive grid editor.',
        },
        {
            title: t('onboarding.step2.title') || 'Choose Your Tools',
            description: t('onboarding.step2.description') || 'Select from symbols, paint, eraser, or move tools to design your pattern.',
        },
        {
            title: t('onboarding.step3.title') || 'Add Symbols & Colors',
            description: t('onboarding.step3.description') || 'Customize your pattern with different stitch symbols and colors.',
        },
        {
            title: t('onboarding.step4.title') || 'Export Your Work',
            description: t('onboarding.step4.description') || 'Download your pattern as PNG, JPG, or PDF when you\'re done.',
        },
        {
            title: t('onboarding.step5.title') || 'Publish & Sell',
            description: t('onboarding.step5.description') || 'Share your creativity! Publish your patterns to the marketplace and start selling.',
        },
    ];

    const currentStep = steps[step - 1];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                        <div className="text-sm font-semibold text-sage-600 mb-2">
                            Step {step} of {totalSteps}
                        </div>
                        <h2 className="text-2xl font-bold text-stone-800">
                            {currentStep.title}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <p className="text-stone-600 leading-relaxed mb-8">
                    {currentStep.description}
                </p>

                {/* Progress Dots */}
                <div className="flex gap-2 mb-8">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <div
                            key={i}
                            className={`h-2 flex-1 rounded-full transition-all ${i + 1 === step
                                ? 'bg-sage-600'
                                : i + 1 < step
                                    ? 'bg-sage-300'
                                    : 'bg-stone-200'
                                }`}
                        />
                    ))}
                </div>

                {/* Navigation */}
                <div className="flex gap-3">
                    {step > 1 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-stone-200 text-stone-700 font-semibold hover:bg-stone-50 transition-all"
                        >
                            <ChevronLeft size={18} />
                            Back
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (step < totalSteps) {
                                setStep(step + 1);
                            } else {
                                onClose();
                            }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#6B8E63] hover:bg-[#5A7853] text-white font-semibold transition-all shadow-sm hover:shadow-md"
                    >
                        {step < totalSteps ? 'Next' : 'Get Started'}
                        {step < totalSteps && <ChevronRight size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
