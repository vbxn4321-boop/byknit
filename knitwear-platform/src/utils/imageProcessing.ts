export interface QuantizationResult {
    palette: string[];
    grid: number[][]; // Indices into palette
}

/**
 * Calculates the Euclidean distance between two colors in RGB space.
 */
function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) {
    return Math.sqrt(
        Math.pow(r2 - r1, 2) +
        Math.pow(g2 - g1, 2) +
        Math.pow(b2 - b1, 2)
    );
}

/**
 * Converts RGB numbers to Hex string
 */
function rgbToHex(r: number, g: number, b: number): string {
    return `#${[r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('')}`.toUpperCase();
}

/**
 * Quantizes an image to a specific number of colors using K-Means clustering.
 * This provides much better results than simple frequency counting, as it optimaly
 * distributes the palette to represent the image's colors.
 */
export function quantizeImage(
    pixels: Uint8ClampedArray,
    width: number,
    height: number,
    maxColors: number
): QuantizationResult {
    // 1. Gather all non-transparent pixels
    const allColors: [number, number, number][] = [];
    for (let i = 0; i < pixels.length; i += 4) {
        // Skip fully transparent pixels? 
        // Our previous logic flattened to white, so alpha should be 255 mostly.
        // But let's check just in case.
        if (pixels[i + 3] < 128) continue;
        allColors.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
    }

    if (allColors.length === 0) {
        return { palette: ['#FFFFFF'], grid: Array(height).fill(Array(width).fill(0)) };
    }

    // 2. Initialize Centers (K-Means)
    // We'll pick random pixels as starting points
    let centers: [number, number, number][] = [];
    if (allColors.length <= maxColors) {
        centers = allColors;
    } else {
        // Random initialization
        for (let i = 0; i < maxColors; i++) {
            centers.push(allColors[Math.floor(Math.random() * allColors.length)]);
        }
    }

    // 3. K-Means Iterations
    const MAX_ITERATIONS = 5; // Fast approximation is enough for UI

    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
        // Assign points to nearest center
        const assignments: number[] = new Array(allColors.length);
        const sums: [number, number, number][] = centers.map(() => [0, 0, 0]);
        const counts: number[] = centers.map(() => 0);

        for (let i = 0; i < allColors.length; i++) {
            const [r, g, b] = allColors[i];
            let minDist = Infinity;
            let bestCenter = 0;

            for (let c = 0; c < centers.length; c++) {
                const dist = colorDistance(r, g, b, centers[c][0], centers[c][1], centers[c][2]);
                if (dist < minDist) {
                    minDist = dist;
                    bestCenter = c;
                }
            }
            assignments[i] = bestCenter;
            sums[bestCenter][0] += r;
            sums[bestCenter][1] += g;
            sums[bestCenter][2] += b;
            counts[bestCenter]++;
        }

        // Recalculate centers
        let changed = false;
        for (let c = 0; c < centers.length; c++) {
            if (counts[c] > 0) {
                const newR = sums[c][0] / counts[c];
                const newG = sums[c][1] / counts[c];
                const newB = sums[c][2] / counts[c];

                // Check convergence (simple check)
                if (Math.abs(newR - centers[c][0]) > 1 || Math.abs(newG - centers[c][1]) > 1 || Math.abs(newB - centers[c][2]) > 1) {
                    changed = true;
                }
                centers[c] = [newR, newG, newB];
            } else {
                // If a center has no points, re-initialize it to a random point
                centers[c] = allColors[Math.floor(Math.random() * allColors.length)];
            }
        }

        if (!changed) break;
    }

    // 4. Create Palette
    const palette = centers.map(c => rgbToHex(c[0], c[1], c[2]));

    // 5. Create Grid
    const grid: number[][] = [];
    let pixelIdx = 0;

    for (let y = 0; y < height; y++) {
        const row: number[] = [];
        for (let x = 0; x < width; x++) {
            const r = pixels[pixelIdx];
            const g = pixels[pixelIdx + 1];
            const b = pixels[pixelIdx + 2];
            const a = pixels[pixelIdx + 3];

            // Re-find nearest center for the final grid
            // (We could cached this if we tracked pixel positions, but re-calculating map is fast for small grids)
            let minDist = Infinity;
            let bestCenter = 0;

            for (let c = 0; c < centers.length; c++) {
                const dist = colorDistance(r, g, b, centers[c][0], centers[c][1], centers[c][2]);
                if (dist < minDist) {
                    minDist = dist;
                    bestCenter = c;
                }
            }
            row.push(bestCenter);
            pixelIdx += 4;
        }
        grid.push(row);
    }

    return { palette, grid };
}
