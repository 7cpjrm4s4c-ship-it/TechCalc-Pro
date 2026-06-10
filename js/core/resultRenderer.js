import {
  normalizeResultRows,
  renderResultCard,
  renderResultGroup,
  renderResultTable,
  renderNoticeCard as platformRenderNoticeCard,
  renderResultModel as platformRenderResultModel
} from '../platform/resultRenderer/index.js';

export { normalizeResultRows, renderResultCard, renderResultGroup, renderResultTable };

export function renderPrimaryResultCard(title, primary = {}, rows = [], accent = 'blue') {
  return renderResultCard({ title, primary, rows, accent });
}

export function renderDetailResultCard(title, rows = [], accent = 'blue') {
  return renderResultGroup({ title, rows, accent });
}

export function renderNoticeCard(title, messages = [], { accent = 'blue', prefix = 'Hinweis' } = {}) {
  return platformRenderNoticeCard({ title, messages, accent, prefix });
}

export function renderResultModel(model = {}, accent = 'blue') {
  return platformRenderResultModel(model, accent);
}
