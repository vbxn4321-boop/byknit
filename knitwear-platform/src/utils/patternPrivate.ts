// 서버 전용: 결제 후에만 전달되는 도안 데이터(PDF, 차트, AI 전체 도안).
// pattern_private 테이블은 서비스 롤로만 접근할 수 있다.
import { createAdminClient } from '@/utils/supabase/server';

export const PRIVATE_PDF_BUCKET = 'pattern-files';

export interface PatternPrivateFields {
    pdf_url?: string | null;
    grid_data?: unknown;
    full_content?: unknown;
}

export async function savePatternPrivate(patternId: string, fields: PatternPrivateFields) {
    const supabase = await createAdminClient();
    const { error } = await supabase
        .from('pattern_private')
        .upsert({ pattern_id: patternId, ...fields, updated_at: new Date().toISOString() });
    if (error) throw new Error(`Failed to save pattern files: ${error.message}`);
}

/** 비공개 데이터를 읽는다. 아직 이관되지 않은 도안은 patterns 테이블의 값을 사용한다. */
export async function loadPatternPrivate(patternId: string): Promise<Required<PatternPrivateFields>> {
    const supabase = await createAdminClient();
    const [{ data: stored }, { data: legacy }] = await Promise.all([
        supabase.from('pattern_private').select('pdf_url, grid_data, full_content').eq('pattern_id', patternId).maybeSingle(),
        supabase.from('patterns').select('grid_data, content').eq('id', patternId).maybeSingle(),
    ]);

    return {
        pdf_url: stored?.pdf_url ?? legacy?.content?.pdf_url ?? null,
        grid_data: stored?.grid_data ?? legacy?.grid_data ?? null,
        full_content: stored?.full_content ?? legacy?.content?.metadata?.full_content ?? null,
    };
}

/** 저장된 PDF 위치를 내려받을 수 있는 주소로 바꾼다. 비공개 버킷 파일은 5분짜리 서명 URL을 만든다. */
export async function createPdfDownloadUrl(pdfLocation: string | null): Promise<string | null> {
    if (!pdfLocation) return null;
    if (/^https?:\/\//.test(pdfLocation) || pdfLocation.startsWith('/')) return pdfLocation;

    const supabase = await createAdminClient();
    const { data, error } = await supabase.storage
        .from(PRIVATE_PDF_BUCKET)
        .createSignedUrl(pdfLocation, 300);
    if (error) {
        console.error('Failed to sign PDF url:', error.message);
        return null;
    }
    return data.signedUrl;
}
