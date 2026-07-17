import { sanitizeText, splitPdfText } from './pdfText.js';

export const AUTHORITY_TABLE_LAYOUT_VERSION = 1;

export const AUTHORITY_TABLE_TOKENS = Object.freeze({
  headerHeight: 16,
  rowMinHeight: 15,
  rowPaddingTop: 3,
  rowPaddingBottom: 3,
  labelSize: 6.1,
  valueSize: 6.25,
  unitSize: 5.9,
  continuationSuffix: ' (Fortsetzung)',
  keepTogetherRows: 2,
  maxRowsPerChunk: 250
});

export function authorityColumnModel(width) {
  const safeWidth = Math.max(240, Number(width) || 0);
  const label = Math.max(120, safeWidth * 0.48);
  const unit = Math.max(34, safeWidth * 0.12);
  return Object.freeze({ label, value: safeWidth - label - unit, unit, align: Object.freeze(['left', 'right', 'right']) });
}

export function authorityRowHeight(row = [], columns = authorityColumnModel(480), tokens = AUTHORITY_TABLE_TOKENS) {
  const labelLines = splitPdfText(sanitizeText(row[0] || '—'), columns.label - 8, tokens.labelSize).length;
  const valueLines = splitPdfText(sanitizeText(row[1] || '—'), columns.value - 8, tokens.valueSize).length;
  const unitLines = splitPdfText(sanitizeText(row[2] || ''), columns.unit - 6, tokens.unitSize).length;
  const lines = Math.max(1, labelLines, valueLines, unitLines);
  return Math.max(tokens.rowMinHeight, lines * Math.max(tokens.labelSize, tokens.valueSize) * 1.2 + tokens.rowPaddingTop + tokens.rowPaddingBottom);
}

export function createAuthorityTable(section = {}) {
  const rows = Array.isArray(section.rows) ? section.rows.filter(row => Array.isArray(row) && row.some(cell => sanitizeText(cell))) : [];
  return Object.freeze({
    title: sanitizeText(section.title || 'Abschnitt'),
    headers: Object.freeze(['Bezeichnung', 'Wert', 'Einheit']),
    rows: Object.freeze(rows.map(row => Object.freeze([sanitizeText(row[0]), sanitizeText(row[1]), sanitizeText(row[2])]))),
    repeatHeader: true,
    keepTogether: section.keepTogether !== false,
    highlight: section.highlight || 'none',
    role: section.role || 'authority-table'
  });
}

export default { AUTHORITY_TABLE_LAYOUT_VERSION, AUTHORITY_TABLE_TOKENS, authorityColumnModel, authorityRowHeight, createAuthorityTable };
