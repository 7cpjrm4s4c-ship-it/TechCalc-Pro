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
  return pages.every((page, index) => {
    const header = authorityHeaderForPage(page);
    if (!header.repeat || header.columns.length !== 3) return false;
    return index === 0 || page.continued === true;
  });
}

export default { AUTHORITY_HEADER_LABELS, authorityHeaderForPage, validateRepeatedHeaders };
