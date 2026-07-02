'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, HelpCircle } from 'lucide-react';

interface PollData {
    question: string;
    options: string[];
}

interface PollCreatorProps {
    onChange: (data: PollData | null) => void;
    locale: string;
}

export function PollCreator({ onChange, locale }: PollCreatorProps) {
    const [isActive, setIsActive] = useState(false);
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState<string[]>(['', '']);

    useEffect(() => {
        if (isActive && question.trim() && options.filter(o => o.trim()).length >= 2) {
            onChange({
                question: question.trim(),
                options: options.map(o => o.trim()).filter(Boolean)
            });
        } else {
            onChange(null);
        }
    }, [isActive, question, options]);

    const handleAddOption = () => {
        if (options.length >= 5) return;
        setOptions([...options, '']);
    };

    const handleRemoveOption = (index: number) => {
        if (options.length <= 2) return;
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleToggleActive = () => {
        const newActive = !isActive;
        setIsActive(newActive);
        if (!newActive) {
            setQuestion('');
            setOptions(['', '']);
        }
    };

    return (
        <div className="bg-cream-50/50 rounded-2xl border border-tan-100 p-5 mt-4">
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={handleToggleActive}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all ${
                        isActive 
                            ? 'bg-rose-500 text-white hover:bg-rose-600' 
                            : 'bg-white border border-tan-200 text-brown-600 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100'
                    }`}
                >
                    <HelpCircle className="w-4 h-4" />
                    {isActive 
                        ? (locale === 'ko' ? '투표 삭제하기' : 'Remove Poll') 
                        : (locale === 'ko' ? '+ 투표 추가하기' : '+ Add Poll')
                    }
                </button>
                {isActive && (
                    <span className="text-xs text-brown-400">
                        {locale === 'ko' ? '최소 2개, 최대 5개의 항목을 입력하세요' : 'Enter 2 to 5 options'}
                    </span>
                )}
            </div>

            {isActive && (
                <div className="mt-5 space-y-4">
                    {/* Question Input */}
                    <div>
                        <label className="block text-xs font-bold text-brown-500 uppercase tracking-wider mb-2">
                            {locale === 'ko' ? '투표 질문' : 'Poll Question'}
                        </label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-tan-200 focus:ring-2 focus:ring-rose-300 outline-none text-brown-800 placeholder-brown-300 text-sm bg-white"
                            placeholder={locale === 'ko' ? '예: 어떤 뜨개 기법을 선호하시나요?' : 'e.g. Which craft type do you prefer?'}
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                        />
                    </div>

                    {/* Options List */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-brown-500 uppercase tracking-wider mb-2">
                            {locale === 'ko' ? '선택지 목록' : 'Options'}
                        </label>
                        
                        {options.map((option, index) => (
                            <div key={index} className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    required
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-tan-200 focus:ring-2 focus:ring-rose-300 outline-none text-brown-800 placeholder-brown-300 text-sm bg-white"
                                    placeholder={locale === 'ko' ? `선택지 ${index + 1}` : `Option ${index + 1}`}
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                />
                                {options.length > 2 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveOption(index)}
                                        className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Add Option Button */}
                    {options.length < 5 && (
                        <button
                            type="button"
                            onClick={handleAddOption}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all mt-2"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            {locale === 'ko' ? '선택지 추가' : 'Add Option'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
