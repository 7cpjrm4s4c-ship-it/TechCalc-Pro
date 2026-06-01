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

export function renderResultModel(model = {}, accent = 'blue') {
  const cards = [];
  const primaryCard = model.primary || model.primaryCard;
  if (primaryCard) {
    cards.push(renderPrimaryResultCard(
      primaryCard.title || 'Ergebnis',
      primaryCard.primary || {},
      primaryCard.rows || [],
      primaryCard.accent || accent
    ));
  }
  for (const section of Array.isArray(model.sections) ? model.sections : []) {
    cards.push(renderDetailResultCard(section.title || 'Details', section.rows || [], section.accent || accent));
  }
  for (const notice of Array.isArray(model.notices) ? model.notices : []) {
    cards.push(renderNoticeCard(notice.title || 'Hinweise', notice.messages || [], {
      accent: notice.accent || accent,
      prefix: notice.prefix || 'Hinweis'
    }));
  }
  return cards.join('');
}
