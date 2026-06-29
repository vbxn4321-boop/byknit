import { jsPDF } from 'jspdf';
import { Pattern, Profile } from '@/types';

interface PDFGeneratorOptions {
    pattern: Pattern;
    designerProfile: Profile | null;
    user: any | null; // Supabase user object
    targetLocale: string;
}

export class PatternPDFGenerator {
    private doc: jsPDF;
    private pattern: Pattern;
    private designerProfile: Profile | null;
    private user: any | null;
    private locale: string;
    private isTargetKo: boolean;
    private margin: number;

    constructor(options: PDFGeneratorOptions) {
        this.pattern = options.pattern;
        this.designerProfile = options.designerProfile;
        this.user = options.user;
        this.locale = options.targetLocale;
        this.isTargetKo = options.targetLocale === 'ko';

        // 1. Initialize in Portrait (A4) for Cover & Description
        this.doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        this.margin = 15;
    }

    public async generate(): Promise<void> {
        const { doc, pattern, margin, isTargetKo } = this;
        const pageWidth = doc.internal.pageSize.getWidth();

        // Dynamic Taxonomy for correct translations
        const { CATEGORY_TAXONOMY } = await import('@/constants/taxonomy');

        // --- Content Preparation ---
        let targetTitle = this.getTranslatedContent('title');
        const descObj = pattern.description as any;
        // Use correct locale for detailed description
        let targetDescription = isTargetKo
            ? (descObj?.detailed_ko || descObj?.ko || this.getTranslatedContent('description'))
            : (descObj?.detailed_en || descObj?.en || this.getTranslatedContent('description'));

        // ON-THE-FLY TRANSLATION IF MISSING
        const containsKorean = (text: string) => /[\uac00-\ud7a3]/.test(text);

        if (isTargetKo) {
            const { translateText } = await import('@/app/actions/translate');
            if (!containsKorean(targetTitle)) {
                targetTitle = await translateText(targetTitle, 'ko');
            }
            if (targetDescription && !containsKorean(targetDescription)) {
                targetDescription = await translateText(targetDescription, 'ko');
            }
        } else {
            const { translateText } = await import('@/app/actions/translate');
            if (containsKorean(targetTitle)) {
                targetTitle = await translateText(targetTitle, 'en');
            }
            if (targetDescription && containsKorean(targetDescription)) {
                targetDescription = await translateText(targetDescription, 'en');
            }
        }

        // --- 1. Cover Page (Portrait) ---
        // Header Banner
        doc.setFillColor(242, 238, 230); // cream-100
        doc.rect(0, 0, pageWidth, 35, 'F');

        // Title
        await this.drawTranslatedText(targetTitle, margin, 12, 20, '#543e35');

        // Date
        const dateStr = new Date().toLocaleDateString(isTargetKo ? 'ko-KR' : 'en-US');
        const generatedByStr = isTargetKo ? `생성일: ${dateStr}` : `Generated on ${dateStr}`;
        await this.drawTranslatedText(generatedByStr, margin, 28, 9, '#8a7366');

        let currentY = 40;

        // Image Gallery (Portrait Optimized)
        currentY = await this.drawImageGallery(currentY, pageWidth);

        // Pattern Info
        await this.drawTranslatedText(isTargetKo ? '도안 상세 정보' : 'Pattern Details', margin, currentY, 14, '#543e35');
        currentY += 8;
        doc.setDrawColor(224, 212, 196);
        doc.line(margin, currentY, margin + 35, currentY);
        currentY += 8;

        // Map Category/Subcategory Labels from database column or content.metadata fallback
        const metadata = (pattern.content as any)?.metadata || {};
        
        const categoryData = CATEGORY_TAXONOMY[pattern.category as keyof typeof CATEGORY_TAXONOMY];
        const displayCategory = categoryData ? (isTargetKo ? categoryData.label.ko : categoryData.label.en) : (pattern.category || '-');
        
        const subcat = pattern.subcategory || metadata.subcategory;
        const displaySubcategory = categoryData?.sub?.find((s: any) => s.id === subcat)?.label[isTargetKo ? 'ko' : 'en'] || subcat || '-';

        const yarnWt = pattern.yarn_weight || metadata.yarn_weight;
        const needlesVal = pattern.needles || metadata.needles;
        const gaugeVal = pattern.gauge || metadata.gauge || (metadata.yarnParts?.[0]?.gauge); // Fallback to first yarn part gauge if main is empty
        const sizesVal = pattern.sizes || metadata.sizes;
        const measurementsVal = pattern.measurements || metadata.measurements;

        // Needle size formatting: if it already contains 'mm', don't append it again
        const formatNeedle = (val: any) => {
            if (!val) return '-';
            const str = String(val);
            if (str.toLowerCase().includes('mm')) return str;
            return `${str} mm`;
        };

        const details = [
            { label: isTargetKo ? '카테고리' : 'Category', value: displayCategory },
            { label: isTargetKo ? '세부카테고리' : 'Subcategory', value: displaySubcategory },
            { label: isTargetKo ? '난이도' : 'Difficulty', value: isTargetKo ? (pattern.difficulty === 'beginner' ? '초보자' : pattern.difficulty === 'intermediate' ? '중급자' : '상급자') : (pattern.difficulty ? (pattern.difficulty.charAt(0).toUpperCase() + pattern.difficulty.slice(1)) : '-') },
            { label: isTargetKo ? '실 무게' : 'Yarn Weight', value: Array.isArray(yarnWt) ? yarnWt.join(', ') : (yarnWt || '-') },
            { label: isTargetKo ? '바늘 크기' : 'Needle Size', value: formatNeedle(needlesVal) },
            { label: isTargetKo ? '게이지' : 'Gauge', value: (pattern.gauge_stitches && pattern.gauge_rows) ? (isTargetKo ? `${pattern.gauge_stitches}코 ${pattern.gauge_rows}단` : `${pattern.gauge_stitches} sts x ${pattern.gauge_rows} rows`) : (gaugeVal || (pattern.gauge_stitches ? `${pattern.gauge_stitches} sts / 10cm` : (isTargetKo ? '기재되지 않음' : 'Not specified'))) },
            { label: isTargetKo ? '사이즈' : 'Sizes', value: sizesVal ? (isTargetKo ? (sizesVal.ko || sizesVal.en) : (sizesVal.en || sizesVal.ko)) : '-' },
            { label: isTargetKo ? '실측' : 'Measurements', value: measurementsVal ? (isTargetKo ? (measurementsVal.ko || measurementsVal.en) : (measurementsVal.en || measurementsVal.ko)) : '-' },
        ];

        for (const item of details) {
            await this.drawTranslatedText(`${item.label}:`, margin, currentY, 10, '#8a7366');
            await this.drawTranslatedText(String(item.value), margin + 40, currentY, 10, '#543e35'); // Reduced gap for portrait
            currentY += 8;
        }

        // Description
        currentY += 8;
        await this.drawTranslatedText(isTargetKo ? '상세 설명' : 'Detailed Description', margin, currentY, 14, '#543e35');
        currentY += 12;

        if (targetDescription) {
            const contentWidth = pageWidth - (margin * 2);
            await this.drawTranslatedText(targetDescription, margin, currentY, 10, '#666666', contentWidth);
        } else {
            await this.drawTranslatedText(isTargetKo ? '상세 설명이 없습니다.' : 'No detailed description available.', margin, currentY, 10, '#999999');
        }

        // --- 2. Grid Chart Pages (Landscape) ---
        if (pattern.grid_data && pattern.palette && pattern.grid_width && pattern.grid_height) {
            await this.drawGridCharts(targetTitle);
        }

        // --- Apply Watermark & Footer to ALL Pages ---
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            this.drawFooter();
            this.drawWatermark();
        }

        // Save
        const filename = `${targetTitle.replace(/[^a-z0-9가-힣]/gi, '_').toLowerCase()}.pdf`;
        doc.save(filename);
    }

    private async drawImageGallery(startY: number, pageWidth: number): Promise<number> {
        // Portrait Layout Calculation
        // Approx width available: 210 - 30 = 180mm
        const mainImgWidth = 80;
        const mainImgHeight = 60;
        const subImgSize = 25;
        const subGap = 2;

        // Ensure everything fits centered
        const subBlockWidth = (subImgSize * 3) + (subGap * 2);
        const totalGalleryWidth = mainImgWidth + 8 + subBlockWidth; // approx 80 + 8 + 79 = 167mm (< 180mm OK)

        const galleryStartX = (pageWidth - totalGalleryWidth) / 2;
        const subStartX = galleryStartX + mainImgWidth + 8;

        const allImages = [this.pattern.thumbnail_url, ...(this.pattern.preview_images || [])].filter(Boolean);

        // Main Image
        if (allImages[0]) {
            await this.drawImage(allImages[0] as string, galleryStartX, startY, mainImgWidth, mainImgHeight, true);
        }

        // Sub Images
        for (let i = 1; i <= 5; i++) {
            if (allImages[i]) {
                const col = (i - 1) % 3;
                const row = Math.floor((i - 1) / 3);
                const x = subStartX + col * (subImgSize + subGap);
                const y = startY + row * (subImgSize + subGap);
                await this.drawImage(allImages[i] as string, x, y, subImgSize, subImgSize, false);
            }
        }

        return startY + mainImgHeight + 10;
    }

    private async drawGridCharts(title: string) {
        const { doc, pattern, margin, isTargetKo } = this;
        const gridData = pattern.grid_data!;
        const palette = pattern.palette!;
        const cols = pattern.grid_width!;
        const rows = pattern.grid_height!;

        const lPageWidth = 297; // Landscape A4
        const lPageHeight = 210;
        const CHART_MARGIN = 20;
        const CONTENT_W = lPageWidth - (CHART_MARGIN * 2);
        const CONTENT_H = lPageHeight - (CHART_MARGIN * 2) - 20; // minus header space
        const CELL_SIZE_MM = 4;

        // Symbol Map (Hardcoded for now, ideally passed in pattern)
        const SYMBOL_MAP: Record<string, string> = {
            'knit': 'I', 'purl': '-', 'yarn_over': 'O', 'k2tog': '/', 'ssk': '\\',
            'tbl': 'Ω', 'cable': 'X', 'no_stitch': '■'
        };

        const totalChartWidth = cols * CELL_SIZE_MM;
        const totalChartHeight = rows * CELL_SIZE_MM;
        const tilesX = Math.ceil(totalChartWidth / CONTENT_W);
        const tilesY = Math.ceil(totalChartHeight / CONTENT_H);

        const getSpiralOrder = (totalRows: number, totalCols: number) => {
            const result: { r: number, c: number }[] = [];
            let top = 0, bottom = totalRows - 1, left = 0, right = totalCols - 1;
            let dir = 0;
            while (top <= bottom && left <= right) {
                if (dir === 0) { for (let i = left; i <= right; i++) result.push({ r: top, c: i }); top++; }
                else if (dir === 1) { for (let i = top; i <= bottom; i++) result.push({ r: i, c: right }); right--; }
                else if (dir === 2) { for (let i = right; i >= left; i--) result.push({ r: bottom, c: i }); bottom--; }
                else if (dir === 3) { for (let i = bottom; i >= top; i--) result.push({ r: i, c: left }); left++; }
                dir = (dir + 1) % 4;
            }
            return result;
        };

        const pageOrder = getSpiralOrder(tilesY, tilesX);

        for (const { r: tileRow, c: tileCol } of pageOrder) {
            // Add Landscape Page
            doc.addPage([lPageWidth, lPageHeight], 'landscape');

            const headerText = `${title} - ${isTargetKo ? '행 섹션' : 'Row Section'} ${tileRow + 1}, ${isTargetKo ? '열 섹션' : 'Col Section'} ${tileCol + 1}`;
            await this.drawTranslatedText(headerText, CHART_MARGIN, 12, 10, '#646464');

            const startCol = Math.floor((tileCol * CONTENT_W) / CELL_SIZE_MM);
            const startRow = Math.floor((tileRow * CONTENT_H) / CELL_SIZE_MM);
            const endCol = Math.min(startCol + Math.ceil(CONTENT_W / CELL_SIZE_MM), cols);
            const endRow = Math.min(startRow + Math.ceil(CONTENT_H / CELL_SIZE_MM), rows);

            const chartStartX = CHART_MARGIN;
            const chartStartY = 20;

            for (let r = startRow; r < endRow; r++) {
                for (let c = startCol; c < endCol; c++) {
                    const cellData = gridData[r]?.[c];
                    let color = '#FFFFFF';
                    let symbol: string | null = null;
                    if (typeof cellData === 'number') color = palette[cellData] || '#FFFFFF';
                    else if (typeof cellData === 'object') {
                        if (cellData.color) color = cellData.color;
                        // Handle symbol: It might be a direct character OR an ID
                        if (cellData.symbol) {
                            // Check if it's a known ID, otherwise assume it's a custom char or already resolved
                            symbol = SYMBOL_MAP[cellData.symbol] || cellData.symbol;

                            // Fallback: If symbolId is present but symbol is not
                            if (!symbol && (cellData as any).symbolId) {
                                symbol = SYMBOL_MAP[(cellData as any).symbolId] || (cellData as any).symbolId;
                            }
                        } else if ((cellData as any).symbolId) {
                            symbol = SYMBOL_MAP[(cellData as any).symbolId] || (cellData as any).symbolId;
                        }
                    } else if (typeof cellData === 'string') color = cellData;

                    const rgb = this.hexToRgb(color);
                    doc.setFillColor(rgb.r, rgb.g, rgb.b);
                    doc.setDrawColor(180);
                    doc.rect(
                        chartStartX + (c - startCol) * CELL_SIZE_MM,
                        chartStartY + (r - startRow) * CELL_SIZE_MM,
                        CELL_SIZE_MM, CELL_SIZE_MM, 'FD'
                    );

                    if (symbol) {
                        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
                        const symbolColor = brightness > 128 ? '#000000' : '#FFFFFF';
                        // Use getSymbolImage with explicit color
                        const symImg = this.getSymbolImage(symbol, symbolColor);
                        if (symImg) {
                            const padding = 0.5;
                            doc.addImage(symImg, 'PNG',
                                chartStartX + (c - startCol) * CELL_SIZE_MM + padding,
                                chartStartY + (r - startRow) * CELL_SIZE_MM + padding,
                                CELL_SIZE_MM - 1, CELL_SIZE_MM - 1);
                        }
                    }
                }
            }

            // Rulers
            doc.setFontSize(8);
            doc.setTextColor(100);
            for (let c = startCol; c < endCol; c++) {
                if ((c + 1) % 5 === 0) {
                    const cx = chartStartX + (c - startCol) * CELL_SIZE_MM + (CELL_SIZE_MM / 2);
                    doc.text(`${c + 1}`, cx, chartStartY - 2, { align: 'center' });
                }
            }
            for (let r = startRow; r < endRow; r++) {
                if ((r + 1) % 5 === 0) {
                    const cy = chartStartY + (r - startRow) * CELL_SIZE_MM + (CELL_SIZE_MM / 2) + 1;
                    doc.text(`${r + 1}`, chartStartX - 2, cy, { align: 'right' });
                }
            }
        }

        // Legend Page (Landscape)
        doc.addPage([lPageWidth, lPageHeight], 'landscape');
        let legendY = 20;
        await this.drawTranslatedText(isTargetKo ? '기호 설명' : 'Stitch Legend', CHART_MARGIN, legendY, 14, '#543e35');
        legendY += 15;

        const swatchSize = 8;
        const colsPerRow = 3;
        const colWidth = (lPageWidth - (CHART_MARGIN * 2)) / colsPerRow;

        // Symbol name translations
        const SYMBOL_NAMES: Record<string, { ko: string; en: string }> = {
            'knit': { ko: '겉뜨기', en: 'Knit' },
            'purl': { ko: '안뜨기', en: 'Purl' },
            'yo': { ko: '감아뜨기', en: 'Yarn Over' },
            'yarn_over': { ko: '감아뜨기', en: 'Yarn Over' },
            'k2tog': { ko: '오른코 모아뜨기', en: 'K2tog' },
            'ssk': { ko: '왼코 모아뜨기', en: 'SSK' },
            'tbl': { ko: '뒤코뜨기', en: 'Through Back Loop' },
            'cable': { ko: '꽈배기', en: 'Cable' },
            'no_stitch': { ko: '빈칸', en: 'No Stitch' },
            'chain': { ko: '사슬뜨기', en: 'Chain' },
            'sc': { ko: '짧은뜨기', en: 'Single Crochet' },
            'dc': { ko: '긴뜨기', en: 'Double Crochet' },
            'hdc': { ko: '중긴뜨기', en: 'Half Double Crochet' },
            'tr': { ko: '한길긴뜨기', en: 'Treble Crochet' },
            'slip': { ko: '빼뜨기', en: 'Slip Stitch' }
        };

        // Scan grid for unique symbols
        const symbolsFound = new Map<string, { symbol: string; color: string }>();
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cellData = gridData[r]?.[c];
                if (typeof cellData === 'object' && cellData) {
                    const symbolId = (cellData as any).symbol || (cellData as any).symbolId;
                    if (symbolId && !symbolsFound.has(symbolId)) {
                        symbolsFound.set(symbolId, {
                            symbol: SYMBOL_MAP[symbolId] || symbolId,
                            color: (cellData as any).color || '#FFFFFF'
                        });
                    }
                }
            }
        }

        // 1. Color Palette Section
        await this.drawTranslatedText(isTargetKo ? '색상 팔레트' : 'Color Palette', CHART_MARGIN, legendY, 11, '#543e35');
        legendY += 10;

        for (let i = 0; i < palette.length; i++) {
            const col = i % colsPerRow;
            const row = Math.floor(i / colsPerRow);
            const x = CHART_MARGIN + (col * colWidth);
            const y = legendY + (row * 14);

            const color = palette[i];
            const rgb = this.hexToRgb(color);
            doc.setFillColor(rgb.r, rgb.g, rgb.b);
            doc.setDrawColor(150);
            doc.rect(x, y, swatchSize, swatchSize, 'FD');

            doc.setFontSize(8);
            doc.setTextColor(80);
            const colorCode = palette[i].toUpperCase();
            doc.text(colorCode, x + swatchSize + 2, y + 6);
        }

        legendY += Math.ceil(palette.length / colsPerRow) * 14 + 15;

        // 2. Stitch Symbols Section (if any found)
        if (symbolsFound.size > 0) {
            await this.drawTranslatedText(isTargetKo ? '사용된 기호' : 'Stitch Symbols', CHART_MARGIN, legendY, 11, '#543e35');
            legendY += 10;

            let idx = 0;
            for (const [symbolId, info] of symbolsFound) {
                const col = idx % colsPerRow;
                const row = Math.floor(idx / colsPerRow);
                const x = CHART_MARGIN + (col * colWidth);
                const y = legendY + (row * 14);

                // Draw symbol box
                doc.setFillColor(255, 255, 255);
                doc.setDrawColor(150);
                doc.rect(x, y, swatchSize, swatchSize, 'FD');

                // Draw symbol character
                doc.setFontSize(10);
                doc.setTextColor(0);
                doc.text(info.symbol, x + swatchSize / 2, y + 6, { align: 'center' });

                // Draw symbol name
                const symbolName = SYMBOL_NAMES[symbolId]
                    ? (isTargetKo ? SYMBOL_NAMES[symbolId].ko : SYMBOL_NAMES[symbolId].en)
                    : symbolId;

                // Use renderTextAsImage to handle Korean font support (doc.text fails for formatted Korean)
                await this.renderTextAsImage(symbolName, x + swatchSize + 2, y + 2, 8, '#505050', false);

                idx++;
            }

            legendY += Math.ceil(symbolsFound.size / colsPerRow) * 14 + 10;
        }

        legendY += Math.ceil(palette.length / colsPerRow) * 14 + 20;

        if (legendY > lPageHeight - 60) {
            doc.addPage([lPageWidth, lPageHeight], 'landscape');
            legendY = CHART_MARGIN;
        }

        // Project Info (Legend Page)
        doc.setDrawColor(200);
        doc.line(CHART_MARGIN, legendY, lPageWidth - CHART_MARGIN, legendY);
        legendY += 10;
        await this.drawTranslatedText('Project Info', CHART_MARGIN, legendY, 12, '#574236');
        legendY += 10;
        await this.drawTranslatedText(`Title: ${title}`, CHART_MARGIN, legendY, 10, '#333');
        await this.drawTranslatedText(`Grid Size: ${cols} x ${rows}`, CHART_MARGIN + 80, legendY, 10, '#333');
        legendY += 8;
        await this.drawTranslatedText(`Date: ${new Date().toLocaleDateString()}`, CHART_MARGIN, legendY, 10, '#333');
    }

    private drawFooter() {
        const { doc, designerProfile, margin } = this;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const creatorName = designerProfile?.username || designerProfile?.display_name || 'Unknown Creator';
        const year = new Date().getFullYear();

        const bottomY = pageHeight - 15;

        // Footer Text
        const leftText = `Original Design © ${year} ${creatorName}`;
        this.renderTextAsImage(leftText, margin, bottomY, 10, '#000000', true);

        const rightText = "Pattern layout powered by byKnit Platform";
        this.renderTextAsImage(rightText, pageWidth - margin, bottomY, 8, '#888888', false, 'right');
    }

    private drawWatermark() {
        const { doc, user } = this;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        if (!user || !user.email) return;

        const watermarkText = `Licensed to ${user.email}`;

        // Top and Bottom Placement
        doc.setTextColor(180, 180, 180);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        // Top (Centered)
        doc.text(watermarkText, pageWidth / 2, 5, { align: 'center' });

        // Bottom (Centered)
        doc.text(watermarkText, pageWidth / 2, pageHeight - 5, { align: 'center' });

        // Left (Centered Vertical, Rotated 90)
        doc.text(watermarkText, 5, pageHeight / 2, { align: 'center', angle: 90 });

        // Right (Centered Vertical, Rotated -90)
        doc.text(watermarkText, pageWidth - 5, pageHeight / 2, { align: 'center', angle: -90 });
    }

    private getTranslatedContent(field: 'title' | 'description'): string {
        const { pattern, isTargetKo } = this;
        const data = pattern[field] as any;
        if (!data) return '';
        if (typeof data === 'string') return data;
        const val = isTargetKo ? (data.ko || '') : (data.en || '');
        if (val) return val;
        return isTargetKo ? (data.en || '') : (data.ko || '');
    }

    private async drawImage(url: string, x: number, y: number, w: number, h: number, contain = true) {
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = reject;
                img.src = url;
            });

            if (contain) {
                const ratio = img.height / img.width;
                let newW = w;
                let newH = w * ratio;
                if (newH > h) {
                    newH = h;
                    newW = h / ratio;
                }
                const offsetX = x + (w - newW) / 2;
                const offsetY = y + (h - newH) / 2;
                this.doc.addImage(img, 'JPEG', offsetX, offsetY, newW, newH);
            } else {
                this.doc.addImage(img, 'JPEG', x, y, w, h);
            }
        } catch (e) {
            console.warn('Image load failed', url);
        }
    }

    private async drawMultilineText(htmlText: string, startX: number, startY: number, fontSize: number, color: string, maxWidth: number): Promise<number> {
        const { doc } = this;
        const pageHeight = doc.internal.pageSize.getHeight();
        const bottomMargin = 20; // Footer margin
        
        let cleanText = htmlText
            .replace(/<p[^>]*>/gi, '')
            .replace(/<\/p>/gi, '\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<li>/gi, '• ')
            .replace(/<\/li>/gi, '\n')
            .replace(/<[^>]+>/g, '') // Strip any remaining HTML tags
            .replace(/&nbsp;/gi, ' ')
            .replace(/&lt;/gi, '<')
            .replace(/&gt;/gi, '>')
            .replace(/&amp;/gi, '&');
            
        // Filter out empty lines to control spacing programmatically
        const paragraphs = cleanText.split('\n').map(p => p.trim()).filter(Boolean);
        let currentY = startY;
        const lineHeight = fontSize * 1.6; // Line height in mm
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return currentY;
        
        const scale = 4;
        
        // Conversion factor from mm to canvas pixels
        const canvasMaxWidth = maxWidth * scale * 3.5;
        
        const isBigHeader = (text: string) => {
            const trimmed = text.trim();
            return /^(?:\d+[\s\.\)]|🔘|✨|⚡|🚀|✦|★|☆|■)/u.test(trimmed) || 
                   trimmed.startsWith('시작 부분') || 
                   trimmed.startsWith('제작 방법') ||
                   trimmed.startsWith('단추 달기') ||
                   trimmed.startsWith('도안 설명');
        };
        
        for (let idx = 0; idx < paragraphs.length; idx++) {
            const para = paragraphs[idx];
            const isHeader = isBigHeader(para);
            
            // Spacing before big headers (except the first one)
            if (isHeader && idx > 0) {
                currentY += lineHeight * 1.8; // 3-4 lines gap before new sections
            }
            
            const fontStr = `${isHeader ? 'bold' : 'normal'} ${fontSize * scale}px "Pretendard", "Noto Sans KR", Arial, sans-serif`;
            ctx.font = fontStr;
            
            // Wrap text
            const lines: string[] = [];
            let currentLine = '';
            
            for (let i = 0; i < para.length; i++) {
                const char = para[i];
                const testLine = currentLine + char;
                const metrics = ctx.measureText(testLine);
                
                if (metrics.width > canvasMaxWidth && currentLine !== '') {
                    lines.push(currentLine);
                    currentLine = char;
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine !== '') {
                lines.push(currentLine);
            }
            
            for (const line of lines) {
                if (currentY + lineHeight > pageHeight - bottomMargin) {
                    doc.addPage();
                    currentY = 25; // Start below watermark
                }
                
                await this.renderTextAsImage(line, startX, currentY, fontSize, color, isHeader, 'left');
                currentY += lineHeight;
            }
            
            // Small spacing after each paragraph (approx 1 line height total when combined with next line)
            currentY += lineHeight * 0.4;
        }
        
        return currentY;
    }

    private async drawTranslatedText(text: string, x: number, y: number, fontSize: number, color: string, maxWidth?: number) {
        if (maxWidth) {
            return this.drawMultilineText(text, x, y, fontSize, color, maxWidth);
        }
        return this.renderTextAsImage(text, x, y, fontSize, color, false, 'left');
    }

    private async renderTextAsImage(text: string, x: number, y: number, fontSize: number, color: string, isBold: boolean, align: 'left' | 'right' | 'center' = 'left', maxWidth?: number) {
        if (!text) return 0;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return 0;

        const scale = 4;
        const fontWeight = isBold ? 'bold' : 'normal';
        // Use standard font stack as fallback
        const fontStr = `${fontWeight} ${fontSize * scale}px "Pretendard", "Noto Sans KR", Arial, sans-serif`;
        ctx.font = fontStr;

        const metrics = ctx.measureText(text);
        const textWidth = metrics.width / (scale * 3.5);

        let drawX = x;
        if (align === 'right') drawX = x - textWidth;
        else if (align === 'center') drawX = x - (textWidth / 2);

        canvas.width = metrics.width + 40;
        canvas.height = (fontSize * scale) * 1.5;

        ctx.font = fontStr;
        ctx.fillStyle = color;
        ctx.textBaseline = 'top';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillText(text, 10, 0);

        const imgData = canvas.toDataURL('image/png');
        const pdfW = canvas.width / (scale * 3.5);
        const pdfH = canvas.height / (scale * 3.5);

        this.doc.addImage(imgData, 'PNG', drawX, y, pdfW, pdfH);
        return (fontSize * 1.5);
    }

    private hexToRgb(hex: string) {
        const clean = hex.replace('#', '');
        const r = parseInt(clean.substring(0, 2), 16) || 0;
        const g = parseInt(clean.substring(2, 4), 16) || 0;
        const b = parseInt(clean.substring(4, 6), 16) || 0;
        return { r, g, b };
    }

    private symbolCache: Record<string, string> = {};
    private getSymbolImage(symbol: string, color: string) {
        const key = `${symbol}_${color}`;
        if (this.symbolCache[key]) return this.symbolCache[key];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';
        const scale = 4;
        const fontSize = 12;
        canvas.width = fontSize * scale;
        canvas.height = fontSize * scale;
        // Simplified generic font
        ctx.font = `bold ${fontSize * scale}px Arial, sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillText(symbol, canvas.width / 2, canvas.height / 2);
        const data = canvas.toDataURL('image/png');
        this.symbolCache[key] = data;
        return data;
    }
}
