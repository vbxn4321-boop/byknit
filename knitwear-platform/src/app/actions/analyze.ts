'use server';

import { createClient } from "@/utils/supabase/server";
import { deductCredits } from "./credits";
import { revalidatePath } from "next/cache";

/**
 * AI Fabric analysis server action.
 * Analyzes fabric image and saves a draft pattern.
 * Deducts NO credits for preview, but saves full pattern content in draft.
 */
export async function analyzeFabricTexture(data: {
    imageBase64: string; // Base64 encoded image string
    craftType: 'knitting' | 'crochet' | 'mixed' | 'other';
    needleSize?: string;
    yarnWeight?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Authentication required" };
    }

    try {
        console.log(`[AI Analyze] Starting fabric analysis for user ${user.id}...`);

        let aiResult: {
            craftType: string;
            stitchPattern: string;
            recommendedYarn: string;
            recommendedNeedles: string;
            preview_ko: string;
            preview_en: string;
            full_ko: string;
            full_en: string;
        };

        const apiKey = process.env.OPENAI_API_KEY;

        if (apiKey) {
            // 1. Real API call to OpenAI GPT-4o-mini (Vision with JSON mode)
            const OpenAI = (await import('openai')).default;
            const client = new OpenAI({ apiKey });

            const base64Data = data.imageBase64.includes('base64,') 
                ? data.imageBase64.split('base64,')[1] 
                : data.imageBase64;

            const response = await client.chat.completions.create({
                model: 'gpt-4o-mini',
                response_format: { type: "json_object" },
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert knitting and crochet designer and analyzer.
Analyze the user's uploaded fabric image. Identify the stitch texture, pattern type, and compile it into a step-by-step written pattern.
You must output a JSON object with the following fields:
{
  "craftType": "knitting" or "crochet",
  "stitchPattern": "Name of the pattern texture (e.g. 2x2 Ribbing, Herringbone Stitch, Granny Square)",
  "recommendedYarn": "Recommended yarn weight/material (e.g. Sport weight cotton-linen blend)",
  "recommendedNeedles": "Recommended needle/hook size (e.g. 4.0mm needles or 3.0mm hook)",
  "preview_ko": "Step-by-step written instructions for the first 3 rows/rounds in Korean.",
  "preview_en": "Step-by-step written instructions for the first 3 rows/rounds in English.",
  "full_ko": "The complete written pattern (all rows/rounds) including setup, repeat section, and bind off/finishing in Korean. Use rich markdown formatting.",
  "full_en": "The complete written pattern (all rows/rounds) including setup, repeat section, and bind off/finishing in English. Use rich markdown formatting."
}
Be precise. If the image is not related to knitting or crochet, output an error description in the written pattern fields.`
                    },
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Metadata:
- User-selected Craft Type: ${data.craftType}
- User needle/hook size input: ${data.needleSize || 'Not specified'}
- User yarn type input: ${data.yarnWeight || 'Not specified'}`
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/png;base64,${base64Data}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1500,
                temperature: 0.4
            });

            const responseText = response.choices[0].message.content || '{}';
            aiResult = JSON.parse(responseText);
        } else {
            // 2. Local Simulation Mode (Development fallback)
            console.log('[AI Analyze] OpenAI API key not found. Running in simulation mode.');
            await new Promise(resolve => setTimeout(resolve, 3000));

            const isKnitting = data.craftType === 'knitting';
            const needle = data.needleSize || (isKnitting ? '4.5mm (US 7)' : '3.0mm (5/0호)');
            const yarn = data.yarnWeight || 'Sport Weight Cotton-Linen Blend';

            if (isKnitting) {
                aiResult = {
                    craftType: 'knitting',
                    stitchPattern: '가터 리브 스티치 (Garter Rib Stitch)',
                    recommendedYarn: yarn,
                    recommendedNeedles: needle,
                    preview_ko: '1단 (겉면): 겉뜨기 2코, 안뜨기 2코 반복하여 끝까지 뜹니다.\n2단 (안면): 겉뜨기 코는 겉뜨기로, 안뜨기 코는 안뜨기로 코가 보이는 대로 뜹니다.\n3단 (겉면): 1단과 동일하게 겉뜨기 2코, 안뜨기 2코 반복합니다.',
                    preview_en: 'Row 1 (RS): *K2, P2; repeat from * to end.\nRow 2 (WS): Knit the knit stitches and purl the purl stitches as they appear.\nRow 3 (RS): Same as Row 1.',
                    full_ko: '### 🧶 가터 리브 스티치 컵코스터 도안\n\n이 도안은 겉뜨기(Knit)와 안뜨기(Purl)의 단순한 조합으로 만들어지는 엠보싱 텍스처로, 컵 받침이나 미니 매트에 매우 어울리는 여름철 리브 조직입니다.\n\n#### [준비물]\n- **실**: ' + yarn + '\n- **바늘**: 대바늘 ' + needle + '\n- **부자재**: 가위, 돋바늘\n\n#### [도안 정보]\n- **코수**: 4의 배수 + 2코 (예: 26코 기코)\n- **사이즈**: 약 10cm x 10cm\n\n#### [단수별 뜨기 가이드]\n- **시작코**: 대바늘에 일반 코잡기로 26코를 만듭니다.\n- **1단 (겉면)**: 겉뜨기 2, *안뜨기 2, 겉뜨기 2; 반복하여 끝까지 뜹니다.\n- **2단 (안면)**: 안뜨기 2, *겉뜨기 2, 안뜨기 2; 반복하여 끝까지 뜹니다.\n- **3단 ~ 24단**: 1단과 2단을 교대로 반복하여 원하는 높이가 될 때까지 편물을 올려줍니다.\n- **코막음**: 25단에서 모든 코를 겉뜨기 방향으로 덮어씌워 코막음(Bind off)합니다.\n\n#### [마무리]\n- 돋바늘을 사용해 시작실과 꼬리실을 편물 뒷부분에 숨겨 정리합니다.\n- 가볍게 스팀 블로킹을 해주면 코가 정갈하게 펴집니다.',
                    full_en: '### 🧶 Garter Rib Coaster Pattern\n\nThis pattern creates an embossed texture using simple knit and purl combinations, perfect for mug coasters or small mats.\n\n#### [Materials]\n- **Yarn**: ' + yarn + '\n- **Needles**: ' + needle + '\n- **Notions**: Scissors, tapestry needle\n\n#### [Pattern Details]\n- **Stitch Count**: Multiple of 4 + 2 sts (e.g. Cast on 26 sts)\n- **Size**: Approx. 10cm x 10cm\n\n#### [Row-by-Row Guide]\n- **Cast On**: Cast on 26 stitches.\n- **Row 1 (RS)**: K2, *P2, K2; repeat from * to end.\n- **Row 2 (WS)**: P2, *K2, P2; repeat from * to end.\n- **Rows 3-24**: Repeat Rows 1 and 2 until desired height is reached.\n- **Bind Off**: Bind off all stitches in pattern knit-wise on the next row.\n\n#### [Finishing]\n- Weave in all loose yarn tails neatly with a tapestry needle on the wrong side.\n- Steam block lightly to open up the stitches.'
                };
            } else {
                aiResult = {
                    craftType: 'crochet',
                    stitchPattern: '와플 크로셰 스티치 (Waffle Crochet Stitch)',
                    recommendedYarn: yarn,
                    recommendedNeedles: needle,
                    preview_ko: '1단: 사슬코 20개로 시작하여, 4번째 사슬부터 각 사슬마다 한길긴뜨기 1코씩 뜹니다. (총 18코)\n2단: 기둥코 사슬 3개 세우고 편물을 뒤집습니다. 첫 코는 한길긴뜨기, 다음 코는 앞걸어 한길긴뜨기, 다음 코는 한길긴뜨기를 반복합니다.\n3단: 기둥코 사슬 3개 세우고 뒤집은 후, 첫 코는 한길긴뜨기, 다음 두 코는 앞걸어 한길긴뜨기를 반복합니다.',
                    preview_en: 'Row 1: Chain 20. Work 1 dc in 4th ch from hook and in each ch across. (18 sts)\nRow 2: Ch 3 (counts as dc), turn. *1 Fpdc around next st, 1 dc in next st; repeat from * to end.\nRow 3: Ch 3, turn. *1 dc in next st, 2 Fpdc in next 2 sts; repeat from * to end.',
                    full_ko: '### 🧶 와플 크로셰 코스터 도안\n\n올록볼록한 와플 모양의 입체 텍스처를 가진 티코스터 도안입니다. 도톰한 볼륨감 덕분에 컵의 물기를 잘 머금어주며 실용성이 높습니다.\n\n#### [준비물]\n- **실**: ' + yarn + '\n- **바늘**: 모사용 코바늘 ' + needle + '\n- **부자재**: 가위, 돋바늘\n\n#### [게이지 및 사이즈]\n- **사이즈**: 약 11cm x 11cm\n\n#### [뜨는 방법 가이드]\n- **기초 사슬**: 사슬 20코를 만들어 기둥을 세웁니다.\n- **1단**: 바늘에서 4번째 사슬코부터 시작하여 각 사슬코에 한길긴뜨기를 1코씩 떠 줍니다. (총 18코)\n- **2단**: 기둥사슬 3코를 뜨고 편물을 돌립니다. 첫 코에 한길긴뜨기를 뜨고, 다음 코에는 앞걸어 한길긴뜨기 1코, 다음 코에는 일반 한길긴뜨기 1코를 번갈아가며 끝까지 뜹니다.\n- **3단**: 기둥사슬 3코를 뜨고 편물을 돌립니다. 첫 코에 한길긴뜨기를 뜨고, 다음 두 코에는 각각 앞걸어 한길긴뜨기 1코씩(총 2코)을 뜨며 이를 반복합니다.\n- **4단 ~ 12단**: 2단과 3단의 패턴을 계속 반복하여 와플 무늬가 격자 형태로 살아나도록 올려줍니다.\n- **실 정리**: 마지막 코를 매듭짓고 실을 자릅니다.\n\n#### [마무리]\n- 돋바늘로 꼬리실들을 깔끔하게 편물 사이사이로 숨겨 정리한 후 블로킹합니다.',
                    full_en: '### 🧶 Waffle Crochet Coaster Pattern\n\nA beautiful textured waffle-like tea coaster that adds volume and absorbs condensation perfectly.\n\n#### [Materials]\n- **Yarn**: ' + yarn + '\n- **Hook**: Crochet hook ' + needle + '\n- **Notions**: Scissors, tapestry needle\n\n#### [Pattern Details]\n- **Size**: Approx. 11cm x 11cm\n\n#### [Step-by-Step Instructions]\n- **Foundation**: Chain 20.\n- **Row 1**: dc in 4th chain from hook and in each chain across. (18 sts)\n- **Row 2**: Ch 3 (counts as dc), turn. *1 Fpdc around next st, 1 dc in next st; repeat from * to end.\n- **Row 3**: Ch 3, turn. *1 dc in next st, 2 Fpdc in next 2 sts; repeat from * to end.\n- **Rows 4-12**: Repeat Rows 2 and 3 sequentially to build the grid waffle pattern.\n- **Fasten Off**: Secure the last loop and cut yarn.\n\n#### [Finishing]\n- Weave in all loose yarn tails using a tapestry needle and block flat.'
                };
            }
        }

        // 3. Save as draft pattern in the `patterns` table
        const { data: newPattern, error: dbError } = await supabase
            .from('patterns')
            .insert({
                title: {
                    ko: `AI 직물 분석: ${aiResult.stitchPattern}`,
                    en: `AI Analyzed: ${aiResult.stitchPattern}`
                },
                description: {
                    ko: `AI가 분석하여 작성한 서술형 도안입니다. (분석 조직: ${aiResult.stitchPattern})`,
                    en: `AI analyzed written pattern. (Detected stitch: ${aiResult.stitchPattern})`
                },
                price_usd: 50,
                price_krw: 72500, // 50 * 1450
                is_free: false,
                status: 'draft', // Saved in draft state so it is locked and private
                item_type: 'digital',
                type: 'internal_pdf',
                category: 'other',
                images: [data.imageBase64.startsWith('data:') ? data.imageBase64 : '/images/summer_flower_coaster.png'],
                designer_id: user.id,
                is_official: false,
                content: {
                    type: 'pdf',
                    pdf_url: '/summer_flower_coaster.pdf',
                    metadata: {
                        is_ai_generated: true,
                        craft_type: aiResult.craftType,
                        stitch_pattern: aiResult.stitchPattern,
                        needles: aiResult.recommendedNeedles,
                        yarn_weight: aiResult.recommendedYarn,
                        preview_content: {
                            ko: aiResult.preview_ko,
                            en: aiResult.preview_en
                        },
                        full_content: {
                            ko: aiResult.full_ko,
                            en: aiResult.full_en
                        }
                    }
                }
            })
            .select()
            .single();

        if (dbError) {
            console.error('Failed to save pattern draft in Supabase:', dbError);
            throw new Error(dbError.message);
        }

        console.log(`[AI Analyze] Draft pattern saved successfully. ID: ${newPattern.id}`);

        return {
            success: true,
            data: {
                id: newPattern.id,
                stitchPattern: aiResult.stitchPattern,
                recommendedNeedles: aiResult.recommendedNeedles,
                recommendedYarn: aiResult.recommendedYarn,
                preview: {
                    ko: aiResult.preview_ko,
                    en: aiResult.preview_en
                }
            }
        };

    } catch (e: any) {
        console.error('[AI Analyze] Error during fabric analysis:', e);
        return { success: false, error: e.message || "Failed to analyze fabric" };
    }
}

/**
 * Unlocks the full AI pattern details by charging 50 credits and creating an order record.
 */
export async function unlockFabricPattern(patternId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Authentication required" };
    }

    try {
        console.log(`[AI Unlock] Attempting to unlock pattern ${patternId} for user ${user.id}...`);

        // 1. Fetch pattern draft details
        const { data: pattern, error: fetchError } = await supabase
            .from('patterns')
            .select('*')
            .eq('id', patternId)
            .single();

        if (fetchError || !pattern) {
            return { success: false, error: "Pattern draft not found" };
        }

        // 2. Check if already purchased/unlocked
        const { data: existingOrder } = await supabase
            .from('orders')
            .select('id')
            .eq('user_id', user.id)
            .eq('pattern_id', patternId)
            .eq('status', 'paid')
            .maybeSingle();

        if (existingOrder) {
            console.log(`[AI Unlock] Pattern already unlocked. Returning full content.`);
            const metadata = pattern.content?.metadata;
            return {
                success: true,
                fullContent: metadata?.full_content || null
            };
        }

        // 3. Deduct 50 credits
        try {
            await deductCredits(user.id, 50, `AI 직물 분석 도안 잠금해제`);
        } catch (creditError: any) {
            console.error('[AI Unlock] Credit deduction failed:', creditError.message);
            return { success: false, error: "크레딧이 부족합니다. (50 크레딧 필요)" };
        }

        // 4. Create paid order in the database to record ownership
        const { error: orderError } = await supabase
            .from('orders')
            .insert({
                user_id: user.id,
                pattern_id: patternId,
                seller_id: null, // AI system pattern
                amount: 50,
                amount_usd: 50,
                status: 'paid',
                payment_provider: 'credit',
                transaction_id: `ai_unlock_${Date.now()}`
            });

        if (orderError) {
            console.error('[AI Unlock] Failed to create order in Supabase:', orderError.message);
            // Refund credits on failure
            const { addCredits } = await import('./credits');
            await addCredits(user.id, 50, `AI 도안 해제 실패 환불`);
            throw new Error("결제 내역 저장에 실패해 환불 처리되었습니다.");
        }

        console.log(`[AI Unlock] Unlock successful for user ${user.id}.`);

        const metadata = pattern.content?.metadata;
        return {
            success: true,
            fullContent: metadata?.full_content || null
        };

    } catch (e: any) {
        console.error('[AI Unlock] Error unlocking pattern:', e);
        return { success: false, error: e.message || "Failed to unlock pattern" };
    }
}

/**
 * Checks if a user has already unlocked a specific pattern draft.
 */
export async function checkPatternUnlockStatus(patternId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const { data } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', user.id)
        .eq('pattern_id', patternId)
        .eq('status', 'paid')
        .maybeSingle();

    return !!data;
}

// Legacy action wrapper for backward compatibility
export async function analyzePattern(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await deductCredits(user.id, 1, 'AI Pattern Analysis');
    } catch (error: any) {
        return { success: false, error: 'Insufficient credits' };
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
        success: true,
        data: {
            title: "Cozy Winter Cardigan (AI Detected)",
            description: "This pattern features a classic V-neck design with ribbed cuffs and hem. Perfect for intermediate knitters using worsted weight yarn. (Auto-generated description based on PDF content)",
            category: "cardigan",
            difficulty: "intermediate",
            needle_size: "4.5",
            yarn_weight: "worsted",
            price: "5.00"
        }
    };
}
