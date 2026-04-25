/**
 * LLM rüya yorumunu okunaklı düz metne çevirir:
 * markdown (*, **, #, _), madde / numara satırları, gereksiz boşluklar.
 */

function stripLineMarkers(line: string): string {
  let s = line.trim();
  for (let i = 0; i < 6; i += 1) {
    const next = s
      .replace(/^#{1,6}\s+/u, '')
      .replace(/^\d{1,2}[\.\)]\s+/u, '')
      .replace(/^[-*+–—•·▪▸‣⁃]\s*/u, '');
    if (next === s) break;
    s = next.trim();
  }
  return s;
}

function stripInlineMarkdown(segment: string): string {
  let s = segment;
  s = s.replace(/\*\*([\s\S]*?)\*\*/g, '$1');
  s = s.replace(/__([\s\S]*?)__/g, '$1');
  s = s.replace(/`([^`]+)`/g, '$1');
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  s = s.replace(/\*([^*\n]+)\*/g, '$1');
  s = s.replace(/_([^_\n]+)_/g, '$1');
  s = s.replace(/\*+/g, '');
  s = s.replace(/#{1,6}\s*/g, '');
  return s;
}

/**
 * Paragraflar arasında yalnızca \n\n bırakır; satır içi tek \n boşluğa çevrilir.
 */
export function normalizeInterpretation(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  let t = raw.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '');
  t = t.replace(/^[\s\*\-–—_#]+$/gm, '');
  t = t.replace(/^---+$/gm, '');
  t = t.replace(/^\*{3,}$/gm, '');

  const blocks = t.split(/\n{2,}/);
  const paragraphs: string[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').map(stripLineMarkers).filter((l) => l.length > 0);
    if (lines.length === 0) continue;
    const merged = lines.join(' ');
    const cleaned = stripInlineMarkdown(merged).replace(/\s+/g, ' ').trim();
    if (cleaned.length > 0) paragraphs.push(cleaned);
  }

  return paragraphs.join('\n\n');
}

export function formatInterpretationText(raw: string): string {
  return normalizeInterpretation(raw);
}

export function formatInterpretationParagraphs(raw: string): string[] {
  return normalizeInterpretation(raw)
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}
