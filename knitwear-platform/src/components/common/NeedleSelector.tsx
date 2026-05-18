import { useState, useEffect } from 'react';
import { NEEDLE_SIZES, NeedleSize, NeedleUnit, findClosestSize, getNeedleString, parseNeedleString } from '@/utils/needleSizes';
import { ChevronDown } from 'lucide-react';

interface NeedleSelectorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export function NeedleSelector({ value, onChange, placeholder }: NeedleSelectorProps) {
    const [unit, setUnit] = useState<NeedleUnit>('mm');
    const [isOpen, setIsOpen] = useState(false);

    // Initialize unit from value if possible
    useEffect(() => {
        const { unit: parsedUnit } = parseNeedleString(value);
        if (value) setUnit(parsedUnit);
    }, []);

    const currentSize = parseNeedleString(value);

    // Filter sizes that exist for the current unit
    const availableSizes = NEEDLE_SIZES.filter(s => {
        if (unit === 'mm') return true;
        return s[unit] !== undefined;
    });

    const handleSelect = (size: NeedleSize) => {
        onChange(getNeedleString(size, unit));
        setIsOpen(false);
    };

    const handleUnitChange = (newUnit: NeedleUnit) => {
        setUnit(newUnit);
        // Auto convert current size to new unit
        const closest = findClosestSize(currentSize.mm);
        onChange(getNeedleString(closest, newUnit));
    };

    return (
        <div className="relative">
            <div className="flex bg-white border border-stone-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-rose-100 transition-all">
                {/* Unit Selector */}
                <div className="border-r border-stone-100">
                    <select
                        value={unit}
                        onChange={(e) => handleUnitChange(e.target.value as NeedleUnit)}
                        className="h-full bg-stone-50 hover:bg-stone-100 text-xs font-bold text-stone-600 px-3 py-2 outline-none cursor-pointer appearance-none text-center"
                    >
                        <option value="mm">mm</option>
                        <option value="us">US</option>
                        <option value="uk">UK</option>
                        <option value="jp">JP</option>
                    </select>
                </div>

                {/* Size Dropdown Trigger */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex-1 flex items-center justify-between px-3 py-2 text-sm font-bold text-stone-800 hover:bg-stone-50 transition-colors text-left"
                >
                    <span className={!value ? 'text-stone-300' : ''}>
                        {value || placeholder || 'Select Size'}
                    </span>
                    <ChevronDown size={14} className={`text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg max-h-60 overflow-y-auto z-20 custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
                        {availableSizes.map((size) => (
                            <button
                                key={size.mm}
                                type="button"
                                onClick={() => handleSelect(size)}
                                className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-rose-50 hover:text-rose-600 transition-colors ${currentSize.mm === size.mm ? 'bg-rose-50 text-rose-600 font-bold' : 'text-stone-600'
                                    }`}
                            >
                                {unit === 'mm' ? `${size.mm}mm` :
                                    unit === 'us' ? `US ${size.us} (${size.mm}mm)` :
                                        unit === 'uk' ? `UK ${size.uk} (${size.mm}mm)` :
                                            `JP ${size.jp}호 (${size.mm}mm)`}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
