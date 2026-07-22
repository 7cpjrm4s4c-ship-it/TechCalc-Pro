import { sanitizeText } from './pdfText.js';

export const AUTHORITY_HEADER_LABELS = Object.freeze(['Bezeichnung', 'Wert', 'Einheit']);

export function authorityHeaderForPage(page = {}) {
  return Object.freeze({
    title: sanitizeText(page.title || 'Abschnitt'),
    columns: AUTHORITY_HEADER_LABELS,
    repeat: page.repeatHeader !== false,
    continued: Boolean(page.continued),
    ariaRole: 'table-header'
  });
}

export function validateRepeatedHeaders(pages = []) {
  return pages.every(page => {
    const header = authorityHeaderForPage(page);
    if (!header.repeat || header.columns.length !== AUTHORITY_HEADER_LABELS.length) return false;
    if (!header.columns.every((column, index) => column === AUTHORITY_HEADER_LABELS[index])) return false;
    if (header.continued !== Boolean(page.continued)) return false;
    return !header.continued || /\(Fortsetzung\)$/.test(header.title);
  });
}

export default { AUTHORITY_HEADER_LABELS, authorityHeaderForPage, validateRepeatedHeaders };
