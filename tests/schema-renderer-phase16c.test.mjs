import assert from 'node:assert/strict';
import { defineFormSchema, FIELD_TYPES, renderFormSchema, renderResultSchema } from '../js/core/formSchema.js';
import { createSchemaView } from '../js/core/schemaRenderer.js';

const schema = defineFormSchema({
  fields: [
    { key: 'mode', label: 'Betrieb', type: FIELD_TYPES.SEGMENT, default: 'heating', options: [{ value: 'heating', label: 'Heizung' }, { value: 'cooling', label: 'Kälte' }] },
    { key: 'flow', label: 'Volumenstrom', type: FIELD_TYPES.DECIMAL, unit: 'm³/h', default: 12.5 },
    { key: 'system', label: 'System', type: FIELD_TYPES.SELECT, default: 'a', options: [{ value: 'a', label: 'System A' }, { value: 'b', label: 'System B' }] },
    { key: 'coolingNote', label: 'Kältehinweis', type: FIELD_TYPES.READONLY, value: () => 'nur Kälte', visibleWhen: { mode: 'cooling' } }
  ],
  groups: [{ title: 'Globales Schema', fields: ['mode', 'flow', 'system', 'coolingNote'], columns: 2 }]
});

const html = renderFormSchema(schema, { mode: 'heating', flow: 25, system: 'b' }, { accent: 'cyan' });
assert.match(html, /data-tc-action="segment"/, 'segments must use central event pipeline markers');
assert.match(html, /data-field="flow"/, 'number inputs must expose central data-field markers');
assert.match(html, /data-field="system"/, 'selects must expose central data-field markers');
assert.match(html, /data-lookup="true"/, 'selects must default to lookup hydration');
assert.doesNotMatch(html, /nur Kälte/, 'visibleWhen must hide fields that do not match state');

const coolingHtml = renderFormSchema(schema, { mode: 'cooling', flow: 25, system: 'b' });
assert.match(coolingHtml, /nur Kälte/, 'visibleWhen must render matching readonly fields');

const results = renderResultSchema([
  { title: 'Ergebnis', rows: [{ key: 'power', label: 'Leistung', unit: 'kW' }, { stateKey: 'flow', label: 'Volumenstrom', unit: 'm³/h' }] }
], { power: 10 }, { state: { flow: 25 }, accent: 'cyan' });
assert.match(results, /Leistung/, 'result schema must render calculation rows');
assert.match(results, /Volumenstrom/, 'result schema must resolve state rows');

const view = createSchemaView({ config: { accent: 'cyan' }, schema, calculate: state => ({ power: Number(state.flow || 0) * 2 }), results: [{ title: 'Ergebnis', rows: [{ key: 'power', label: 'Leistung' }] }] });
assert.match(view({ flow: 5, mode: 'heating', system: 'a' }), /10/, 'createSchemaView must combine form and result rendering');

console.log('phase16c schema renderer ok');
