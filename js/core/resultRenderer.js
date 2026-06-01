import { card, mainResult, resultRows, esc } from './renderer.js';

function normalizeRows(rows = []) {
  return (Array.isArray(rows) ? rows : [])
    .filter(Boolean)
    .map(row => ({
      label: row.label || '',
      value: row.value ?? '—',
      unit: row.unit || ''
    }));
}

export function renderPrimaryResultCard(title, primary = {}, rows = [], accent = 'blue') {
  return mainResult(title, primary, normalizeRows(rows), accent);
}

export function renderDetailResultCard(title, rows = [], accent = 'blue') {
  return card(title, resultRows(normalizeRows(rows)), accent);
}

export function renderNoticeCard(title, messages = [], { accent = 'blue', prefix = 'Hinweis' } = {}) {
  const list = (Array.isArray(messages) ? messages : [messages]).filter(Boolean);
  const body = list.map(text => `<div class="tc-warning"><span>${esc(prefix)}: </span><strong>${esc(text)}</strong></div>`).join('');
  return card(title, body, accent);
}
