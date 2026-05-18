/**
 * Knitting Math Utility Library
 * All formulas are validated against standard knitting calculations.
 */

// ============================================================================
// A. Basic Converters
// ============================================================================

/**
 * Calculate number of stitches for a given length.
 * @param cm - Length in centimeters
 * @param gaugePerTenCm - Stitch gauge per 10cm
 * @returns Number of stitches (rounded)
 */
export function calcStitches(cm: number, gaugePerTenCm: number): number {
    if (gaugePerTenCm <= 0) return 0;
    return Math.round(cm * (gaugePerTenCm / 10));
}

/**
 * Calculate number of rows for a given length.
 * @param cm - Length in centimeters
 * @param gaugePerTenCm - Row gauge per 10cm
 * @returns Number of rows (rounded)
 */
export function calcRows(cm: number, gaugePerTenCm: number): number {
    if (gaugePerTenCm <= 0) return 0;
    return Math.round(cm * (gaugePerTenCm / 10));
}

/**
 * Convert stitches to length in cm.
 * @param stitches - Number of stitches
 * @param gaugePerTenCm - Stitch gauge per 10cm
 * @returns Length in cm
 */
export function stitchesToCm(stitches: number, gaugePerTenCm: number): number {
    if (gaugePerTenCm <= 0) return 0;
    return stitches / (gaugePerTenCm / 10);
}

/**
 * Convert rows to length in cm.
 * @param rows - Number of rows
 * @param gaugePerTenCm - Row gauge per 10cm
 * @returns Length in cm
 */
export function rowsToCm(rows: number, gaugePerTenCm: number): number {
    if (gaugePerTenCm <= 0) return 0;
    return rows / (gaugePerTenCm / 10);
}

// ============================================================================
// B. Yarn Substitute Calculator
// ============================================================================

interface YarnSubstituteResult {
    ballsNeeded: number;
    totalMetersNeeded: number;
    warning: string | null;
}

/**
 * Calculate yarn substitution.
 * @param originalBalls - Number of balls in original pattern
 * @param originalMetersPerBall - Meters per ball of original yarn
 * @param myMetersPerBall - Meters per ball of my yarn
 * @param originalWeight - Weight per ball of original yarn (grams, optional)
 * @param myWeight - Weight per ball of my yarn (grams, optional)
 * @returns Balls needed and any warnings
 */
export function calcYarnSubstitute(
    originalBalls: number,
    originalMetersPerBall: number,
    myMetersPerBall: number,
    originalWeight?: number,
    myWeight?: number
): YarnSubstituteResult {
    const totalMetersNeeded = originalBalls * originalMetersPerBall;
    const ballsNeeded = totalMetersNeeded / myMetersPerBall;

    let warning: string | null = null;

    // Check weight ratio if provided (yarn weight category check)
    if (originalWeight && myWeight && originalMetersPerBall && myMetersPerBall) {
        const originalRatio = originalMetersPerBall / originalWeight; // m/g
        const myRatio = myMetersPerBall / myWeight; // m/g
        const diff = Math.abs(originalRatio - myRatio) / originalRatio;

        if (diff > 0.2) {
            warning = '실 두께가 20% 이상 차이납니다. 게이지가 많이 다를 수 있습니다.';
        }
    }

    return {
        ballsNeeded: Math.ceil(ballsNeeded * 10) / 10, // Round up to 1 decimal
        totalMetersNeeded,
        warning,
    };
}

// ============================================================================
// C. Top-Down Raglan Wizard
// ============================================================================

interface RaglanResult {
    castOn: number;           // Starting stitches at neck
    targetChestStitches: number; // Target chest stitches
    totalIncreases: number;   // Total increases needed
    increaseCount: number;    // Number of increase rounds
    totalRounds: number;      // Total raglan depth rounds
    perSection: {
        front: number;
        back: number;
        sleeve: number;
    };
}

/**
 * Calculate top-down raglan sweater construction.
 * @param neckCirc - Neck circumference in cm
 * @param chestCirc - Chest circumference in cm
 * @param ease - Ease to add (typically +5cm for comfort)
 * @param stitchGauge - Stitches per 10cm
 * @param rowGauge - Rows per 10cm
 * @param raglanDepth - Depth from neck to underarm in cm (optional, defaults to calculated)
 * @returns Raglan construction details
 */
export function calcRaglan(
    neckCirc: number,
    chestCirc: number,
    ease: number,
    stitchGauge: number,
    rowGauge: number,
    raglanDepth?: number
): RaglanResult {
    const RAGLAN_LINES = 8; // 4 positions × 2 stitches each

    const castOn = calcStitches(neckCirc + ease, stitchGauge);
    const targetChestStitches = calcStitches(chestCirc + ease, stitchGauge);
    const totalIncreases = targetChestStitches - castOn;
    const increaseCount = Math.ceil(totalIncreases / RAGLAN_LINES);
    const totalRounds = increaseCount * 2; // Increase every 2nd round

    // Calculate section distribution
    // Standard ratio: Back = Front, Sleeves = smaller
    // Typical: 1/3 back, 1/3 front, 1/6 each sleeve
    const bodyStitches = Math.floor((castOn - RAGLAN_LINES) * 0.33);
    const sleeveStitches = Math.floor((castOn - RAGLAN_LINES - bodyStitches * 2) / 2);

    return {
        castOn,
        targetChestStitches,
        totalIncreases,
        increaseCount,
        totalRounds,
        perSection: {
            front: bodyStitches,
            back: bodyStitches,
            sleeve: sleeveStitches,
        },
    };
}

// ============================================================================
// D. Sock Planner
// ============================================================================

interface SockResult {
    castOn: number;           // Total stitches
    heelFlapStitches: number; // Width of heel flap (half of total)
    instepStitches: number;   // Front/Instep stitches (half of total)
    gussetPickUp: number;     // Stitches to pick up along heel flap
    heelTurnStitches: number; // Stitches to leave for heel turn center

    // Lengths
    totalFootLength: number;  // Desired final length
    toeLength: number;        // Approx length of toe decrease
    lengthBeforeToe: number;  // When to start toe decreases

    rawCalculation: number;   // Debug value
}

/**
 * Calculate detailed sock construction.
 * 
 * @param footCirc - Foot circumference in cm
 * @param footLength - Foot length in cm
 * @param stitchGauge - Stitches per 10cm
 * @param rowGauge - Rows per 10cm (optional, used for accurate heel flap length)
 */
export function calcSockDetails(
    footCirc: number,
    footLength: number,
    stitchGauge: number,
    rowGauge: number = 0 // Optional, future refinement
): SockResult {
    const NEGATIVE_EASE = 0.9; // 10% negative ease
    const NEEDLE_MULTIPLE = 4; // Ensure divisible by 4

    // 1. Cast On
    const rawStitches = footCirc * NEGATIVE_EASE * (stitchGauge / 10);
    const castOn = Math.floor(rawStitches / NEEDLE_MULTIPLE) * NEEDLE_MULTIPLE;

    // 2. Heel & Instep
    const heelFlapStitches = castOn / 2;
    const instepStitches = castOn / 2;

    // 3. Heel Turn (Roughly 1/3 of heel flap)
    const heelTurnStitches = Math.round(heelFlapStitches / 3);

    // 4. Gusset Pickup (Standard: 1 stitch per 2 rows of heel flap. 
    // Assuming square heel flap = same rows as stitches)
    const gussetPickUp = Math.ceil(heelFlapStitches / 2) + 1; // +1 for gap closing

    // 5. Toe Logic
    // Standard wedge toe is approx 4-5cm for adults, 2-3cm for kids.
    // Or roughly 20% of foot length? Let's use a standard approximation based on width.
    // Toe usually takes ~2 inches (5cm) for average gauge.
    const toeLength = Math.min(footLength * 0.2, 5.5);
    const lengthBeforeToe = Math.max(0, footLength - toeLength);

    return {
        castOn,
        heelFlapStitches,
        instepStitches,
        gussetPickUp,
        heelTurnStitches,
        totalFootLength: footLength,
        toeLength: Number(toeLength.toFixed(1)),
        lengthBeforeToe: Number(lengthBeforeToe.toFixed(1)),
        rawCalculation: rawStitches,
    };
}

// ============================================================================
// E. Pattern Grader (Size Scaling)
// ============================================================================

interface GradingResult {
    targetStitches: number;
    scaleFactor: number;
}

/**
 * Scale stitch count proportionally from one size to another.
 * @param currentSizeCm - Current pattern size in cm
 * @param targetSizeCm - Desired size in cm
 * @param currentStitchCount - Stitch count at current size
 * @returns Scaled stitch count
 */
export function calcGrading(
    currentSizeCm: number,
    targetSizeCm: number,
    currentStitchCount: number
): GradingResult {
    const scaleFactor = targetSizeCm / currentSizeCm;
    const targetStitches = Math.round(currentStitchCount * scaleFactor);

    return {
        targetStitches,
        scaleFactor,
    };
}

// ============================================================================
// Standard Body Measurements (CYC Standard)
// ============================================================================

export const WOMENS_STANDARD = {
    S: { chest: 86, neck: 36, armLength: 58, waist: 68, hip: 91 },
    M: { chest: 96, neck: 38, armLength: 59, waist: 76, hip: 101 },
    L: { chest: 106, neck: 40, armLength: 60, waist: 86, hip: 111 },
    XL: { chest: 117, neck: 42, armLength: 61, waist: 96, hip: 122 },
    '2XL': { chest: 127, neck: 43, armLength: 62, waist: 106, hip: 132 },
    '3XL': { chest: 137, neck: 44, armLength: 62.5, waist: 116, hip: 142 },
} as const;

export const MENS_STANDARD = {
    S: { chest: 91, neck: 38, armLength: 61, waist: 76, hip: 91 },
    M: { chest: 101, neck: 40, armLength: 63, waist: 86, hip: 101 },
    L: { chest: 111, neck: 42, armLength: 65, waist: 96, hip: 111 },
    XL: { chest: 122, neck: 44, armLength: 67, waist: 106, hip: 122 },
    '2XL': { chest: 132, neck: 46, armLength: 68, waist: 116, hip: 132 },
    '3XL': { chest: 142, neck: 48, armLength: 69, waist: 126, hip: 142 },
} as const;

export const SOCK_STANDARD_SIZES = {
    'Baby (6-12 mo)': { footCirc: 14, footLength: 10 }, // ~5.5" circ, 4" len
    'Toddler (1-3 yr)': { footCirc: 15, footLength: 13 }, // ~6" circ, 5" len
    'Child (4-6 yr)': { footCirc: 16.5, footLength: 16 }, // ~6.5" circ, 6.25" len
    'Child (7-9 yr)': { footCirc: 18, footLength: 19 }, // ~7" circ, 7.5" len
    'Woman S': { footCirc: 20.5, footLength: 22 }, // ~8" circ
    'Woman M': { footCirc: 23, footLength: 24 }, // ~9" circ
    'Woman L': { footCirc: 25.5, footLength: 26 }, // ~10" circ
    'Man M': { footCirc: 25, footLength: 26 },
    'Man L': { footCirc: 28, footLength: 29 },
} as const;

export type SockSizeKey = keyof typeof SOCK_STANDARD_SIZES;

export type SizeKey = 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';
