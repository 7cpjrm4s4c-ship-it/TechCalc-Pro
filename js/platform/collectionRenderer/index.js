import { esc } from '../../core/renderer.js';

const resolve = (value, state = {}, fallback = undefined) => typeof value === 'function' ? value(state) : value ?? fallback;

export function renderCollectionEmpty({ collection = '', emptyText = 'Noch keine Einträge vorhanden.' } = {}) {
  return `<div class="empty-state empty-state--compact" data-schema-collection="${esc(collection)}">${esc(emptyText)}</div>`;
}

export function renderCollectionItem(item = {}, definition = {}, collection = '') {
  const id = item.id ?? item.key ?? '';
  const title = item.title ?? item.name ?? 'Eintrag';
  const subtitle = item.subtitle ?? '';
  const qty = item.quantity ?? item.qty ?? '';
  const qtyLabel = definition.quantityLabel || 'Anzahl';
  const qtyUnit = definition.quantityUnit || '';
  const deleteLabel = definition.deleteLabel || 'Eintrag entfernen';
  const editableQuantity = definition.editableQuantity !== false;
  const deletable = definition.deletable !== false;
  const qtyHtml = editableQuantity ? `<label class="mini-edit-field tc-quantity-field"><span>${esc(qtyLabel)}</span><input type="number" min="0" step="1" value="${esc(qty)}" data-collection-input="${esc(collection)}" data-collection-field="quantity" data-collection-id="${esc(id)}" inputmode="numeric">${qtyUnit ? `<small>${esc(qtyUnit)}</small>` : ''}</label>` : '';
  const deleteHtml = deletable ? `<button type="button" data-tc-action="platform:collection:delete" data-collection="${esc(collection)}" data-collection-id="${esc(id)}" aria-label="${esc(deleteLabel)}">×</button>` : '';
  return `<div class="tc-collection-row tc-consumer-row" data-collection-row="${esc(collection)}" data-record-id="${esc(id)}"><div><strong>${esc(title)}</strong>${subtitle ? `<span>${esc(subtitle)}</span>` : ''}</div>${qtyHtml}${deleteHtml}</div>`;
}

export function renderCollection(definition = {}, state = {}) {
  const collection = definition.collection || definition.key;
  const items = resolve(definition.items, state, []) || [];
  const emptyText = resolve(definition.emptyText, state, 'Noch keine Einträge vorhanden.');
  if (!items.length) return renderCollectionEmpty({ collection, emptyText });
  return `<div class="tc-collection-list tc-consumer-list" data-schema-collection="${esc(collection)}">${items.map(item => renderCollectionItem(item, definition, collection)).join('')}</div>`;
}

export default { renderCollection, renderCollectionItem, renderCollectionEmpty };
