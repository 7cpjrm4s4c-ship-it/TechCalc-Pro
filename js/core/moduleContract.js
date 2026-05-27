import { esc, card, grid, field, selectField, resultRows, renderModuleShell } from './renderer.js';
import { numberService } from './numberService.js';

const FIELD_TYPES = new Set(['text', 'decimal', 'integer', 'select', 'segment', 'readonly']);

export function normalizeModuleDefinition(definition = {}) {
  const config = definition.config || definition;
  if (!config.id) throw new Error('Module contract: id fehlt.');
  if (!config.title) throw new Error(`Module contract: title fehlt (${config.id}).`);
  if (typeof definition.calculate !== 'function') throw new Error(`Module contract: calculate(state) fehlt (${config.id}).`);
  return Object.freeze({
    id: config.id,
    title: config.title,
    shortTitle: config.shortTitle || config.title,
    accent: config.accent || 'blue',
    schema: Object.freeze(definition.schema || {}),
    initialState: Object.freeze(definition.initialState || {}),
    calculate: definition.calculate,
    results: Object.freeze(definition.results || [])
  });
}

export function validateSchema(schema = {}) {
  const fields = Array.isArray(schema.fields) ? schema.fields : [];
  fields.forEach(fieldDef => {
    if (!fieldDef.key) throw new Error('Schema field ohne key.');
    if (!fieldDef.label) throw new Error(`Schema field ohne label: ${fieldDef.key}`);
    if (!FIELD_TYPES.has(fieldDef.type || 'text')) throw new Error(`Unbekannter Feldtyp: ${fieldDef.type}`);
  });
  return true;
}

export function readSchemaDefaults(schema = {}) {
  return (schema.fields || []).reduce((acc, item) => {
    if (item.default !== undefined) acc[item.key] = item.default;
    return acc;
  }, {});
}

function renderField(def, state) {
  const value = state?.[def.key] ?? def.default ?? '';
  if (def.type === 'select') return selectField({ id: def.key, label: def.label, value, options: def.options || [] });
  if (def.type === 'readonly') {
    return `<div class="field field--readonly"><label>${esc(def.label)}</label><div class="control"><output>${esc(value || '—')}</output>${def.unit ? `<span class="unit">${esc(def.unit)}</span>` : ''}</div></div>`;
  }
  return field({
    id: def.key,
    label: def.label,
    value: def.type === 'decimal' || def.type === 'integer' ? numberService.toInput(value) : value,
    unit: def.unit || '',
    placeholder: def.placeholder || '0',
    type: 'text',
    inputmode: def.type === 'integer' ? 'numeric' : def.type === 'decimal' ? 'decimal' : 'text',
    disabled: def.disabled === true
  });
}

export function renderSchemaForm(schema = {}, state = {}, { title = 'Eingaben', accent = 'blue' } = {}) {
  validateSchema(schema);
  const groups = Array.isArray(schema.groups) && schema.groups.length ? schema.groups : [{ title, fields: (schema.fields || []).map(f => f.key) }];
  const fieldsByKey = new Map((schema.fields || []).map(item => [item.key, item]));
  return groups.map(group => {
    const fields = (group.fields || []).map(key => fieldsByKey.get(key)).filter(Boolean).map(def => renderField(def, state));
    return card(group.title || title, grid(fields.join(''), group.columns || 2), group.accent || accent);
  }).join('');
}

export function renderSchemaResults(resultSchema = [], result = {}, { accent = 'blue' } = {}) {
  return (resultSchema || []).map(section => {
    const rows = (section.rows || []).map(row => ({
      label: row.label,
      value: typeof row.value === 'function' ? row.value(result) : result[row.key],
      unit: row.unit || ''
    }));
    return card(section.title || 'Ergebnis', resultRows(rows), section.accent || accent);
  }).join('');
}

export function renderContractModule(definition, state) {
  const module = normalizeModuleDefinition(definition);
  const result = module.calculate(state || {});
  const inner = [
    renderSchemaForm(module.schema, state, { title: 'Eingaben', accent: module.accent }),
    renderSchemaResults(module.results, result, { accent: module.accent })
  ].join('');
  return renderModuleShell(module, inner);
}
