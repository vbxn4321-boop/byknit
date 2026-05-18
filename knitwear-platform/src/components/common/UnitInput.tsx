import { useState, useEffect } from 'react';

interface UnitInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    units?: string[];
    defaultUnit?: string;
}

export function UnitInput({ value, onChange, placeholder, units = ['g', 'm', 'yd', 'balls'], defaultUnit = 'g' }: UnitInputProps) {
    // Parse value directly from props
    // Check if value actually contains a unit, otherwise assume default
    const match = value ? value.match(/^([\d.]+)\s*([a-zA-Z]+)$/) : null;
    const currentAmount = match ? match[1] : value?.replace(/[^\d.]/g, '') || '';
    const currentUnit = match ? match[2] : (value && /[a-zA-Z]/.test(value) ? value.replace(/[\d.\s]/g, '') : defaultUnit);

    // Ensure unit is valid, otherwise fallback to default
    const safeUnit = units.includes(currentUnit) ? currentUnit : defaultUnit;

    const handleAmountChange = (newAmount: string) => {
        // Only allow numbers and decimals
        if (!/^\d*\.?\d*$/.test(newAmount)) return;
        onChange(`${newAmount}${safeUnit}`);
    };

    const handleUnitChange = (newUnit: string) => {
        onChange(`${currentAmount}${newUnit}`);
    };

    return (
        <div className="flex bg-white border border-stone-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-rose-100 transition-all">
            <input
                type="text"
                inputMode="decimal"
                value={currentAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder={placeholder || '0'}
                className="flex-1 px-3 py-2 text-sm font-bold text-stone-800 outline-none min-w-0"
            />
            <div className="border-l border-stone-100 bg-stone-50">
                <select
                    value={safeUnit}
                    onChange={(e) => handleUnitChange(e.target.value)}
                    className="h-full bg-transparent hover:bg-stone-100 text-xs font-bold text-stone-600 px-3 py-2 outline-none cursor-pointer appearance-none text-center"
                >
                    {units.map(u => (
                        <option key={u} value={u}>{u}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
