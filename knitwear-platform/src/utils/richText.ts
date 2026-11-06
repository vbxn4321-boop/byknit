/**
 * 서술형 도안 서식 유틸.
 *  - pastedTextToHtml: 클립보드 텍스트(GPT 마크다운, HTML 소스)를 에디터용 HTML 로 변환
 *  - htmlToRichLines / wrapRuns: 저장된 HTML 을 PDF 렌더링용 줄 단위 데이터로 변환
 *
 * 마크다운 라이브러리를 쓰지 않는 이유:
 *  - 뜨개 도안의 "*2코 겉뜨기, 1코 안뜨기* 반복" 은 반복 표시이지 기울임이 아니다.
 *    표준 파서는 이를 기울임으로 바꾸면서 별표를 지워 버린다.
 *  - CommonMark 규칙상 "**1단:**코 잡기" 처럼 문장부호 뒤에 한글이 바로 붙으면 볼드가 되지 않는다.
 */

import { decodeEntities, parseTableJson, tableToHtml } from './tableJson';

const LITERAL_ASTERISK = '';
const LITERAL_PIPE = '';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const applyBold = (s: string) =>
    s
        .replace(/\*\*\*(?=\S)(.+?)\*\*\*/g, '<strong>$1</strong>')
        .replace(/\*\*(?=\S)(.+?)\*\*/g, '<strong>$1</strong>');

/** 한 줄의 인라인 서식 변환. 허용된 인라인 태그 외의 "<앞판>" 같은 꺾쇠는 글자로 유지한다. */
function inlineToHtml(line: string): string {
    const protectedLine = line.replace(/\\\*/g, LITERAL_ASTERISK);
    const html = esc(protectedLine)
        .replace(/&lt;(\/?(?:strong|b|em|i|u|s)|br\s*\/?)&gt;/gi, '<$1>')
        .replace(/`([^`\n]+)`/g, '$1');
    return applyBold(html).split(LITERAL_ASTERISK).join('*');
}

const LIST_RE = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;
const FENCE_RE = /^\s*```\s*([\w-]*)\s*$/;
const HEADING_RE = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const HR_RE = /^\s*([-*_])(?:\s*\1){2,}\s*$/;
const TABLE_DELIMITER_RE = /^\s*\|?\s*:?-+:?\s*(?:\|\s*:?-+:?\s*)*\|?\s*$/;
const RULE_RE = /^\s*[━─═▬]{3,}\s*$/;
const LABEL_RE = /^\s*(?:【[^】]+】|[▶▷►①-⑳]\s*\S.*)\s*$/;
const HTML_BLOCK_RE = /<\/?(?:html|body|p|div|h[1-6]|ul|ol|li|table|tr|td|th|blockquote)\b[^>]*>/i;
const HTML_INLINE_RE = /<\/?(?:strong|b|em|i|u|s)>|<br\s*\/?>/i;

/** "① 코잡기" 같은 짧은 제목 줄. "① 수면 중에는 벗겨주세요." 같은 문장은 제외한다. */
const isLabelLine = (line: string) => {
    const trimmed = line.trim();
    return trimmed.length <= 30 && LABEL_RE.test(trimmed) && !/[.!?。:]$/.test(trimmed);
};

const paragraphLineToHtml = (line: string) =>
    isLabelLine(line) ? `<strong>${inlineToHtml(line)}</strong>` : inlineToHtml(line);

const isOrderedMarker = (marker: string) => /\d/.test(marker);
const indentOf = (line: string) => line.match(/^\s*/)![0].length;
const isBlank = (line: string | undefined) => line === undefined || line.trim() === '';

function parseList(lines: string[], start: number, baseIndent: number): { html: string; next: number } {
    const firstMarker = LIST_RE.exec(lines[start])![2];
    const ordered = isOrderedMarker(firstMarker);
    const items: { body: string; children: string }[] = [];
    let i = start;

    while (i < lines.length) {
        const match = LIST_RE.exec(lines[i]);
        if (!match) {
            if (isBlank(lines[i])) {
                // "1. a\n\n2. b" 처럼 빈 줄로 띄운 항목도 같은 목록으로 이어 준다.
                let j = i;
                while (j < lines.length && isBlank(lines[j])) j++;
                const nextItem = j < lines.length ? LIST_RE.exec(lines[j]) : null;
                if (!nextItem || nextItem[1].length < baseIndent) break;
                i = j;
                continue;
            }
            if (indentOf(lines[i]) > baseIndent && items.length) {
                items[items.length - 1].body += `<br>${inlineToHtml(lines[i].trim())}`;
                i++;
                continue;
            }
            break;
        }

        const indent = match[1].length;
        if (indent < baseIndent) break;
        if (indent > baseIndent) {
            const nested = parseList(lines, i, indent);
            items[items.length - 1].children += nested.html;
            i = nested.next;
            continue;
        }
        if (isOrderedMarker(match[2]) !== ordered) break;
        items.push({ body: inlineToHtml(match[3]), children: '' });
        i++;
    }

    const lis = items.map(item => `<li><p>${item.body}</p>${item.children}</li>`).join('');
    if (!ordered) return { html: `<ul>${lis}</ul>`, next: i };
    const first = parseInt(firstMarker, 10);
    return { html: first === 1 ? `<ol>${lis}</ol>` : `<ol start="${first}">${lis}</ol>`, next: i };
}

const splitTableRow = (line: string): string[] =>
    line
        .trim()
        .replace(/\\\|/g, LITERAL_PIPE)
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map(c => c.trim().split(LITERAL_PIPE).join('|'));

function markdownTableToHtml(rows: string[]): string {
    const [head, , ...body] = rows;
    const th = splitTableRow(head).map(c => `<th>${inlineToHtml(c)}</th>`).join('');
    const trs = body
        .map(r => `<tr>${splitTableRow(r).map(c => `<td>${inlineToHtml(c)}</td>`).join('')}</tr>`)
        .join('');
    return `<table><tbody><tr>${th}</tr>${trs}</tbody></table>`;
}

function fencedBlockToHtml(lang: string, body: string): string {
    const table = parseTableJson(body);
    if (table) return tableToHtml(table);
    if (lang.toLowerCase() === 'html') return applyBold(body.trim());
    return `<pre><code>${esc(body)}</code></pre>`;
}

function markdownToHtml(text: string): string {
    const lines = text.split('\n');
    const out: string[] = [];
    let paragraph: string[] = [];

    const flush = () => {
        if (paragraph.length) out.push(`<p>${paragraph.map(paragraphLineToHtml).join('<br>')}</p>`);
        paragraph = [];
    };

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];

        if (isBlank(line)) {
            flush();
            i++;
            continue;
        }

        const fence = FENCE_RE.exec(line);
        if (fence) {
            flush();
            let j = i + 1;
            while (j < lines.length && !FENCE_RE.test(lines[j])) j++;
            out.push(fencedBlockToHtml(fence[1], lines.slice(i + 1, j).join('\n')));
            i = j + 1;
            continue;
        }

        const trimmed = line.trim();
        if (!paragraph.length && (trimmed[0] === '{' || trimmed[0] === '[')) {
            let j = i;
            while (j < lines.length && !isBlank(lines[j])) j++;
            const table = parseTableJson(lines.slice(i, j).join('\n'));
            if (table) {
                out.push(tableToHtml(table));
                i = j;
                continue;
            }
        }

        const heading = HEADING_RE.exec(line);
        if (heading) {
            flush();
            out.push(`<h${heading[1].length}>${inlineToHtml(heading[2])}</h${heading[1].length}>`);
            i++;
            continue;
        }

        if (RULE_RE.test(line)) {
            flush();
            // 구분선 두 줄로 감싼 한 줄은 구분선 + 제목으로 정리한다
            const title = lines[i + 1];
            if (!isBlank(title) && !RULE_RE.test(title) && RULE_RE.test(lines[i + 2] ?? '')) {
                out.push(`<hr><h3>${inlineToHtml(title.trim())}</h3>`);
                i += 3;
            } else {
                out.push('<hr>');
                i++;
            }
            continue;
        }

        if (HR_RE.test(line)) {
            flush();
            out.push('<hr>');
            i++;
            continue;
        }

        if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('-') && TABLE_DELIMITER_RE.test(lines[i + 1])) {
            flush();
            let j = i + 2;
            while (j < lines.length && !isBlank(lines[j]) && lines[j].includes('|')) j++;
            out.push(markdownTableToHtml(lines.slice(i, j)));
            i = j;
            continue;
        }

        if (/^\s*>/.test(line)) {
            flush();
            const quoted: string[] = [];
            while (i < lines.length && /^\s*>/.test(lines[i])) {
                quoted.push(lines[i].replace(/^\s*>\s?/, ''));
                i++;
            }
            out.push(`<blockquote><p>${quoted.map(inlineToHtml).join('<br>')}</p></blockquote>`);
            continue;
        }

        if (LIST_RE.test(line)) {
            flush();
            const list = parseList(lines, i, indentOf(line));
            out.push(list.html);
            i = list.next;
            continue;
        }

        paragraph.push(trimmed);
        i++;
    }
    flush();
    return out.join('');
}

/** 텍스트 안에 서식 표시(마크다운 또는 HTML 소스)가 있는지 */
export function hasTextMarkup(text: string): boolean {
    return (
        HTML_BLOCK_RE.test(text) ||
        HTML_INLINE_RE.test(text) ||
        /\*\*\S/.test(text) ||
        text.split('\n').some(line => RULE_RE.test(line) || isLabelLine(line)) ||
        /^\s*```/m.test(text) ||
        /^\s{0,3}#{1,6}\s/m.test(text) ||
        /^\s*(?:[-*+]|\d+[.)])\s/m.test(text) ||
        /^\s*\|?\s*:?-+:?\s*\|/m.test(text)
    );
}

/**
 * 클립보드 HTML 이 이미 서식을 담고 있으면 에디터 기본 처리에 맡긴다.
 * (GPT 화면을 드래그해서 복사한 경우, 에디터 내부 복사/붙여넣기)
 */
export function isRichClipboardHtml(html: string): boolean {
    return html.includes('data-pm-slice') || /<(?:strong|b|h[1-6]|table|ul|ol|li|em|blockquote)[\s>]/i.test(html);
}

/**
 * 에디터 기본 붙여넣기로 넘어가는 클립보드 HTML 에도 구분선/제목 줄 처리를 적용한다.
 * 이미 서식이 있는 문단은 건드리지 않는다.
 */
export function decorateClipboardHtml(html: string): string {
    if (html.includes('data-pm-slice')) return html;
    const doc = new DOMParser().parseFromString(html, 'text/html');

    doc.body.querySelectorAll('p').forEach(p => {
        if (p.closest('table, li, blockquote')) return;
        if (Array.from(p.children).some(child => child.tagName !== 'BR')) return;
        const text = Array.from(p.childNodes)
            .map(node => (node.nodeName === 'BR' ? '\n' : node.textContent ?? ''))
            .join('');
        if (text.split('\n').some(line => RULE_RE.test(line) || isLabelLine(line))) {
            p.outerHTML = markdownToHtml(text);
        }
    });

    doc.body.querySelectorAll('hr').forEach(hr => {
        const title = hr.nextElementSibling;
        const closing = title?.nextElementSibling;
        if (!hr.isConnected || !title || title.tagName !== 'P' || title.querySelector('br') || closing?.tagName !== 'HR') return;
        const heading = doc.createElement('h3');
        heading.innerHTML = title.innerHTML;
        title.replaceWith(heading);
        closing.remove();
    });

    return doc.body.innerHTML;
}

/** 붙여넣은 텍스트를 HTML 로 변환. 서식도 줄바꿈도 없는 한 줄이면 null(기본 붙여넣기). */
export function pastedTextToHtml(rawText: string): string | null {
    const text = rawText.replace(/\r\n?/g, '\n').trim();
    if (!text) return null;
    if (!text.includes('\n') && !hasTextMarkup(text)) return null;

    const hasFence = /^\s*```/m.test(text);
    if (!hasFence && HTML_BLOCK_RE.test(text)) {
        return applyBold(text.replace(/^\s*<!doctype[^>]*>/i, '').trim());
    }
    return markdownToHtml(text);
}

export interface TextRun {
    text: string;
    bold: boolean;
}

export interface RichLine {
    runs: TextRun[];
    /** h1~h6 태그로 표시된 제목 */
    heading: boolean;
    listItem: boolean;
    /** 들여쓰기 단계 (중첩 목록) */
    indent: number;
    /** 앞 문단과의 사이에 간격을 둘지 */
    gapBefore: boolean;
    /** 구분선 (runs 는 비어 있음) */
    rule: boolean;
}

const BLOCK_TAGS = new Set(['p', 'div', 'blockquote', 'pre', 'table', 'tr', 'td', 'th']);

/** 저장된 HTML 을 볼드 정보와 문단 간격을 유지한 줄 목록으로 변환 */
export function htmlToRichLines(html: string): RichLine[] {
    const lines: RichLine[] = [];
    const lists: { ordered: boolean; next: number }[] = [];
    let current: TextRun[] = [];
    let prefix = '';
    let boldDepth = 0;
    let heading = false;
    let pendingGap = false;

    const endLine = () => {
        const hasText = current.some(r => r.text.trim());
        if (hasText) {
            current[0].text = current[0].text.trimStart();
            current[current.length - 1].text = current[current.length - 1].text.trimEnd();
            lines.push({
                runs: current.filter(r => r.text),
                heading,
                listItem: lists.length > 0,
                indent: Math.max(0, lists.length - 1),
                gapBefore: pendingGap && lines.length > 0,
                rule: false,
            });
            pendingGap = false;
        }
        current = [];
    };

    const addText = (text: string) => {
        if (!current.length && !text.trim()) return;
        if (prefix) {
            current.push({ text: prefix, bold: false });
            prefix = '';
        }
        current.push({ text, bold: boldDepth > 0 });
    };

    const tokenRe = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>|[^<]+|</g;
    let token: RegExpExecArray | null;
    while ((token = tokenRe.exec(html || '')) !== null) {
        const tag = token[2]?.toLowerCase();
        if (!tag) {
            decodeEntities(token[0]).split('\n').forEach((segment, idx) => {
                if (idx > 0) endLine();
                addText(segment);
            });
            continue;
        }

        const closing = token[1] === '/';
        if (tag === 'strong' || tag === 'b') {
            boldDepth = Math.max(0, boldDepth + (closing ? -1 : 1));
        } else if (tag === 'br') {
            endLine();
        } else if (tag === 'hr') {
            endLine();
            lines.push({ runs: [], heading: false, listItem: false, indent: 0, gapBefore: false, rule: true });
            pendingGap = false;
        } else if (/^h[1-6]$/.test(tag)) {
            endLine();
            heading = !closing;
            if (closing) pendingGap = true;
        } else if (tag === 'ul' || tag === 'ol') {
            endLine();
            if (closing) {
                lists.pop();
                if (!lists.length) pendingGap = true;
            } else {
                const start = /start="(\d+)"/.exec(token[3]);
                if (!lists.length) pendingGap = true;
                lists.push({ ordered: tag === 'ol', next: start ? parseInt(start[1], 10) : 1 });
            }
        } else if (tag === 'li') {
            endLine();
            const list = lists[lists.length - 1];
            if (!closing) prefix = list?.ordered ? `${list.next++}. ` : '• ';
        } else if (BLOCK_TAGS.has(tag)) {
            endLine();
            if (closing && !lists.length) pendingGap = true;
        }
    }
    endLine();
    return lines;
}

/** 볼드/일반 글자 폭이 섞인 줄을 maxWidth 에 맞춰 나눈다 */
export function wrapRuns(
    runs: TextRun[],
    maxWidth: number,
    measure: (text: string, bold: boolean) => number
): TextRun[][] {
    const wrapped: TextRun[][] = [];
    let line: TextRun[] = [];
    let width = 0;

    for (const run of runs) {
        for (const char of Array.from(run.text)) {
            const charWidth = measure(char, run.bold);
            if (width + charWidth > maxWidth && line.length) {
                wrapped.push(line);
                line = [];
                width = 0;
            }
            const last = line[line.length - 1];
            if (last && last.bold === run.bold) last.text += char;
            else line.push({ text: char, bold: run.bold });
            width += charWidth;
        }
    }
    if (line.length) wrapped.push(line);
    return wrapped;
}
