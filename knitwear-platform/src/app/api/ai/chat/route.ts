import { NextResponse } from 'next/server';

// In production, use OpenAI API
// import OpenAI from 'openai';
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const KNITTING_SYMBOLS = {
    K: '겉뜨기',
    P: '안뜨기',
    YO: '감아뜨기',
    K2TOG: '오른코 모아뜨기',
    SSK: '왼코 모아뜨기',
    C4F: '왼꽈배기 4코',
    C4B: '오른꽈배기 4코',
};

export async function POST(request: Request) {
    try {
        const { message, locale } = await request.json();

        // 1. Authenticate User
        const supabase = await import('@/utils/supabase/server').then(mod => mod.createClient());
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Transact Credits (DB Call)
        // We use the same RPC call logic as in the server action.
        const { error: creditError } = await supabase.rpc('deduct_credits', {
            p_user_id: user.id,
            p_amount: 1,
            p_description: 'AI Pattern Generation (Chat)'
        });

        if (creditError) {
            console.error('Credit deduction failed:', creditError);
            return NextResponse.json(
                { error: 'Insufficient credits or transaction failed' },
                { status: 402 } // Payment Required
            );
        }

        // Check if OpenAI API key is available
        if (process.env.OPENAI_API_KEY) {
            // Production: Use OpenAI
            const OpenAI = (await import('openai')).default;
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

            const systemPrompt = `You are a knitting pattern designer assistant. When a user describes a pattern, generate a JSON response with:
1. "grid": 2D array where each cell is a color index (0-based)
2. "width": number of stitches (columns)
3. "height": number of rows
4. "palette": array of hex color codes
5. "instructions": step-by-step text instructions in ${locale === 'ko' ? 'Korean' : 'English'}

Use these knitting terms for Korean:
- Cast On = 코잡기
- Bind Off = 코막음
- Knit = 겉뜨기
- Purl = 안뜨기
- Yarn Over = 감아뜨기
- K2tog = 오른코 모아뜨기
- SSK = 왼코 모아뜨기
- Cable = 꽈배기

Always include a warning that AI-generated patterns need verification.`;

            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message },
                ],
                response_format: { type: 'json_object' },
            });

            const result = JSON.parse(completion.choices[0].message.content || '{}');
            return NextResponse.json(result);
        }

        // Development: Return mock response
        const isKorean = locale === 'ko';

        // Generate a simple pattern based on keywords
        const hasCable = message.includes('꽈배기') || message.toLowerCase().includes('cable');
        const hasColorwork = message.includes('배색') || message.toLowerCase().includes('colorwork') || message.toLowerCase().includes('fair isle');

        let width = 20;
        let height = 10;
        let palette = ['#FFFFFF', '#4A3F35'];

        if (hasCable) {
            palette = ['#FFFFFF', '#4A3F35', '#E8B4B8'];
        } else if (hasColorwork) {
            palette = ['#FFFFFF', '#4A3F35', '#E8B4B8', '#A7C4A0'];
            width = 24;
            height = 12;
        }

        // Generate pattern grid
        const grid = Array(height).fill(null).map((_, row) =>
            Array(width).fill(null).map((_, col) => {
                if (hasCable) {
                    // Simple cable pattern
                    if (col >= 8 && col <= 11 && row % 4 === 0) {
                        return 2; // Cable color
                    }
                    return row % 2 === 0 ? 0 : 1;
                } else if (hasColorwork) {
                    // Simple colorwork pattern
                    return (row + col) % palette.length;
                }
                // Default stockinette
                return row % 2 === 0 ? 0 : 1;
            })
        );

        const instructions = isKorean
            ? `**${message}** 도안입니다.

**재료:**
- 실: 워스티드 중량 (약 150-200g)
- 바늘: 5mm (US 8)
- 게이지: 10cm당 18코 x 24단

**도안 순서:**
1. 코잡기 ${width * 2}코
2. 고무뜨기 (겉2, 안2) 5cm
3. 본문 패턴 (위 차트 참조)
4. 원하는 길이까지 반복
5. 코막음

⚠️ **주의:** AI 생성 도안입니다. 실제 제작 전 게이지 확인 및 도안 검증이 필요합니다.`
            : `Here's a pattern for **${message}**:

**Materials:**
- Yarn: Worsted weight (approx. 150-200g)
- Needles: 5mm (US 8)
- Gauge: 18 sts x 24 rows = 10cm

**Instructions:**
1. Cast on ${width * 2} stitches
2. Work in ribbing (K2, P2) for 5cm
3. Begin main pattern (see chart above)
4. Repeat to desired length
5. Bind off

⚠️ **Note:** This is an AI-generated pattern. Please verify gauge and pattern accuracy before starting.`;

        return NextResponse.json({
            grid,
            palette,
            width,
            height,
            instructions,
            message: instructions,
        });
    } catch (error) {
        console.error('AI Chat Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate pattern' },
            { status: 500 }
        );
    }
}
