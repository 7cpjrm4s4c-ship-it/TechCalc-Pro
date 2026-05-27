import { esc, card, grid, field, selectField, segmented, resultRows } from './renderer.js';
import { numberService } from './numberService.js';

export const FIELD_TYPES = Object.freeze({
  TEXT: 'text',
  DECIMAL: 'decimal',
  INTEGER: 'integer',
  SELECT: 'select',
  SEGMENT: 'segment',
  READONLY: 'readonly',
  BOOLEAN: 'boolean'
});

const ALLOWED_FIELD_TYPES = new Set(Object.values(FIELD_TYPES));

export function defineFormSchema(schema = {}) {
  validateFormSchema(schema);
  return Object.freeze({
    ...schema,
    fields: Object.freeze((schema.fields || []).map(field => Object.freeze({ ...field }))),
    groups: Object.freeze((schema.groups || []).map(group => Object.freeze({ ...group, fields: Object.freeze([...(group.fields || [])]) })))
  });
}

export function validateFormSchema(schema = {}) {
  if (!schema || typeof schema !== 'object') throw new Error('Form schema must be an object.');
  const fields = Array.isArray(schema.fields) ? schema.fields : [];
  const knownKeys = new Set();
  fields.forEach(fieldDef => {
    if (!fieldDef.key) throw new Error('Schema field without key.');
    if (knownKeys.has(fieldDef.key)) throw new Error(`Duplicate schema field: ${fieldDef.key}`);
    knownKeys.add(fieldDef.key);
    if (!fieldDef.label) throw new Error(`Schema field without label: ${fieldDef.key}`);
    const type = fieldDef.type || FIELD_TYPES.TEXT;
    if (!ALLOWED_FIELD_TYPES.has(type)) throw new Error(`Unknown schema field type: ${type}`);
    if ((type === FIELD_TYPES.SELECT || type === FIELD_TYPES.SEGMENT) && !Array.isArray(fieldDef.options)) {
      throw new Error(`Schema field needs options: ${fieldDef.key}`);
    }
  });
  (schema.groups || []).forEach(group => {
    (group.fields || []).forEach(key => {
      if (!knownKeys.has(key)) throw new Error(`Schema group references unknown field: ${key}`);
    });
  });
  return true;
}

export function readSchemaDefaults(schema = {}) {
  return (schema.fields || []).reduce((acc, fieldDef) => {
    if (fieldDef.default !== undefined) acc[fieldDef.key] = fieldDef.default;
    return acc;
  }, {});
}

function renderSchemaField(def, state = {}) {
  const value = state?.[def.key] ?? def.default ?? '';
  const type = def.type || FIELD_TYPES.TEXT;
  if (type === FIELD_TYPES.SELECT) {
    return selectField({ id: def.key, label: def.label, value, options: def.options || [] });
  }
  if (type === FIELD_TYPES.SEGMENT || type === FIELD_TYPES.BOOLEAN) {
    return `<div class="field field--segment"><label>${esc(def.label)}</label>${segmented(def.key, def.options || [], value, { accent: def.accent })}</div>`;
  }
  if (type === FIELD_TYPES.READONLY) {
    return `<div class="field field--readonly"><label>${esc(def.label)}</label><div class="control"><output>${esc(value || '—')}</output>${def.unit ? `<span class="unit">${esc(def.unit)}</span>` : ''}</div></div>`;
  }
  return field({
    id: def.key,
    label: def.label,
    value: type === FIELD_TYPES.DECIMAL || type === FIELD_TYPES.INTEGER ? numberService.toInput(value) : value,
    unit: def.unit || '',
    placeholder: def.placeholder || (type === FIELD_TYPES.TEXT ? '' : '0'),
    type: 'text',
    inputmode: type === FIELD_TYPES.INTEGER ? 'numeric' : type === FIELD_TYPES.DECIMAL ? 'decimal' : 'text',
    disabled: def.disabled === true
  });
}

export function renderFormSchema(schema = {}, state = {}, options = {}) {
  validateFormSchema(schema);
  const fieldsByKey = new Map((schema.fields || []).map(item => [item.key, item]));
  const fallbackGroup = { title: options.title || 'Eingaben', fields: (schema.fields || []).map(item => item.key), columns: 2 };
  const groups = Array.isArray(schema.groups) && schema.groups.length ? schema.groups : [fallbackGroup];
  return groups.map(group => {
    const fields = (group.fields || []).map(key => fieldsByKey.get(key)).filter(Boolean).map(def => renderSchemaField(def, state));
    return card(group.title || options.title || 'Eingaben', grid(fields.join(''), group.columns || 2), group.accent || options.accent || 'blue');
  }).join('');
}

export function renderResultSchema(resultSchema = [], result = {}, options = {}) {
  return (resultSchema || []).map(section => {
    const rows = (section.rows || []).map(row => ({
      label: row.label,
      value: typeof row.value === 'function' ? row.value(result) : result[row.key],
      unit: row.unit || ''
    }));
    return card(section.title || 'Ergebnis', resultRows(rows), section.accent || options.accent || 'blue');
  }).join('');
}
