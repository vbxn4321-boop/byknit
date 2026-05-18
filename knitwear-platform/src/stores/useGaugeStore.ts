import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useState, useEffect } from 'react';

interface GaugeState {
    // Core Data (per 10cm)
    stitchGauge: number;
    rowGauge: number;
    needleSize: number;
    unit: 'cm' | 'inch';

    // Hydration flag
    _hasHydrated: boolean;

    // Actions
    setGauge: (stitches: number, rows: number) => void;
    setNeedleSize: (size: number) => void;
    setUnit: (unit: 'cm' | 'inch') => void;
    reset: () => void;
    setHasHydrated: (state: boolean) => void;
}

const DEFAULT_STATE = {
    stitchGauge: 0,
    rowGauge: 0,
    needleSize: 4.0,
    unit: 'cm' as const,
    _hasHydrated: false,
};

export const useGaugeStore = create<GaugeState>()(
    persist(
        (set) => ({
            ...DEFAULT_STATE,

            setGauge: (stitches, rows) =>
                set({ stitchGauge: stitches, rowGauge: rows }),

            setNeedleSize: (size) =>
                set({ needleSize: size }),

            setUnit: (unit) =>
                set({ unit }),

            reset: () =>
                set({ ...DEFAULT_STATE, _hasHydrated: true }),

            setHasHydrated: (state) =>
                set({ _hasHydrated: state }),
        }),
        {
            name: 'byknit-gauge-storage',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
            partialize: (state) => ({
                stitchGauge: state.stitchGauge,
                rowGauge: state.rowGauge,
                needleSize: state.needleSize,
                unit: state.unit,
            }),
        }
    )
);

// Computed helpers (not stored, derived on read)
export const useStPerCm = () => {
    const stitchGauge = useGaugeStore((s) => s.stitchGauge);
    return stitchGauge / 10;
};

export const useRowPerCm = () => {
    const rowGauge = useGaugeStore((s) => s.rowGauge);
    return rowGauge / 10;
};

// Hydration-safe hook to check if gauge is set
export const useIsGaugeSet = () => {
    const stitchGauge = useGaugeStore((s) => s.stitchGauge);
    const rowGauge = useGaugeStore((s) => s.rowGauge);
    const hasHydrated = useGaugeStore((s) => s._hasHydrated);

    // Use useState to track client-side hydration state
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // During SSR or before client hydration, return false to avoid mismatch
    if (!isClient || !hasHydrated) return false;

    return stitchGauge > 0 && rowGauge > 0;
};

// Hook to check hydration status
export const useHasHydrated = () => {
    return useGaugeStore((s) => s._hasHydrated);
};
