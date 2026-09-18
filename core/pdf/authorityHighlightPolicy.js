import { normalizeKey, sanitizeText } from './pdfText.js';

const RULES = Object.freeze([
  { pattern: /planerisch anzusetzendes speichervolumen|maßgebendes .*volumen/i, token: 'governing-value' },
  { pattern: /maßgebende regendauer|maßgebende dauer/i, token: 'governing-duration' },
  { pattern: /warnung/i, token: 'warning' },
  { pattern: /fehler/i, token: 'error' },
  { pattern: /empfehlung|handlungsempfehlung/i, token: 'recommendation' },
  { pattern: /gleichung \(20\)|gleichung \(21\)|din 1986-100|dwa-a 117/i, token: 'normative' }
]);

export const AUTHORITY_TYPOGRAPHY = Object.freeze({
  labelAlign: 'left',
  valueAlign: 'right',
  unitAlign: 'right',
  numericFont: 'F4',
  textFont: 'F1',
  labelFont: 'F2'
});

export function highlightToken(label = '', value = '') {
  const source = `${sanitizeText(label)} ${sanitizeText(value)}`;
  return RULES.find(rule => rule.pattern.test(source))?.token || 'none';
}

export function decorateAuthorityRows(rows = []) {
  return Object.freeze(rows.map(row => Object.freeze({
    cells: Object.freeze([sanitizeText(row?.[0]), sanitizeText(row?.[1]), sanitizeText(row?.[2])]),
    key: normalizeKey(row?.[0] || ''),
    highlight: highlightToken(row?.[0], row?.[1]),
    align: AUTHORITY_TYPOGRAPHY
  })));
}

export default { AUTHORITY_TYPOGRAPHY, highlightToken, decorateAuthorityRows };
