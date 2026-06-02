
export const FIELD_TYPES = Object.freeze({
  TEXT: 'text',
  DECIMAL: 'decimal',
  INTEGER: 'integer',
  SELECT: 'select',
  SEGMENT: 'segment',
  READONLY: 'readonly',
  BOOLEAN: 'boolean',
  CUSTOM: 'custom',
  NOTICE: 'notice',
  STATS: 'stats'
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
    if ((type === FIELD_TYPES.SELECT || type === FIELD_TYPES.SEGMENT) && !Array.isArray(fieldDef.options) && typeof fieldDef.options !== 'function') {
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


export { renderSchemaField, renderSchemaForm as renderFormSchema, renderSchemaResults as renderResultSchema } from './schemaRenderer.js';
