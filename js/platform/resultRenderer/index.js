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

export function renderResultGroup({ title = 'Details', rows = [], groups = [], accent = 'blue' } = {}) {
  const nested = list(groups).map(group => renderResultGroup({ accent, ...group })).join('');
  const table = rows?.length ? renderResultTable(rows) : '';
  return card(title, `${table}${nested}`, accent);
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
  renderResultModel
};
