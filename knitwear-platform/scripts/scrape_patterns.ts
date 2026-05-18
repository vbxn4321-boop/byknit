import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

interface Pattern {
    id: string;
    title: { en: string; ko: string };
    description: { en: string; ko: string }; // We'll use a generic KO description or translate later
    thumbnail_url: string;
    category: string;
    difficulty: string; // 'beginner', 'intermediate', 'advanced'
    yarn_weight: string[];
    needle_size_mm: number[];
    techniques: string[];
    is_free: boolean;
    preview_images: string[];
    // ... other fields can be mocked or generic
}

const BASE_URL = 'https://freevintageknitting.com';
const CATEGORY_URLS = [
    '/women-knitting-patterns',
    '/hats.html',
    '/mittens.html',
    '/baby.html',
    '/afghans.html',
    '/spool-knitting.html'
];

async function scrape() {
    console.log('Starting scrape...');
    const patterns: Pattern[] = [];
    const visitedLinks = new Set<string>();

    try {
        // 1. Find valid category pages
        const validCategoryUrls: string[] = [];
        for (const url of CATEGORY_URLS) {
            try {
                // Check if accessible
                await axios.get(BASE_URL + url);
                validCategoryUrls.push(BASE_URL + url);
            } catch (e) {
                console.log(`Failed to access ${BASE_URL}${url}`);
            }
        }

        console.log(`Found ${validCategoryUrls.length} valid categories.`);

        // 2. Get Pattern Links from ALL valid categories
        const patternLinks: string[] = [];
        for (const catUrl of validCategoryUrls) {
            try {
                const { data: catData } = await axios.get(catUrl);
                const $cat = cheerio.load(catData);
                $cat('a').each((_, el) => {
                    const href = $cat(el).attr('href');
                    const text = $cat(el).text();
                    if (href && (href.includes('pattern') || href.includes('.html')) && text.length > 5) {
                        const fullUrl = href.startsWith('http') ? href : BASE_URL + href;
                        if (!visitedLinks.has(fullUrl) && !fullUrl.includes('category')) {
                            patternLinks.push(fullUrl);
                            visitedLinks.add(fullUrl);
                        }
                    }
                });
            } catch (e) { console.error(e) }
        }

        console.log(`Found ${patternLinks.length} potential pattern links. Parsing max 30...`);

        // 3. Scrape individual patterns
        let count = 0;
        for (const link of patternLinks) {
            if (count >= 30) break; // Limit to 30

            try {
                console.log(`Scraping ${link}...`);
                const { data: pData } = await axios.get(link);
                const $p = cheerio.load(pData);

                // Extract Data (Selectors need to be robust)
                const title = $p('h1').first().text().trim() || $p('title').text().split('|')[0].trim();
                const contentText = $p('body').text(); // robust check

                // Heuristic: Is this a pattern page?
                const isPattern = contentText.includes('Materials') || contentText.includes('Cast on') || contentText.includes('Gauge') || contentText.includes('Row 1');
                if (!isPattern) {
                    console.log(`Skipping: ${title} does not look like a pattern page (missing keywords).`);
                    continue;
                }

                // Image selector: Find first image in content that is NOT the logo
                let imgRel = '';
                $p('img').each((i, el) => {
                    const src = $p(el).attr('src');
                    if (src && !src.includes('cathead') && !src.includes('logo') && (src.includes('files') || src.includes('images'))) {
                        imgRel = src;
                        return false; // break
                    }
                });

                if (!imgRel) {
                    console.log('Skipping: No valid pattern image found.');
                    continue;
                }

                const thumbnail_url = imgRel.startsWith('http') ? imgRel : BASE_URL + (imgRel.startsWith('/') ? '' : '/') + imgRel;
                // Get first paragraph of content area (often description)
                const description = $p('.content p, .node-content p').first().text().trim().substring(0, 200) + '...';

                // Basic mock/default data for required fields
                const pattern: any = {
                    id: `vintage_${Date.now()}_${count}`,
                    creator_id: 'vintage_archive',
                    title: { en: title, ko: title + ' (빈티지)' },
                    description: { en: description, ko: '이것은 고전적인 빈티지 니트 패턴입니다. 상세 내용은 원문을 참조하세요.' },
                    thumbnail_url: thumbnail_url,
                    category: title.toLowerCase().includes('hat') ? 'hat' : 'sweater',
                    difficulty: 'intermediate',
                    yarn_weight: ['worsted'],
                    needle_size_mm: [4.0, 5.0],
                    techniques: ['knitting'],
                    is_free: true,
                    preview_images: [],
                    download_count: Math.floor(Math.random() * 5000),
                    view_count: Math.floor(Math.random() * 20000),
                    status: 'published',
                    is_ai_generated: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    // Add URL to description or as a new field if Pattern type supports it
                    pdf_url: link
                };

                patterns.push(pattern);
                count++;

                // Be polite
                await new Promise(r => setTimeout(r, 1000));

            } catch (err) {
                console.error(`Error scraping ${link}:`, err);
            }
        }

        // 4. Save to JSON
        const outputPath = path.join(process.cwd(), 'src/data/vintage_patterns.json');
        // Ensure dir exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(outputPath, JSON.stringify(patterns, null, 2));
        console.log(`Saved ${patterns.length} patterns to ${outputPath}`);

    } catch (error) {
        console.error('Fatal Scrape Error:', error);
    }
}

scrape();
