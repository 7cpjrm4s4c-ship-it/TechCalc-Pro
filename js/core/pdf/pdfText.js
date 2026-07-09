export function sanitizeText(value = '') {
  return String(value ?? '')
    .replace(/[\uFEFF\uFFFD]/g, '')
    .replace(/[‐‑‒–—―]/g, '-')
    .replace(/[×]/g, 'x')
    .replace(/[·•]/g, '*')
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
    .replace(/[³]/g, '3')
    .replace(/[²]/g, '2')
    .replace(/[¹]/g, '1')
    .replace(/\u00A0/g, ' ')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeKey(label = '') {
  return sanitizeText(label).toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function winAnsiByteForChar(ch) {
  const code = ch.codePointAt(0);
  const fallback = {
    '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87,
    'ˆ': 0x88, '‰': 0x89, 'Š': 0x8A, '‹': 0x8B, 'Œ': 0x8C, 'Ž': 0x8E,
    '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '–': 0x96, '—': 0x97,
    '˜': 0x98, '™': 0x99, 'š': 0x9A, '›': 0x9B, 'œ': 0x9C, 'ž': 0x9E, 'Ÿ': 0x9F
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
  return Number(value).toFixed(2).replace(/\.00$/, '').replace(/0$/, '');
}

export function estimateTextWidth(text, size = 8, font = 'F1') {
  if (font === 'F3' || font === 'F4') return sanitizeText(text).length * size * 0.6;
  // Approximate Helvetica widths. A single length factor made right-aligned
  // values drift visibly between numbers, units and long German labels. This
  // table keeps the PDF value columns optically aligned without embedding fonts.
  const widths = {
    ' ': 0.28, '.': 0.28, ',': 0.28, ':': 0.28, ';': 0.28, '-': 0.33, '/': 0.28,
    '(': 0.33, ')': 0.33, '[': 0.33, ']': 0.33, '+': 0.58, '=': 0.58,
    '0': 0.56, '1': 0.56, '2': 0.56, '3': 0.56, '4': 0.56,
    '5': 0.56, '6': 0.56, '7': 0.56, '8': 0.56, '9': 0.56,
    'i': 0.22, 'j': 0.22, 'l': 0.22, 'I': 0.28, 't': 0.28, 'f': 0.30, 'r': 0.33,
    'm': 0.83, 'w': 0.72, 'M': 0.83, 'W': 0.94,
    'A': 0.67, 'B': 0.67, 'C': 0.72, 'D': 0.72, 'E': 0.67, 'F': 0.61, 'G': 0.78,
    'H': 0.72, 'J': 0.50, 'K': 0.67, 'L': 0.56, 'N': 0.72, 'O': 0.78, 'P': 0.67,
    'Q': 0.78, 'R': 0.72, 'S': 0.67, 'T': 0.61, 'U': 0.72, 'V': 0.67, 'X': 0.67,
    'Y': 0.67, 'Z': 0.61
  };
  let total = 0;
  for (const ch of sanitizeText(text)) total += widths[ch] ?? (/[a-zäöüß]/.test(ch) ? 0.50 : 0.56);
  return total * size;
}

function splitLongToken(token, maxWidth, size) {
  const clean = sanitizeText(token);
  if (estimateTextWidth(clean, size) <= maxWidth) return [clean];
  const chunks = [];
  let current = '';
  for (const ch of clean) {
    const next = current + ch;
    if (current && estimateTextWidth(next, size) > maxWidth) {
      chunks.push(current);
      current = ch;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export function splitPdfText(text, maxWidth, size = 8) {
  const words = sanitizeText(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines = [];
  let line = '';
  words.forEach(word => {
    const wordParts = splitLongToken(word, maxWidth, size);
    wordParts.forEach(part => {
      const candidate = line ? `${line} ${part}` : part;
      if (estimateTextWidth(candidate, size) <= maxWidth || !line) line = candidate;
      else { lines.push(line); line = part; }
    });
  });
  if (line) lines.push(line);
  return lines;
}

export function rgb(values) {
  return values.map(value => pdfNumber(value / 255)).join(' ');
}

export function isNumericText(value) {
  const normalized = sanitizeText(value).replace(/\s+/g, '');
  return normalized !== '' && /^[-+]?\d+(?:[.,]\d+)?(?:%|°C|K|l\/s|m3\/h|kg\/h|kg\/m3|Pa\/m|m\/s|kW)?$/i.test(normalized);
}

export function pdfRowValue(row) {
  if (!row) return '';
  const value = sanitizeText(row?.[1] || '');
  const unit = sanitizeText(row?.[2] || '');
  return [value, unit].filter(Boolean).join(' ') || '-';
}

export function rowHeightForPdfRow(row, valueWidth = 110) {
  const labelLines = splitPdfText(row?.[0] || '', 130, 6.4).length;
  const value = [sanitizeText(row?.[1] || ''), sanitizeText(row?.[2] || '')].filter(Boolean).join(' ');
  const valueLines = splitPdfText(value, valueWidth, 6.7).length;
  return Math.max(12, Math.max(labelLines, valueLines) * 8.1 + 3.5);
}
