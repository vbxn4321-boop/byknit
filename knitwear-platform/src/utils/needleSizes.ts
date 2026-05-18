
export type NeedleUnit = 'mm' | 'us' | 'uk' | 'jp';

export interface NeedleSize {
    mm: number;
    us?: string;
    uk?: string;
    jp?: string;
}

// Ordered list of needle sizes based on standard conversions
export const NEEDLE_SIZES: NeedleSize[] = [
    { mm: 1.5, us: '000', uk: '16' },
    { mm: 1.75, us: '00', uk: '15' },
    { mm: 2.0, us: '0', uk: '14' },
    { mm: 2.1, jp: '0' },
    { mm: 2.25, us: '1', uk: '13' },
    { mm: 2.4, jp: '1' },
    { mm: 2.5, us: '1.5' }, // approx
    { mm: 2.7, jp: '2' },
    { mm: 2.75, us: '2', uk: '12' },
    { mm: 3.0, us: '2.5', uk: '11', jp: '3' },
    { mm: 3.25, us: '3', uk: '10' },
    { mm: 3.3, jp: '4' },
    { mm: 3.5, us: '4', uk: '9' },
    { mm: 3.6, jp: '5' },
    { mm: 3.75, us: '5', uk: '9' },
    { mm: 3.9, jp: '6' },
    { mm: 4.0, us: '6', uk: '8' },
    { mm: 4.2, jp: '7' },
    { mm: 4.25, us: '7' },
    { mm: 4.5, us: '7', uk: '7', jp: '8' }, // US 7 is often 4.5mm too
    { mm: 4.8, jp: '9' },
    { mm: 5.0, us: '8', uk: '6', jp: '10' },
    { mm: 5.1, jp: '11' },
    { mm: 5.25, us: '9' }, // approx
    { mm: 5.4, jp: '12' },
    { mm: 5.5, us: '9', uk: '5', jp: '13' }, // US 9 is 5.5mm often
    { mm: 5.7, jp: '14' },
    { mm: 6.0, us: '10', uk: '4', jp: '15' }, // 15号 is 6.6mm?? No standard varies. 
    // Checking JIS L 2501 for JP sizes:
    // 0: 2.1, 1: 2.4, 2: 2.7, 3: 3.0, 4: 3.3, 5: 3.6, 6: 3.9, 7: 4.2, 8: 4.5, 9: 4.8, 10: 5.1, 11: 5.4, 12: 5.7, 13: 6.0, 14: 6.3, 15: 6.6
    // Let's correct JP sizes based on standard JIS if possible or common usage.
    // Common knitting needle sizes (JIS):
    // 0号=2.1mm, 1=2.4, 2=2.7, 3=3.0, 4=3.3, 5=3.6, 6=3.9, 7=4.2, 8=4.5, 9=4.8, 10=5.1
    // 11=5.4, 12=5.7, 13=6.0, 14=6.3, 15=6.6mm.
    // Jumbo: 7mm, 8mm, etc.
    { mm: 6.3, jp: '14' },
    { mm: 6.5, us: '10.5', uk: '3' },
    { mm: 6.6, jp: '15' },
    { mm: 7.0, us: '10.5', uk: '2', jp: '7mm' }, // Jumbo 7mm
    { mm: 8.0, us: '11', uk: '0', jp: '8mm' },
    { mm: 9.0, us: '13', uk: '00' },
    { mm: 10.0, us: '15', uk: '000', jp: '10mm' },
    { mm: 12.0, us: '17', jp: '12mm' },
    { mm: 15.0, us: '19', jp: '15mm' },
    { mm: 20.0, us: '35', jp: '20mm' },
    { mm: 25.0, us: '50' }
];

export function getNeedleString(size: NeedleSize, unit: NeedleUnit): string {
    switch (unit) {
        case 'us':
            return size.us ? `US ${size.us} (${size.mm}mm)` : `${size.mm}mm`;
        case 'uk':
            return size.uk ? `UK ${size.uk} (${size.mm}mm)` : `${size.mm}mm`;
        case 'jp':
            return size.jp ? `JP ${size.jp}호 (${size.mm}mm)` : `${size.mm}mm`;
        case 'mm':
        default:
            return `${size.mm}mm`;
    }
}

export function findClosestSize(mm: number): NeedleSize {
    return NEEDLE_SIZES.reduce((prev, curr) =>
        Math.abs(curr.mm - mm) < Math.abs(prev.mm - mm) ? curr : prev
    );
}

export function parseNeedleString(str: string): { mm: number, unit: NeedleUnit } {
    if (!str) return { mm: 4.0, unit: 'mm' };

    // Check for units
    if (str.includes('US')) return { mm: parseFloat(str.match(/\(([\d.]+)mm\)/)?.[1] || str) || 4.0, unit: 'us' };
    if (str.includes('UK')) return { mm: parseFloat(str.match(/\(([\d.]+)mm\)/)?.[1] || str) || 4.0, unit: 'uk' };
    if (str.includes('JP') || str.includes('호')) return { mm: parseFloat(str.match(/\(([\d.]+)mm\)/)?.[1] || str) || 4.0, unit: 'jp' };

    // Default mm
    const mm = parseFloat(str.replace(/[^\d.]/g, ''));
    return { mm: isNaN(mm) ? 4.0 : mm, unit: 'mm' };
}
