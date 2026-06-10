import { card, mainResult, resultRows, esc } from '../../core/renderer.js';

function list(value) {
  return Array.isArray(value) ? value.filter(Boolean) : (value ? [value] : []);
}

function normalizeRow(row = {}) {
  if (Array.isArray(row)) return { label: row[0] || '', value: row[1] ?? '—', unit: row[2] || '' };
  return {
    label: row.label || row.title || '',
    value: row.value ?? row.result ?? '—',
    unit: row.unit || ''
  };
}

export function normalizeResultRows(rows = []) {
  return list(rows).map(normalizeRow);
}

export function renderResultCard({ title = 'Ergebnis', primary = null, rows = [], accent = 'blue' } = {}) {
  if (primary) return mainResult(title, primary, normalizeResultRows(rows), accent);
  return card(title, resultRows(normalizeResultRows(rows)), accent);
}

export function renderResultTable(rows = []) {
  return resultRows(normalizeResultRows(rows));
}

export function renderResultGroup({ title = 'Details', rows = [], groups = [], html = '', bodyHtml = '', customHtml = '', accent = 'blue' } = {}) {
  const nested = list(groups).map(group => renderResultGroup({ accent, ...group })).join('');
  const table = rows?.length ? renderResultTable(rows) : '';
  const extraHtml = String(html || bodyHtml || customHtml || '');
  return card(title, `${table}${extraHtml}${nested}`, accent);
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
