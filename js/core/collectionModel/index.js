export function collectionKey(record = {}, keys = []) {
  return keys.map(key => record?.[key] ?? '').join('|');
}

export function upsertCollectionRecord(items = [], record = {}, {
  keyFields = ['id'],
  merge = null
} = {}) {
  const targetKey = collectionKey(record, keyFields);
  let merged = false;
  const nextItems = (items || []).map(item => {
    if (collectionKey(item, keyFields) !== targetKey) return item;
    merged = true;
    return typeof merge === 'function' ? merge(item, record) : { ...item, ...record };
  });
  return merged ? nextItems : [...nextItems, record];
}

export function patchCollectionItem(items = [], id, patch = {}) {
  return (items || []).map(item => String(item.id) === String(id) ? { ...item, ...patch } : item);
}

export function deleteCollectionItem(items = [], id) {
  return (items || []).filter(item => String(item.id) !== String(id));
}
