function omitKeys(source = {}, keys = []) {
  const copy = { ...source };
  keys.forEach(key => delete copy[key]);
  return copy;
}

export function createStateSnapshot({
  current = {},
  calculationResult = {},
  excludeKeys = [],
  name,
  resultMapper = null
} = {}) {
  const resolvedName = typeof name === 'function' ? name(current, calculationResult) : name;
  const mappedResult = typeof resultMapper === 'function' ? resultMapper(calculationResult, current) : resultMapper;
  return {
    name: resolvedName || current.name || 'Berechnung',
    state: omitKeys(current, excludeKeys),
    ...(mappedResult !== null && mappedResult !== undefined ? { result: mappedResult } : {})
  };
}

export function hydrateStateRecord(item = {}, { activeIdKey, nameKey = 'name' } = {}) {
  return {
    ...(item.state || {}),
    ...(activeIdKey ? { [activeIdKey]: item.id } : {}),
    ...(nameKey ? { [nameKey]: item.name || '' } : {})
  };
}
