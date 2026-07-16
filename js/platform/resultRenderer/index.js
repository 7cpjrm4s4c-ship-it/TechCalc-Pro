import { card, resultRows, esc } from '../../core/renderer.js';

function list(value) {
  return Array.isArray(value) ? value.filter(Boolean) : (value ? [value] : []);
}

function slug(value = '') {
  return String(value)
    .toLocaleLowerCase('de-DE')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeRow(row = {}) {
  if (Array.isArray(row)) return { label: row[0] || '', value: row[1] ?? '—', unit: row[2] || '' };
  return {
    label: row.label || row.title || '',
    value: row.value ?? row.result ?? '—',
    unit: row.unit || '',
    className: row.className || '',
    span: Number(row.span || 1)
  };
}

export function normalizeResultRows(rows = []) {
  return list(rows).map(normalizeRow);
}

function renderPrimaryDetails(rows = []) {
  return `<div class="inline-stats">${rows.map(row => {
    const classes = ['inline-stat'];
    if (row.className) classes.push(...String(row.className).split(/\s+/).filter(Boolean));
    if (row.span > 1) classes.push(`inline-stat--span-${Math.min(5, row.span)}`);
    return `<div class="${classes.map(esc).join(' ')}"><span>${esc(row.label)}</span><strong>${esc(row.value ?? '—')}${row.unit ? ` <small>${esc(row.unit)}</small>` : ''}</strong></div>`;
  }).join('')}</div>`;
}

export function renderResultCard({ title = 'Ergebnis', primary = null, rows = [], accent = 'blue' } = {}) {
  const normalizedRows = normalizeResultRows(rows);
  if (primary) {
    const body = `<div class="main-result"><span>${esc(primary.label || '')}</span><strong>${esc(primary.value ?? '—')}${primary.unit ? ` <small>${esc(primary.unit)}</small>` : ''}</strong></div>${renderPrimaryDetails(normalizedRows)}`;
    return card(title, body, accent);
  }
  return card(title, resultRows(normalizedRows), accent);
}

export function renderResultTable(rows = []) {
  const normalizedRows = normalizeResultRows(rows);
  return `<div class="result-list">${normalizedRows.map(row => {
    const classes = ['result-row'];
    if (row.className) classes.push(...String(row.className).split(/\s+/).filter(Boolean));
    return `<div class="${classes.map(esc).join(' ')}"><span>${esc(row.label)}</span><strong>${esc(row.value ?? '—')}${row.unit ? ` <small>${esc(row.unit)}</small>` : ''}</strong></div>`;
  }).join('')}</div>`;
}

export function renderResultGroup({ title = 'Details', rows = [], groups = [], html = '', bodyHtml = '', customHtml = '', accent = 'blue' } = {}) {
  const nested = list(groups).map(group => renderResultGroup({ accent, ...group })).join('');
  const table = rows?.length ? renderResultTable(rows) : '';
  const extraHtml = String(html || bodyHtml || customHtml || '');
  const groupSlug = slug(title);
  return card(title, `<div class="result-group result-group--${esc(groupSlug)}">${table}${extraHtml}${nested}</div>`, accent);
}

export function renderStatsGroup({ title = 'Details', rows = [], accent = 'blue', compact = false } = {}) {
  return card(title, renderResultTable(rows), accent, { compact });
}

export function renderRecommendationCard({ title = 'Empfehlung', primary = null, rows = [], emptyText = '', accent = 'blue', controlsHtml = '' } = {}) {
  const controls = controlsHtml ? String(controlsHtml) : '';
  const normalizedRows = normalizeResultRows(rows);
  const primaryHtml = primary
    ? `<div class="main-result"><span>${esc(primary.label || '')}</span><strong>${esc(primary.value ?? '—')}${primary.unit ? ` <small>${esc(primary.unit)}</small>` : ''}</strong></div>`
    : '';
  const body = emptyText
    ? `<div class="empty-state">${emptyText}</div>`
    : `${primaryHtml}${normalizedRows.length ? renderResultTable(normalizedRows) : ''}`;
  return card(title, `${controls}${body}`, accent);
}

export function renderNoticeCard({ title = 'Hinweise', messages = [], accent = 'blue', prefix = 'Hinweis' } = {}) {
  const body = list(messages)
    .map(message => {
      if (typeof message === 'object') {
        const text = message.text || message.message || '';
        const label = message.prefix || prefix;
        return text ? `<div class="tc-warning"><span>${esc(label)}: </span><strong>${esc(text)}</strong></div>` : '';
      }
      return `<div class="tc-warning"><span>${esc(prefix)}: </span><strong>${esc(message)}</strong></div>`;
    })
    .join('');
  return card(title, body, accent);
}

function normalizeModel(model = {}) {
  const groups = [
    ...list(model.groups),
    ...list(model.sections)
  ];
  const primary = model.primary || model.primaryCard || null;
  const calculations = list(model.calculations);
  const notices = list(model.notices);
  return { primary, groups, calculations, notices };
}

export function renderResultModel(model = {}, accent = 'blue') {
  const normalized = normalizeModel(model);
  const cards = [];

  if (normalized.primary) {
    cards.push(renderResultCard({ accent, ...normalized.primary }));
  }

  for (const group of normalized.groups) {
    cards.push(renderResultGroup({ accent, ...group }));
  }

  for (const calculation of normalized.calculations) {
    cards.push(renderResultGroup({ title: calculation.title || 'Berechnung', rows: calculation.rows || calculation, accent: calculation.accent || accent }));
  }

  for (const notice of normalized.notices) {
    cards.push(renderNoticeCard({ accent, ...notice }));
  }

  return cards.join('');
}

export default {
  renderResultCard,
  renderResultGroup,
  renderResultTable,
  renderNoticeCard,
  renderStatsGroup,
  renderRecommendationCard,
  renderResultModel
};
