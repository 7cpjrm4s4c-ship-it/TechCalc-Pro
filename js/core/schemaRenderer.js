import { esc, card, grid, resultRows, segmented, inlineStats } from './renderer.js';
import { renderCollection as renderPlatformCollection } from '../platform/collectionRenderer/index.js';
import { numberService } from './numberService.js';


const FIELD_TYPES = Object.freeze({
  TEXT: 'text',
  DECIMAL: 'decimal',
  INTEGER: 'integer',
  SELECT: 'select',
  SEGMENT: 'segment',
  READONLY: 'readonly',
  BOOLEAN: 'boolean',
  CUSTOM: 'custom',
  NOTICE: 'notice',
  STATS: 'stats',
  ACTION: 'action',
  COLLECTION: 'collection'
});

const FIELD_TYPE_TO_INPUTMODE = Object.freeze({
  [FIELD_TYPES.INTEGER]: 'numeric',
  [FIELD_TYPES.DECIMAL]: 'decimal',
  [FIELD_TYPES.TEXT]: 'text'
});

function isVisible(def, state = {}) {
  if (typeof def.visibleWhen === 'function') return Boolean(def.visibleWhen(state));
  if (!def.visibleWhen || typeof def.visibleWhen !== 'object') return true;
  return Object.entries(def.visibleWhen).every(([key, expected]) => state?.[key] === expected);
}

function fieldValue(def, state = {}) {
  const raw = state?.[def.key] ?? def.default ?? '';
  if (typeof def.format === 'function') return def.format(raw, state);
  if (def.type === FIELD_TYPES.DECIMAL || def.type === FIELD_TYPES.INTEGER) return numberService.toInput(raw);
  return raw;
}

function resolve(value, state = {}, fallback = undefined) {
  return typeof value === 'function' ? value(state) : value ?? fallback;
}

function optionLabel(option = {}) {
  return option.label ?? option.name ?? option.value ?? '';
}

function fieldLabel(def, state = {}) {
  return resolve(def.label, state, def.key || '');
}

function fieldOptions(def, state = {}) {
  return resolve(def.options, state, []) || [];
}

function fieldUnit(def, state = {}) {
  return resolve(def.unit, state, '');
}

function attrs(attributes = {}) {
  return Object.entries(attributes || {})
    .filter(([, value]) => value !== false && value !== undefined && value !== null)
    .map(([key, value]) => value === true ? ` ${esc(key)}` : ` ${esc(key)}="${esc(value)}"`)
    .join('');
}

function renderSelect(def, state = {}) {
  const value = String(state?.[def.key] ?? def.default ?? '');
  const options = fieldOptions(def, state).map(option => {
    const optionValue = String(option.value ?? '');
    return `<option value="${esc(optionValue)}" ${optionValue === value ? 'selected' : ''}>${esc(optionLabel(option))}</option>`;
  }).join('');
  const extra = attrs({
    'data-field': def.key,
    'data-schema-field': def.key,
    'data-commit': def.commit || 'immediate',
    'data-lookup': def.lookup === false ? null : 'true',
    'data-render': def.render || null,
    disabled: def.disabled === true
  });
  return `<div class="field tc-field" data-schema-field-wrapper="${esc(def.key)}"><label for="${esc(def.key)}">${esc(fieldLabel(def, state))}</label><div class="control"><select id="${esc(def.key)}"${extra}>${options}</select></div></div>`;
}

function renderSegment(def, state = {}) {
  const value = resolve(def.value, state, state?.[def.key] ?? def.default ?? '');
  return `<div class="field field--segment tc-field" data-schema-field-wrapper="${esc(def.key)}"><label>${esc(fieldLabel(def, state))}</label>${segmented(def.key, fieldOptions(def, state), value, { accent: def.accent, action: def.action })}</div>`;
}

function renderReadonly(def, state = {}) {
  const value = typeof def.value === 'function' ? def.value(state) : fieldValue(def, state);
  const unit = fieldUnit(def, state);
  return `<div class="field field--readonly tc-field" data-schema-field-wrapper="${esc(def.key)}"><label>${esc(fieldLabel(def, state))}</label><div class="control"><output data-schema-output="${esc(def.key)}">${esc(value || '—')}</output>${unit ? `<span class="unit">${esc(unit)}</span>` : ''}</div></div>`;
}

function renderBoolean(def, state = {}) {
  const checked = Boolean(state?.[def.key] ?? def.default);
  return `<div class="field field--boolean tc-field" data-schema-field-wrapper="${esc(def.key)}"><label class="tc-checkbox"><input type="checkbox" data-field="${esc(def.key)}" data-schema-field="${esc(def.key)}" data-commit="immediate" ${checked ? 'checked' : ''}> <span>${esc(fieldLabel(def, state))}</span></label></div>`;
}


function renderNotice(def, state = {}) {
  const text = resolve(def.text, state, '');
  if (!text) return '';
  const tone = resolve(def.tone, state, 'compact');
  const modifier = tone ? ` empty-state--${esc(tone)}` : '';
  return `<div class="empty-state${modifier}" data-schema-notice="${esc(def.key)}">${esc(text)}</div>`;
}

function renderStats(def, state = {}) {
  const items = resolve(def.items, state, []) || [];
  if (!items.length) return '';
  return inlineStats(items.map(item => ({
    label: resolve(item.label, state, ''),
    value: resolve(item.value, state, '—'),
    unit: resolve(item.unit, state, '')
  })));
}

function renderGroupAction(action = {}, state = {}) {
  const href = resolve(action.href, state, '');
  const label = resolve(action.label, state, '');
  if (!href || !label) return '';
  const classes = ['action-button', `action-button--${action.variant || 'secondary'}`, 'tc-action-link']
    .concat(action.classes || [])
    .filter(Boolean)
    .join(' ');
  return `<a class="${esc(classes)}" href="${esc(href)}" target="${action.target ? esc(action.target) : '_blank'}" rel="${esc(action.rel || 'noopener')}">${esc(label)}</a>`;
}

function renderGroupActions(group = {}, state = {}) {
  const actions = Array.isArray(group.actions) ? group.actions : [];
  return actions.map(action => renderGroupAction(action, state)).filter(Boolean).join('');
}


function renderAction(def, state = {}) {
  const label = resolve(def.text || def.buttonLabel || def.label, state, 'Ausführen');
  const action = resolve(def.action, state, def.collection ? 'platform:collection:add' : 'platform:action');
  const variant = resolve(def.variant, state, 'secondary');
  const disabled = resolve(def.disabled, state, false) === true;
  const extra = attrs({
    'data-tc-action': action,
    'data-collection': def.collection || null
  });
  return `<div class="tc-action-row" data-schema-action="${esc(def.key)}"><button type="button" class="action-button action-button--${esc(variant)}"${extra} ${disabled ? 'disabled' : ''}>${esc(label)}</button></div>`;
}

function renderCollection(def, state = {}, context = {}) {
  // Phase 17B.1 contract: renderPlatformCollection(def, state)
  return renderPlatformCollection(def, state, context);
}


function renderInput(def, state = {}) {
  const type = def.htmlType || 'text';
  const inputmode = def.inputmode || FIELD_TYPE_TO_INPUTMODE[def.type || FIELD_TYPES.TEXT] || 'text';
  const value = fieldValue(def, state);
  const unit = fieldUnit(def, state);
  const unitHtml = unit ? `<span class="unit">${esc(unit)}</span>` : '';
  const extra = attrs({
    'data-field': def.key,
    'data-schema-field': def.key,
    'data-commit': def.commit || null,
    'data-render': def.render || null,
    disabled: def.disabled === true,
    readonly: resolve(def.readonly, state, false) === true,
    'aria-readonly': def.readonly === true ? 'true' : null,
    autocomplete: 'off'
  });
  return `<div class="field tc-field" data-schema-field-wrapper="${esc(def.key)}"><label for="${esc(def.key)}">${esc(fieldLabel(def, state))}</label><div class="control"><input id="${esc(def.key)}" type="${esc(type)}" inputmode="${esc(inputmode)}" value="${esc(value ?? '')}" placeholder="${esc(resolve(def.placeholder, state, def.type === FIELD_TYPES.TEXT ? '' : '0'))}"${extra}>${unitHtml}</div></div>`;
}

export function renderSchemaField(def, state = {}, context = {}) {
  if (!isVisible(def, state)) return '';
  const type = def.type || FIELD_TYPES.TEXT;
  if (type === FIELD_TYPES.NOTICE || type === 'notice') return renderNotice(def, state);
  if (type === FIELD_TYPES.STATS || type === 'stats') return renderStats(def, state);
  if (type === FIELD_TYPES.ACTION || type === 'action') return renderAction(def, state);
  if (type === FIELD_TYPES.COLLECTION || type === 'collection') return renderCollection(def, state, context);
  if (type === FIELD_TYPES.CUSTOM || type === 'custom') return typeof def.render === 'function' ? def.render(state) : String(def.html || '');
  if (type === FIELD_TYPES.SELECT) return renderSelect(def, state);
  if (type === FIELD_TYPES.SEGMENT) return renderSegment(def, state);
  if (type === FIELD_TYPES.BOOLEAN) return renderBoolean(def, state);
  if (type === FIELD_TYPES.READONLY) return renderReadonly(def, state);
  return renderInput(def, state);
}

export function renderSchemaForm(schema = {}, state = {}, options = {}) {
  const fieldMap = new Map((schema.fields || []).map(def => [def.key, def]));
  const fallback = { title: options.title || 'Eingaben', fields: (schema.fields || []).map(def => def.key), columns: 2 };
  const groups = Array.isArray(schema.groups) && schema.groups.length ? schema.groups : [fallback];
  return groups.map(group => {
    const body = (group.fields || [])
      .map(key => fieldMap.get(key))
      .filter(Boolean)
      .map(def => renderSchemaField(def, state, { result: options.result || {}, schema, group }))
      .filter(Boolean)
      .join('');
    const beforeHtml = typeof group.beforeHtml === 'function' ? group.beforeHtml(state) : group.beforeHtml || '';
    const actionHtml = renderGroupActions(group, state);
    const afterHtml = typeof group.afterHtml === 'function' ? group.afterHtml(state) : group.afterHtml || '';
    const content = [beforeHtml, grid(body, group.columns || 2), actionHtml, afterHtml].filter(Boolean).join('');
    if (!content && group.hideWhenEmpty !== false) return '';
    return card(group.title || options.title || 'Eingaben', content, group.accent || options.accent || 'blue');
  }).filter(Boolean).join('');
}

function resolveResultValue(row = {}, result = {}, state = {}) {
  if (typeof row.value === 'function') return row.value(result, state);
  if (row.key && result?.[row.key] !== undefined) return result[row.key];
  if (row.stateKey && state?.[row.stateKey] !== undefined) return state[row.stateKey];
  return row.default ?? '—';
}

export function renderSchemaResults(resultSchema = [], result = {}, options = {}) {
  const state = options.state || {};
  return (resultSchema || []).map(section => {
    const rows = (section.rows || [])
      .filter(row => isVisible(row, { ...state, ...result }))
      .map(row => ({ label: row.label, value: resolveResultValue(row, result, state), unit: row.unit || '' }));
    if (!rows.length && section.hideWhenEmpty !== false) return '';
    return card(section.title || 'Ergebnis', resultRows(rows), section.accent || options.accent || 'blue');
  }).filter(Boolean).join('');
}

export function createSchemaView(definition = {}) {
  return function schemaView(snapshot = {}) {
    const result = typeof definition.calculate === 'function' ? definition.calculate(snapshot) : {};
    return [
      renderSchemaForm(definition.schema, snapshot, { accent: definition.config?.accent, title: definition.config?.title }),
      renderSchemaResults(definition.results, result, { accent: definition.config?.accent, state: snapshot })
    ].join('');
  };
}
