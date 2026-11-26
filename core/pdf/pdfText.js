export function applyEngineeringTypography(value = '') {
  return String(value ?? '')
    .replace(/\bl\s*\/\s*\(s\s*\*\s*ha\)/gi, 'l/(s·ha)')
    .replace(/\bl\s*\/\s*\(s\s*[·x×]\s*ha\)/gi, 'l/(s·ha)')
    .replace(/\bm3\s*\/\s*ha\b/gi, 'm³/ha')
    .replace(/\bm3\s*\/\s*h\b/gi, 'm³/h')
    .replace(/\bkg\s*\/\s*m3\b/gi, 'kg/m³')
    .replace(/\bm2\b/gi, 'm²')
    .replace(/\bm3\b/gi, 'm³')
    .replace(/\bA\s*[x*]\s*C(s)?\b/g, (_match, suffix) => `A × C${suffix || ''}`)
    .replace(/\bA\s*·\s*C(s)?\b/g, (_match, suffix) => `A × C${suffix || ''}`);
}
export function sanitizeText(value = '') {
  return applyEngineeringTypography(String(value ?? ''))
    .replace(/[\uFEFF\uFFFD]/g, '')
    .replace(/[‐‑‒–—―]/g, '-')
    .replace(/[Θϑ]/g, 'Theta')
    .replace(/[Φφ]/g, 'Phi')
    .replace(/[ρ]/g, 'rho')
    .replace(/[Δ]/g, 'Delta')
    .replace(/[η]/g, 'eta')
    .replace(/[µμ]/g, 'u')
    .replace(/[Øø]/g, 'DN')
    .replace(/[α]/g, 'alpha')
    .replace(/[β]/g, 'beta')
    .replace(/[γ]/g, 'gamma')
    .replace(/[λ]/g, 'lambda')
    .replace(/[π]/g, 'pi')
    .replace(/[∞]/g, 'unendlich')
    .replace(/[∅]/g, 'leer')
    .replace(/[→⇒]/g, '->')
    .replace(/[←⇐]/g, '<-')
    .replace(/[↔⇔]/g, '<->')
    .replace(/[±]/g, '+/-')
    .replace(/[÷]/g, '/')
    .replace(/[°]/g, '°')
    .replace(/[ṁ]/g, 'm')
    .replace(/[ṽ]/g, 'V')
    .replace(/[Σ∑]/g, 'Summe')
    .replace(/[√]/g, 'Wurzel')
    .replace(/[≤]/g, '<=')
    .replace(/[≥]/g, '>=')
    .replace(/[≈]/g, '~')
    .replace(/[¹]/g, '1')
    .replace(/\u00A0/g, ' ')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
export function normalizeKey(label = '') {
  return sanitizeText(label).toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[²]/g, '2').replace(/[³]/g, '3').replace(/[×·]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
export function winAnsiByteForChar(ch) {
  const code = ch.codePointAt(0);
  const fallback = {
    '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87,
    'ˆ': 0x88, '‰': 0x89, 'Š': 0x8A, '‹': 0x8B, 'Œ': 0x8C, 'Ž': 0x8E,
    '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '–': 0x96, '—': 0x97,
    '˜': 0x98, '™': 0x99, 'š': 0x9A, '›': 0x9B, 'œ': 0x9C, 'ž': 0x9E, 'Ÿ': 0x9F,
    'ₛ': 0x73
  };
  if (fallback[ch]) return fallback[ch];
  if (code >= 0x20 && code <= 0x7E) return code;
  if (code >= 0xA0 && code <= 0xFF) return code;
  return 0x20;
}
export function pdfHexText(value = '') {
  const text = sanitizeText(value);
  const bytes = [];
  for (const ch of text) bytes.push(winAnsiByteForChar(ch));
  return `<${bytes.map(byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase()}>`;
}

export function pdfNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0';
  return number.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
}
// Glyph widths of the PDF base-14 font Helvetica (AFM, units per 1000 em).
// The renderer embeds no font, so viewers measure text with exactly these
// widths; the estimate must match them, otherwise wrapped lines overflow
// their field in the real document.
const HELVETICA_WIDTHS = {
  ' ': 278, '!': 278, '"': 355, '#': 556, '$': 556, '%': 889, '&': 667, "'": 191,
  '(': 333, ')': 333, '*': 389, '+': 584, ',': 278, '-': 333, '.': 278, '/': 278,
  '0': 556, '1': 556, '2': 556, '3': 556, '4': 556, '5': 556, '6': 556, '7': 556, '8': 556, '9': 556,
  ':': 278, ';': 278, '<': 584, '=': 584, '>': 584, '?': 556, '@': 1015,
  'A': 667, 'B': 667, 'C': 722, 'D': 722, 'E': 667, 'F': 611, 'G': 778, 'H': 722,
  'I': 278, 'J': 500, 'K': 667, 'L': 556, 'M': 833, 'N': 722, 'O': 778, 'P': 667,
  'Q': 778, 'R': 722, 'S': 667, 'T': 611, 'U': 722, 'V': 667, 'W': 944, 'X': 667,
  'Y': 667, 'Z': 611,
  '[': 278, '\\': 278, ']': 278, '^': 469, '_': 556, '`': 333,
  'a': 556, 'b': 556, 'c': 500, 'd': 556, 'e': 556, 'f': 278, 'g': 556, 'h': 556,
  'i': 222, 'j': 222, 'k': 500, 'l': 222, 'm': 833, 'n': 556, 'o': 556, 'p': 556,
  'q': 556, 'r': 333, 's': 500, 't': 278, 'u': 556, 'v': 500, 'w': 722, 'x': 500,
  'y': 500, 'z': 500,
  '{': 334, '|': 260, '}': 334, '~': 584,
  '\u00b0': 400, '\u00b7': 278, '\u00d7': 584, '\u00b2': 333, '\u00b3': 333, '\u00b5': 556,
  '\u00e4': 556, '\u00f6': 556, '\u00fc': 556, '\u00c4': 667, '\u00d6': 778, '\u00dc': 722, '\u00df': 500
};
export function estimateTextWidth(text, size = 8, font = 'F1') {
  if (font === 'F3' || font === 'F4') return sanitizeText(text).length * size * 0.6;
  let total = 0;
  for (const ch of sanitizeText(text)) total += HELVETICA_WIDTHS[ch] ?? 556;
  return (total / 1000) * size;
}

function splitAtSemanticSeparators(token) {
  const clean = sanitizeText(token);
  if (!clean) return [''];
  const parts = clean.match(/[^/·-]+[/·-]?/g);
  return parts?.filter(Boolean) || [clean];
}
function splitLongToken(token, maxWidth, size, font = 'F1') {
  const clean = sanitizeText(token);
  if (estimateTextWidth(clean, size, font) <= maxWidth) return [clean];
  const semanticParts = splitAtSemanticSeparators(clean);
  if (semanticParts.length === 1) return [clean];
  const chunks = [];
  let current = '';
  for (const part of semanticParts) {
    const candidate = current + part;
    if (current && estimateTextWidth(candidate, size, font) > maxWidth) {
      chunks.push(current);
      current = part;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}
export function splitPdfText(value = '', maxWidth = 200, size = 8, font = 'F1') {
  const text = sanitizeText(value);
  if (!text) return [''];
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const parts = splitLongToken(word, maxWidth, size, font);
    for (const part of parts) {
      const candidate = current ? `${current} ${part}` : part;
      if (current && estimateTextWidth(candidate, size, font) > maxWidth) {
        lines.push(current);
        current = part;
      } else {
        current = candidate;
      }
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}
export function rgb(values = [0, 0, 0]) {
  return values.map(value => pdfNumber(Number(value) / 255)).join(' ');
}

export function pdfRowValue(row = []) {
  const value = sanitizeText(row?.[1] ?? '');
  const unit = sanitizeText(row?.[2] ?? '');
  return [value, unit].filter(Boolean).join(' ');
}
