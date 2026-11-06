/**
 * JSON 표 → 표 변환 유틸.
 * 지원 형식:
 *  1) { "headers": ["A","B"], "rows": [["1","2"]] }   (columns/data 도 허용)
 *  2) { "table": <위 형식 또는 아래 형식> }
 *  3) [["A","B"],["1","2"]]                          (첫 행 = 헤더)
 *  4) [{"A":1,"B":2}, {"A":3,"B":4}]                 (키 = 헤더)
 */

export interface ParsedTable {
    headers: string[];
    rows: string[][];
}

const cell = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
};

export function tableFromValue(value: any): ParsedTable | null {
    if (!value || typeof value !== 'object') return null;

    if (!Array.isArray(value)) {
        if (value.table) return tableFromValue(value.table);
        const headers = value.headers ?? value.header ?? value.columns;
        const rows = value.rows ?? value.data;
        if (Array.isArray(headers) && Array.isArray(rows) && rows.every(Array.isArray)) {
            return { headers: headers.map(cell), rows: rows.map((r: unknown[]) => r.map(cell)) };
        }
        if (Array.isArray(rows) && !headers) return tableFromValue(rows);
        return null;
    }

    if (value.length === 0) return null;

    if (value.every(Array.isArray)) {
        if (value.length < 1) return null;
        const [head, ...body] = value as unknown[][];
        return { headers: head.map(cell), rows: body.map(r => r.map(cell)) };
    }

    if (value.every((r: any) => r && typeof r === 'object' && !Array.isArray(r))) {
        const headers: string[] = [];
        for (const r of value) for (const k of Object.keys(r)) if (!headers.includes(k)) headers.push(k);
        return { headers, rows: value.map((r: any) => headers.map(h => cell(r[h]))) };
    }
    return null;
}

/** 문자열이 JSON 표이면 파싱, 아니면 null */
export function parseTableJson(text: string): ParsedTable | null {
    const t = (text || '').trim();
    if (!t || (t[0] !== '{' && t[0] !== '[')) return null;
    try {
        return tableFromValue(JSON.parse(t));
    } catch {
        return null;
    }
}

const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function tableToHtml({ headers, rows }: ParsedTable): string {
    const th = headers.length
        ? `<tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr>`
        : '';
    const body = rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
    return `<table><tbody>${th}${body}</tbody></table>`;
}

const decode = (s: string) =>
    s.replace(/&nbsp;/gi, ' ').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&amp;/gi, '&');

/**
 * HTML 안에서 "JSON 표만 들어 있는 <p>" 를 <table> 로 치환한다.
 * (붙여넣기 외에 직접 타이핑한 경우에도 미리보기/PDF에서 표로 나오게 함)
 */
export function convertJsonParagraphsToTables(html: string): string {
    if (!html) return html;
    return html.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (match, inner) => {
        const text = decode(inner.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''));
        const table = parseTableJson(text);
        return table ? tableToHtml(table) : match;
    });
}

export type ContentBlock =
    | { type: 'text'; html: string }
    | { type: 'table'; table: ParsedTable };

/** HTML 을 텍스트 블록과 표 블록으로 분리 (PDF 렌더링용) */
export function splitHtmlIntoBlocks(html: string): ContentBlock[] {
    const src = convertJsonParagraphsToTables(html || '');
    const blocks: ContentBlock[] = [];
    const re = /<table[\s\S]*?<\/table>/gi;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
        if (m.index > last) blocks.push({ type: 'text', html: src.slice(last, m.index) });
        const table = htmlTableToParsed(m[0]);
        if (table) blocks.push({ type: 'table', table });
        last = m.index + m[0].length;
    }
    if (last < src.length) blocks.push({ type: 'text', html: src.slice(last) });
    return blocks;
}

function htmlTableToParsed(tableHtml: string): ParsedTable | null {
    const rows: string[][] = [];
    const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let tr: RegExpExecArray | null;
    let headerRow: string[] | null = null;
    while ((tr = trRe.exec(tableHtml)) !== null) {
        const cells: string[] = [];
        let isHeader = false;
        const tdRe = /<(td|th)[^>]*>([\s\S]*?)<\/\1>/gi;
        let td: RegExpExecArray | null;
        while ((td = tdRe.exec(tr[1])) !== null) {
            if (td[1].toLowerCase() === 'th') isHeader = true;
            cells.push(
                decode(td[2].replace(/<\/p>\s*<p[^>]*>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')).trim()
            );
        }
        if (!cells.length) continue;
        if (isHeader && !headerRow && rows.length === 0) headerRow = cells;
        else rows.push(cells);
    }
    if (!headerRow && !rows.length) return null;
    return { headers: headerRow ?? [], rows };
}
