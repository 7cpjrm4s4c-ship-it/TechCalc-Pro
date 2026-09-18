import { AUTHORITY_TABLE_TOKENS, authorityColumnModel, authorityRowHeight, createAuthorityTable } from './authorityTableLayout.js';

export function paginateAuthorityTable(section = {}, { contentHeight = 700, width = 480, tokens = AUTHORITY_TABLE_TOKENS } = {}) {
  const table = createAuthorityTable(section);
  const columns = authorityColumnModel(width);
  const heights = table.rows.map(row => authorityRowHeight(row, columns, tokens));
  const pages = [];
  let index = 0;
  let continued = false;
  while (index < table.rows.length || (!table.rows.length && pages.length === 0)) {
    const available = Math.max(tokens.rowMinHeight, contentHeight - tokens.headerHeight);
    let used = 0;
    let end = index;
    while (end < table.rows.length && end - index < tokens.maxRowsPerChunk) {
      const next = heights[end];
      if (end > index && used + next > available) break;
      used += next;
      end += 1;
    }
    if (table.keepTogether && !continued && table.rows.length <= tokens.keepTogetherRows && used > available) end = table.rows.length;
    pages.push(Object.freeze({
      title: continued ? `${table.title}${tokens.continuationSuffix}` : table.title,
      headers: table.headers,
      repeatHeader: true,
      rowStart: index,
      rowEnd: end,
      rows: Object.freeze(table.rows.slice(index, end)),
      rowHeights: Object.freeze(heights.slice(index, end)),
      usedHeight: tokens.headerHeight + used,
      continued,
      highlight: table.highlight
    }));
    if (end >= table.rows.length) break;
    index = end;
    continued = true;
  }
  return Object.freeze(pages);
}

export function paginateAuthoritySections(sections = [], options = {}) {
  return Object.freeze(sections.flatMap(section => paginateAuthorityTable(section, options)));
}

export default { paginateAuthorityTable, paginateAuthoritySections };
