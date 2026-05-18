import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const USERNAME = process.env.RAVELRY_USERNAME;
const PASSWORD = process.env.RAVELRY_PASSWORD;

if (!USERNAME || !PASSWORD) {
    console.error('Error: RAVELRY_USERNAME and RAVELRY_PASSWORD must be set in .env file.');
    process.exit(1);
}

// Interfaces to match Ravelry API response chunks
interface RavelryPatternSummary {
    id: number;
    name: string;
    permalink: string;
    first_photo?: {
        medium_url: string; // or other sizes
        x_offset: number;
        y_offset: number;
    };
    designer?: {
        name: string;
    };
    free: boolean;
}

interface Pattern {
    id: string;
    creator_id: string;
    title: { en: string; ko: string };
    description: { en: string; ko: string };
    thumbnail_url: string;
    category: string;
    difficulty: string;
    yarn_weight: string[];
    needle_size_mm: number[];
    techniques: string[];
    is_free: boolean;
    preview_images: string[];
    download_count: number;
    view_count: number;
    status: string;
    is_ai_generated: boolean;
    created_at: string;
    updated_at: string;
    pdf_url: string;
    price_usd?: number; // Add optional price field for TS compatibility if needed
}

const BASE_URL = 'https://api.ravelry.com';

// Basic Auth Header
const authHeader = 'Basic ' + Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

async function fetchRavelryData() {
    console.log('Starting Ravelry import (Target: 1000 patterns)...');
    let allPatterns: Pattern[] = [];
    const TARGET_COUNT = 1000;
    const PAGE_SIZE = 100;
    let page = 1;

    try {
        while (allPatterns.length < TARGET_COUNT) {
            console.log(`\nFetching page ${page}...`);
            const searchUrl = `${BASE_URL}/patterns/search.json`;
            const params = {
                query: '',
                craft: 'knitting',
                photo: 'yes',
                sort: 'best',
                page: page,
                page_size: PAGE_SIZE,
            };

            const searchRes = await axios.get(searchUrl, {
                params,
                headers: { 'Authorization': authHeader }
            });

            const summaries: RavelryPatternSummary[] = searchRes.data.patterns;

            if (!summaries || summaries.length === 0) {
                console.log('No more patterns found on Ravelry.');
                break;
            }

            console.log(`Page ${page}: Found ${summaries.length} candidates.`);

            // Fetch details in small concurrent batches
            const BATCH_SIZE = 5;
            for (let i = 0; i < summaries.length; i += BATCH_SIZE) {
                const chunk = summaries.slice(i, i + BATCH_SIZE);

                await Promise.all(chunk.map(async (summary) => {
                    try {
                        // Skip if we already have enough
                        if (allPatterns.length >= TARGET_COUNT) return;

                        const detailUrl = `${BASE_URL}/patterns/${summary.id}.json`;
                        const detailRes = await axios.get(detailUrl, {
                            headers: { 'Authorization': authHeader }
                        });

                        const p = detailRes.data.pattern;

                        // Basic mapping
                        // Category mapping logic
                        let cat = 'sweater';
                        const typeName = p.pattern_categories?.[0]?.name?.toLowerCase() || '';
                        const parentName = p.pattern_categories?.[0]?.parent?.name?.toLowerCase() || '';

                        if (typeName.includes('hat') || parentName.includes('hat')) cat = 'hat';
                        else if (typeName.includes('cardigan') || parentName.includes('cardigan')) cat = 'cardigan';
                        else if (typeName.includes('scarf') || parentName.includes('scarf')) cat = 'scarf';
                        else if (typeName.includes('sock') || parentName.includes('sock')) cat = 'socks';
                        else if (typeName.includes('mitten') || parentName.includes('mitten')) cat = 'mittens';
                        else if (typeName.includes('blanket') || parentName.includes('blanket')) cat = 'blanket';

                        let diff = 'intermediate';
                        if (p.difficulty_average < 3) diff = 'beginner';
                        else if (p.difficulty_average > 6) diff = 'advanced';

                        const patternObj: Pattern = {
                            id: `rav_${p.id}`,
                            creator_id: `rav_user_${p.user_id || 'unknown'}`,
                            title: {
                                en: p.name,
                                ko: p.name
                            },
                            description: {
                                en: p.notes_html ? p.notes_html.replace(/<[^>]*>/g, '').substring(0, 300) + '...' : 'No description available.',
                                ko: '상세 내용은 Ravelry 원본 페이지를 확인하세요.'
                            },
                            thumbnail_url: p.photos?.[0]?.medium_url || p.photos?.[0]?.url || '',
                            category: cat,
                            difficulty: diff,
                            yarn_weight: p.pack_yarns?.[0]?.yarn_weight?.name ? [p.pack_yarns[0].yarn_weight.name.toLowerCase()] : ['worsted'],
                            needle_size_mm: p.pattern_needle_sizes?.map((n: any) => n.metric) || [5.0],
                            techniques: ['knitting'],
                            is_free: p.free,
                            price_usd: p.free ? 0 : (p.price || 5.99),
                            preview_images: p.photos?.slice(1, 4).map((ph: any) => ph.medium_url || ph.url) || [],
                            download_count: p.projects_count || 0,
                            view_count: p.comments_count * 10 || 0,
                            status: 'published',
                            is_ai_generated: false,
                            created_at: p.created_at || new Date().toISOString(),
                            updated_at: p.updated_at || new Date().toISOString(),
                            pdf_url: p.download_location?.url || `https://www.ravelry.com/patterns/library/${p.permalink}`
                        };

                        allPatterns.push(patternObj);
                        process.stdout.write('.');

                    } catch (err) {
                        // Ignore individual failures
                    }
                }));

                if (allPatterns.length >= TARGET_COUNT) break;
            }

            if (allPatterns.length >= TARGET_COUNT) break;
            page++;
        }

        console.log('\nWriting data...');
        const outputPath = path.join(process.cwd(), 'src/data/ravelry_patterns.json');
        fs.writeFileSync(outputPath, JSON.stringify(allPatterns, null, 2));
        console.log(`Successfully saved ${allPatterns.length} Ravelry patterns to ${outputPath}`);

    } catch (error) {
        console.error('Fatal API Error:', error);
    }
}

fetchRavelryData();
