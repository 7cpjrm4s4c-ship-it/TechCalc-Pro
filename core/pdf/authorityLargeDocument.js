import { paginateAuthoritySections } from './authorityPagination.js';
import { authorityHeaderForPage } from './authorityHeaderPolicy.js';
import { decorateAuthorityRows } from './authorityHighlightPolicy.js';

export const AUTHORITY_LARGE_DOCUMENT_LIMITS = Object.freeze({
  warningRows: 500,
  hardRows: 5000,
  maxRowsPerChunk: 250
});

export function prepareAuthorityDocument(sections = [], options = {}) {
  const totalRows = sections.reduce((sum, section) => sum + (Array.isArray(section.rows) ? section.rows.length : 0), 0);
  if (totalRows > AUTHORITY_LARGE_DOCUMENT_LIMITS.hardRows) {
    throw new RangeError(`Behördenbericht überschreitet das unterstützte Limit von ${AUTHORITY_LARGE_DOCUMENT_LIMITS.hardRows} Tabellenzeilen.`);
  }
  const pages = paginateAuthoritySections(sections, options).map(page => Object.freeze({
    ...page,
    header: authorityHeaderForPage(page),
    decoratedRows: decorateAuthorityRows(page.rows)
  }));
  return Object.freeze({
    totalRows,
    largeDocument: totalRows >= AUTHORITY_LARGE_DOCUMENT_LIMITS.warningRows,
    pageCount: pages.length,
    pages: Object.freeze(pages)
  });
}

export default { AUTHORITY_LARGE_DOCUMENT_LIMITS, prepareAuthorityDocument };
