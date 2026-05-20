'use server';

import { createClient } from '@/utils/supabase/server';

/**
 * Detects if target contains Korean characters
 */
function containsKorean(text: string): boolean {
    return /[\uac00-\ud7a3]/.test(text);
}

/**
 * Translates text using OpenAI API
 * Returns original text if API key not available or on error
 */
export async function translateText(
    text: string,
    targetLang: 'ko' | 'en'
): Promise<string> {
    if (!text || text.trim().length === 0) {
        return text;
    }

    const groqApiKeys = (process.env.GROQ_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (groqApiKeys.length > 0) {
        const OpenAI = (await import('openai')).default;
        const targetLanguage = targetLang === 'ko' ? 'Korean' : 'English';
        const sourceLanguage = targetLang === 'ko' ? 'English' : 'Korean';

        // Try Groq keys one by one if they fail due to rate limits
        for (let i = 0; i < groqApiKeys.length; i++) {
            const currentKey = groqApiKeys[i];
            try {
                const client = new OpenAI({
                    apiKey: currentKey,
                    baseURL: 'https://api.groq.com/openai/v1',
                });
                const model = 'llama-3.3-70b-versatile';

                console.log(`[Translate] Attempting with Groq key index ${i} (${model})`);

                const completion = await client.chat.completions.create({
                    model: model,
                    messages: [
                        {
                            role: 'system',
                            content: `You are an expert professional translator specializing in knitting, crochet, and crafts terminology.
Translate the following ${sourceLanguage} text to ${targetLanguage}.
You must translate standard knitting abbreviations accurately using this dictionary:
- RS (Right Side): 겉면
- WS (Wrong Side): 안면
- Row: 단 또는 행 (e.g. Row 1 -> 1단)
- Rnd / Round: 단 또는 라운드 (e.g. Rnd 1 -> 1단)
- Sl 1 / sl 1 / slip 1: 걸러뜨기 1코 (또는 걸러뜨기 1)
- k / K / knit: 겉뜨기 (e.g. k 2 -> 겉뜨기 2코, k 3 -> 겉뜨기 3코)
- p / P / purl: 안뜨기 (e.g. p 2 -> 안뜨기 2코)
- yo / YO / yarn over: 바늘비우기
- k2tog / K2tog: 오른코 모아뜨기 (또는 겉뜨기 2코 모아뜨기)
- ssk / SSK: 왼코 모아뜨기
- rep / repeat: 반복
- to end: 끝까지
- last: 마지막
- st / sts: 코
- inc: 늘림 / 늘리기
- dec: 줄임 / 줄이기
- pm: 마커 표시
- sm: 마커 옮기기

Maintain the original structure and formatting (line breaks, numbers, brackets, bullet points, etc.).
Ensure the Korean output is fully natural, using professional Korean knitting terms, and DO NOT use Japanese/Chinese characters like 针 or まとめ.
Only output the translation, nothing else.`
                        },
                        {
                            role: 'user',
                            content: text
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 2000
                });

                const translated = completion.choices[0].message.content?.trim();
                if (translated) return translated;
            } catch (error: any) {
                console.error(`[Translate] Groq key index ${i} failed:`, error.message);

                // If it's a rate limit error (429), try next key. Otherwise, break or log.
                if (error.status === 429) {
                    console.log(`[Translate] Rate limit hit for key ${i}, trying next...`);
                    continue;
                }

                // If it's the last key and it failed, we'll try OpenAI or fallback
                if (i === groqApiKeys.length - 1 && !openaiApiKey) {
                    return text;
                }
            }
        }
    }

    // Fallback to OpenAI if Groq fails or is not available
    if (openaiApiKey) {
        try {
            const OpenAI = (await import('openai')).default;
            const client = new OpenAI({ apiKey: openaiApiKey });
            const model = 'gpt-4o-mini';

            console.log('[Translate] Falling back to OpenAI (gpt-4o-mini)');

            const targetLanguage = targetLang === 'ko' ? 'Korean' : 'English';
            const sourceLanguage = targetLang === 'ko' ? 'English' : 'Korean';

            const completion = await client.chat.completions.create({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert professional translator specializing in knitting, crochet, and crafts terminology.
Translate the following ${sourceLanguage} text to ${targetLanguage}.
You must translate standard knitting abbreviations accurately using this dictionary:
- RS (Right Side): 겉면
- WS (Wrong Side): 안면
- Row: 단 또는 행 (e.g. Row 1 -> 1단)
- Rnd / Round: 단 또는 라운드 (e.g. Rnd 1 -> 1단)
- Sl 1 / sl 1 / slip 1: 걸러뜨기 1코 (또는 걸러뜨기 1)
- k / K / knit: 겉뜨기 (e.g. k 2 -> 겉뜨기 2코, k 3 -> 겉뜨기 3코)
- p / P / purl: 안뜨기 (e.g. p 2 -> 안뜨기 2코)
- yo / YO / yarn over: 바늘비우기
- k2tog / K2tog: 오른코 모아뜨기 (또는 겉뜨기 2코 모아뜨기)
- ssk / SSK: 왼코 모아뜨기
- rep / repeat: 반복
- to end: 끝까지
- last: 마지막
- st / sts: 코
- inc: 늘림 / 늘리기
- dec: 줄임 / 줄이기
- pm: 마커 표시
- sm: 마커 옮기기

Maintain the original structure and formatting (line breaks, numbers, brackets, bullet points, etc.).
Ensure the Korean output is fully natural, using professional Korean knitting terms, and DO NOT use Japanese/Chinese characters like 针 or まとめ.
Only output the translation, nothing else.`
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000
            });

            return completion.choices[0].message.content?.trim() || text;
        } catch (error) {
            console.error('[Translate] OpenAI fallback failed:', error);
            return text;
        }
    }

    console.log('[Translate] No working API keys available, returning original text');
    return text;
}

/**
 * Translates pattern metadata (title, descriptions) to both Korean and English
 * Detects source language and translates to the other
 */
export async function translatePatternMetadata(metadata: {
    title: string;
    briefDescription: string;
    detailedDescription?: string;
    sizes?: string;
    measurements?: string;
}): Promise<{
    title: { ko: string; en: string };
    description: {
        ko: string;
        en: string;
        detailed_ko?: string;
        detailed_en?: string;
    };
    sizes: { ko: string; en: string };
    measurements: { ko: string; en: string };
}> {
    const isKorean = containsKorean(metadata.title) || containsKorean(metadata.briefDescription);
    const targetLang = isKorean ? 'en' : 'ko';

    // Translate in parallel for speed
    const [translatedTitle, translatedBrief, translatedDetailed, translatedSizes, translatedMeasurements] = await Promise.all([
        translateText(metadata.title, targetLang),
        translateText(metadata.briefDescription, targetLang),
        metadata.detailedDescription ? translateText(metadata.detailedDescription, targetLang) : Promise.resolve(undefined),
        metadata.sizes ? translateText(metadata.sizes, targetLang) : Promise.resolve(''),
        metadata.measurements ? translateText(metadata.measurements, targetLang) : Promise.resolve('')
    ]);

    if (isKorean) {
        // Source is Korean, translated is English
        return {
            title: { ko: metadata.title, en: translatedTitle },
            description: {
                ko: metadata.briefDescription,
                en: translatedBrief,
                detailed_ko: metadata.detailedDescription,
                detailed_en: translatedDetailed
            },
            sizes: { ko: metadata.sizes || '', en: translatedSizes || '' },
            measurements: { ko: metadata.measurements || '', en: translatedMeasurements || '' }
        };
    } else {
        // Source is English, translated is Korean
        return {
            title: { ko: translatedTitle, en: metadata.title },
            description: {
                ko: translatedBrief,
                en: metadata.briefDescription,
                detailed_ko: translatedDetailed,
                detailed_en: metadata.detailedDescription
            },
            sizes: { ko: translatedSizes || '', en: metadata.sizes || '' },
            measurements: { ko: translatedMeasurements || '', en: metadata.measurements || '' }
        };
    }
}
