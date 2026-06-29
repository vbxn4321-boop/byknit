const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Admin account ID
const adminUserId = '1c5cab92-64d4-4b8f-99cb-c20539ee740f';

// Mathematical Heart Grid Generator (40x40)
function generateHeartGrid() {
    const width = 40;
    const height = 40;
    const grid = [];
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            const dx = (x - 20) / 10;
            const dy = -(y - 16) / 10;
            const inside = Math.pow(dx*dx + dy*dy - 1, 3) - dx*dx * dy*dy*dy <= 0;
            row.push({
                color: inside ? '#e91e63' : '#ffffff',
                symbolId: null
            });
        }
        grid.push(row);
    }
    return { grid, palette: ['#ffffff', '#e91e63'] };
}

// Geometric Pine Tree Grid Generator (40x40)
function generateTreeGrid() {
    const width = 40;
    const height = 40;
    const grid = [];
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            let color = '#faf8f5'; // Cream background
            
            // Trunk
            if (y >= 28 && y <= 36 && x >= 18 && x <= 22) {
                color = '#5d4037'; // Brown
            }
            // Leaf triangle 1 (top)
            else if (y >= 6 && y <= 14 && Math.abs(x - 20) <= (y - 6)) {
                color = '#2e7d32'; // Green
            }
            // Leaf triangle 2 (middle)
            else if (y >= 12 && y <= 22 && Math.abs(x - 20) <= (y - 12) + 2) {
                color = '#2e7d32';
            }
            // Leaf triangle 3 (bottom)
            else if (y >= 18 && y <= 28 && Math.abs(x - 20) <= (y - 18) + 4) {
                color = '#2e7d32';
            }
            
            row.push({
                color: color,
                symbolId: null
            });
        }
        grid.push(row);
    }
    return { grid, palette: ['#faf8f5', '#2e7d32', '#5d4037'] };
}

async function uploadImage(localPath, filename) {
    console.log(`Uploading ${localPath} to storage...`);
    if (!fs.existsSync(localPath)) {
        throw new Error(`File not found: ${localPath}`);
    }
    const fileBuffer = fs.readFileSync(localPath);
    
    const { data, error } = await supabase.storage
        .from('patterns')
        .upload(filename, fileBuffer, {
            contentType: 'image/png',
            upsert: true
        });
        
    if (error) {
        throw error;
    }
    
    const { data: { publicUrl } } = supabase.storage
        .from('patterns')
        .getPublicUrl(filename);
        
    return publicUrl;
}

async function run() {
    try {
        console.log('Starting AI pattern registration...');
        
        // 1. Image upload paths
        const heartImgPath = 'C:/Users/CHA/.gemini/antigravity/brain/04cad5ff-63a7-4f3e-8094-56ee8276196e/pixel_knit_heart_1782458397614.png';
        const treeImgPath = 'C:/Users/CHA/.gemini/antigravity/brain/04cad5ff-63a7-4f3e-8094-56ee8276196e/pixel_knit_tree_1782458409213.png';
        
        const timestamp = Date.now();
        const heartUrl = await uploadImage(heartImgPath, `ai_pattern_heart_${timestamp}.png`);
        const treeUrl = await uploadImage(treeImgPath, `ai_pattern_tree_${timestamp}.png`);
        
        console.log('Uploaded images successfully!');
        console.log('Heart Image URL:', heartUrl);
        console.log('Tree Image URL:', treeUrl);
        
        // 2. Generate Grid Datas
        const heartGrid = generateHeartGrid();
        const treeGrid = generateTreeGrid();
        
        // 3. Register Heart Pattern (Free)
        console.log('Registering Lovely Heart Pattern...');
        const { data: heartPattern, error: heartError } = await supabase
            .from('patterns')
            .insert({
                designer_id: adminUserId,
                title: { ko: 'AI 생성: 러블리 핑크 하트', en: 'AI Generated: Lovely Pink Heart' },
                description: { 
                    ko: 'AI 이미지 분석을 바탕으로 제작한 러블리 대바늘 핑크 하트 배색 패턴입니다. 모자나 장갑 배색으로 강력 추천합니다.', 
                    en: 'AI-generated lovely pink heart colorwork pattern. Great for beanies and mittens.' 
                },
                price_usd: 0,
                price_krw: 0,
                images: [heartUrl],
                category: 'other',
                difficulty: 'beginner',
                craft_type: 'knitting',
                yarn_weight: ['fingering'],
                needles: '3.0mm, 3.5mm',
                gauge: '24코 32단 (10cm)',
                hashtags: ['AI도안', '하트배색', '대바늘초보', 'byKnit공식'],
                is_official: true,
                item_type: 'digital',
                grid_data: heartGrid.grid,
                palette: heartGrid.palette,
                grid_width: 40,
                grid_height: 40,
                status: 'published',
                type: 'internal_pdf',
                content: {
                    type: 'pdf',
                    pdf_url: null,
                    original_filename: 'lovely_heart.pdf',
                    metadata: {
                        craft_type: 'knitting',
                        yarn_weight: 'fingering',
                        needles: '3.0mm, 3.5mm',
                        gauge: '24코 32단',
                        sizes: 'Free',
                        measurements: '40 x 40 stitches'
                    }
                }
            })
            .select()
            .single();
            
        if (heartError) throw heartError;
        console.log('Heart Pattern registered successfully! ID:', heartPattern.id);
        
        // 4. Register Tree Pattern (Paid: 10 credits)
        console.log('Registering Cozy Winter Pine Tree Pattern...');
        const { data: treePattern, error: treeError } = await supabase
            .from('patterns')
            .insert({
                designer_id: adminUserId,
                title: { ko: 'AI 생성: 코지 윈터 트리', en: 'AI Generated: Cozy Winter Tree' },
                description: { 
                    ko: 'AI 이미지 기법으로 구상한 코지 윈터 크리스마스 솔트리 대바늘 도안입니다. 겨울 소품이나 쿠션 커버 배색에 잘 어울립니다.', 
                    en: 'AI-concept winter pine tree colorwork chart. Perfect for Christmas ornaments and cushion covers.' 
                },
                price_usd: 10,
                price_krw: 14500,
                images: [treeUrl],
                category: 'home',
                difficulty: 'intermediate',
                craft_type: 'knitting',
                yarn_weight: ['dk'],
                needles: '4.0mm',
                gauge: '22코 28단 (10cm)',
                hashtags: ['AI도안', '겨울트리', '크리스마스배색', 'byKnit공식'],
                is_official: true,
                item_type: 'digital',
                grid_data: treeGrid.grid,
                palette: treeGrid.palette,
                grid_width: 40,
                grid_height: 40,
                status: 'published',
                type: 'internal_pdf',
                content: {
                    type: 'pdf',
                    pdf_url: null,
                    original_filename: 'cozy_tree.pdf',
                    metadata: {
                        craft_type: 'knitting',
                        yarn_weight: 'dk',
                        needles: '4.0mm',
                        gauge: '22코 28단',
                        sizes: 'Free',
                        measurements: '40 x 40 stitches'
                    }
                }
            })
            .select()
            .single();
            
        if (treeError) throw treeError;
        console.log('Tree Pattern registered successfully! ID:', treePattern.id);
        
        console.log('All AI patterns published successfully!');
        
    } catch (e) {
        console.error('Error executing script:', e);
    }
}

run();
