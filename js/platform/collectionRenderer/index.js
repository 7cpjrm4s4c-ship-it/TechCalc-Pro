import { esc } from '../../core/renderer.js';

const resolve = (value, state = {}, fallback = undefined, context = {}) => typeof value === 'function' ? value(state, context) : value ?? fallback;

export function renderCollectionEmpty({ collection = '', emptyText = 'Noch keine Einträge vorhanden.' } = {}) {
  return `<div class="empty-state empty-state--compact" data-schema-collection="${esc(collection)}">${esc(emptyText)}</div>`;
}

export function renderCollectionItem(item = {}, definition = {}, collection = '') {
  const id = item.id ?? item.key ?? '';
  const title = item.title ?? item.name ?? item.typeId ?? 'Eintrag';
  const subtitle = item.subtitle ?? '';
  const qty = item.quantity ?? item.qty ?? '';
  const qtyLabel = definition.quantityLabel || 'Anzahl';
  const qtyUnit = definition.quantityUnit || '';
  const deleteLabel = definition.deleteLabel || 'Eintrag entfernen';
  const editLabel = definition.editLabel || 'Eintrag bearbeiten';
  const editableQuantity = definition.editableQuantity !== false;
  const editable = definition.editable === true;
  const deletable = definition.deletable !== false;
  const editCollection = definition.editCollection || `${collection}Edit`;
  const editAction = definition.editAction || 'platform:collection:add';
  const qtyHtml = editableQuantity ? `<label class="mini-edit-field tc-quantity-field"><span>${esc(qtyLabel)}</span><input type="number" min="0" step="any" value="${esc(qty)}" data-collection-input="${esc(collection)}" data-collection-field="quantity" data-collection-id="${esc(id)}" inputmode="decimal">${qtyUnit ? `<small>${esc(qtyUnit)}</small>` : ''}</label>` : '';
  const editHtml = editable ? `<button type="button" data-tc-action="${esc(editAction)}" data-collection="${esc(editCollection)}" data-collection-id="${esc(id)}" aria-label="${esc(editLabel)}">✎</button>` : '';
  const deleteHtml = deletable ? `<button type="button" data-tc-action="platform:collection:delete" data-collection="${esc(collection)}" data-collection-id="${esc(id)}" aria-label="${esc(deleteLabel)}">×</button>` : '';
  return `<div class="tc-collection-row tc-consumer-row tc-consumer-row--editable" data-collection-row="${esc(collection)}" data-record-id="${esc(id)}"><div class="tc-collection-row__content"><strong>${esc(title)}</strong>${subtitle ? `<span>${esc(subtitle)}</span>` : ''}</div>${qtyHtml}${editHtml}${deleteHtml}</div>`;
}

export function renderCollection(definition = {}, state = {}, context = {}) {
  const collection = definition.collection || definition.key;
  let items = resolve(definition.items, state, [], context) || [];
  if (!items.length && Array.isArray(state[collection]) && state[collection].length) items = state[collection];
  const emptyText = resolve(definition.emptyText, state, 'Noch keine Einträge vorhanden.', context);
  if (!items.length) return renderCollectionEmpty({ collection, emptyText });
  return `<div class="tc-collection-list tc-consumer-list" data-schema-collection="${esc(collection)}">${items.map(item => renderCollectionItem(item, definition, collection)).join('')}</div>`;
}

export default { renderCollection, renderCollectionItem, renderCollectionEmpty };
