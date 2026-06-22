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
    maxColors: number,
    removeBackground?: boolean
): QuantizationResult {
    // Detect background color from corners if removeBackground is enabled
    let bgR = 255, bgG = 255, bgB = 255, hasBg = false;
    if (removeBackground) {
        const corners = [
            0,
            (width - 1) * 4,
            (height - 1) * width * 4,
            (height * width - 1) * 4
        ];
        for (const idx of corners) {
            if (pixels[idx + 3] >= 128) {
                bgR = pixels[idx];
                bgG = pixels[idx + 1];
                bgB = pixels[idx + 2];
                hasBg = true;
                break;
            }
        }
    }

    const transparentMask = new Array(width * height).fill(false);
    
    // Always mask out pixels that are already transparent
    for (let i = 0; i < width * height; i++) {
        if (pixels[i * 4 + 3] < 128) {
            transparentMask[i] = true;
        }
    }

    if (removeBackground && hasBg) {
        // BFS Flood-fill starting from all border pixels that match the background color
        const visited = new Uint8Array(width * height);
        const queue: number[] = [];

        // Helper to check and enqueue border seeds
        const checkAndEnqueue = (idx: number) => {
            if (!visited[idx] && !transparentMask[idx]) {
                const r = pixels[idx * 4];
                const g = pixels[idx * 4 + 1];
                const b = pixels[idx * 4 + 2];
                if (colorDistance(r, g, b, bgR, bgG, bgB) < 15) {
                    queue.push(idx);
                    visited[idx] = 1;
                }
            }
        };

        // Top and Bottom borders
        for (let x = 0; x < width; x++) {
            checkAndEnqueue(x);
            checkAndEnqueue((height - 1) * width + x);
        }
        // Left and Right borders
        for (let y = 0; y < height; y++) {
            checkAndEnqueue(y * width);
            checkAndEnqueue(y * width + (width - 1));
        }

        // Run Breadth-First Search
        let head = 0;
        while (head < queue.length) {
            const currIdx = queue[head++];
            transparentMask[currIdx] = true;

            const cx = currIdx % width;
            const cy = Math.floor(currIdx / width);

            // 4-neighborhood
            const neighbors = [
                [cx - 1, cy],
                [cx + 1, cy],
                [cx, cy - 1],
                [cx, cy + 1]
            ];

            for (const [nx, ny] of neighbors) {
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const nIdx = ny * width + nx;
                    if (!visited[nIdx] && !transparentMask[nIdx]) {
                        const nr = pixels[nIdx * 4];
                        const ng = pixels[nIdx * 4 + 1];
                        const nb = pixels[nIdx * 4 + 2];
                        if (colorDistance(nr, ng, nb, bgR, bgG, bgB) < 15) {
                            queue.push(nIdx);
                            visited[nIdx] = 1;
                        }
                    }
                }
            }
        }
    }

    // Gather all non-transparent pixels
    const allColors: [number, number, number][] = [];
    for (let i = 0; i < transparentMask.length; i++) {
        if (!transparentMask[i]) {
            allColors.push([pixels[i * 4], pixels[i * 4 + 1], pixels[i * 4 + 2]]);
        }
    }

    if (allColors.length === 0) {
        return { palette: ['#FFFFFF'], grid: Array(height).fill(null).map(() => Array(width).fill(0)) };
    }

    // Find unique colors to handle simple images/pixel art and clean initialization
    const uniqueColorMap = new Map<string, [number, number, number]>();
    for (const [r, g, b] of allColors) {
        const hex = rgbToHex(r, g, b);
        if (!uniqueColorMap.has(hex)) {
            uniqueColorMap.set(hex, [r, g, b]);
        }
    }
    const uniqueColors = Array.from(uniqueColorMap.values());

    let centers: [number, number, number][] = [];

    if (uniqueColors.length <= maxColors) {
        // If image has fewer colors than requested, use them directly
        centers = uniqueColors;
    } else {
        // Initialize using furthest-point (Greedy Maxmin) heuristic from unique colors
        centers.push(uniqueColors[0]);
        while (centers.length < maxColors) {
            let maxDist = -1;
            let furthestIdx = 0;
            for (let i = 0; i < uniqueColors.length; i++) {
                const [r, g, b] = uniqueColors[i];
                let minDist = Infinity;
                for (let c = 0; c < centers.length; c++) {
                    const dist = colorDistance(r, g, b, centers[c][0], centers[c][1], centers[c][2]);
                    if (dist < minDist) {
                        minDist = dist;
                    }
                }
                if (minDist > maxDist) {
                    maxDist = minDist;
                    furthestIdx = i;
                }
            }
            centers.push(uniqueColors[furthestIdx]);
        }

        // K-Means Iterations to optimize the centers
        const MAX_ITERATIONS = 10;
        for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
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
                sums[bestCenter][0] += r;
                sums[bestCenter][1] += g;
                sums[bestCenter][2] += b;
                counts[bestCenter]++;
            }

            let changed = false;
            for (let c = 0; c < centers.length; c++) {
                if (counts[c] > 0) {
                    const newR = sums[c][0] / counts[c];
                    const newG = sums[c][1] / counts[c];
                    const newB = sums[c][2] / counts[c];

                    if (Math.abs(newR - centers[c][0]) > 1 || Math.abs(newG - centers[c][1]) > 1 || Math.abs(newB - centers[c][2]) > 1) {
                        changed = true;
                    }
                    centers[c] = [newR, newG, newB];
                } else {
                    // Re-initialize to the furthest unique color from other active centers
                    let maxDist = -1;
                    let furthestIdx = 0;
                    for (let i = 0; i < uniqueColors.length; i++) {
                        const [r, g, b] = uniqueColors[i];
                        let minDist = Infinity;
                        for (let tempC = 0; tempC < centers.length; tempC++) {
                            if (tempC === c || counts[tempC] === 0) continue;
                            const dist = colorDistance(r, g, b, centers[tempC][0], centers[tempC][1], centers[tempC][2]);
                            if (dist < minDist) minDist = dist;
                        }
                        if (minDist > maxDist) {
                            maxDist = minDist;
                            furthestIdx = i;
                        }
                    }
                    centers[c] = uniqueColors[furthestIdx];
                }
            }

            if (!changed) break;
        }
    }

    // 4. Create Palette
    const palette = centers.map(c => rgbToHex(c[0], c[1], c[2]));

    // 5. Create Grid
    const grid: number[][] = [];
    let idx = 0;

    for (let y = 0; y < height; y++) {
        const row: number[] = [];
        for (let x = 0; x < width; x++) {
            if (transparentMask[idx]) {
                row.push(-1); // Transparent/ignored
            } else {
                const r = pixels[idx * 4];
                const g = pixels[idx * 4 + 1];
                const b = pixels[idx * 4 + 2];

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
            }
            idx++;
        }
        grid.push(row);
    }

    return { palette, grid };
}
