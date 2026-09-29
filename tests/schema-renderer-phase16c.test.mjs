import assert from 'node:assert/strict';
import { defineFormSchema, FIELD_TYPES, renderFormSchema, renderResultSchema } from '../core/ui/formSchema.js';
import { createSchemaView } from '../core/ui/schemaRenderer.js';
import { field as renderField, segmented } from '../core/ui/renderer.js';

const compoundChoices = segmented('target', [{ value: 'mass', label: 'ṁ Massenstrom' }, { value: 'volume', label: 'V̇ Volumenstrom' }], 'mass');
assert.match(compoundChoices, /aria-label="ṁ Massenstrom"[^>]*>ṁ Massen\u00adstrom<\/button>/, 'mass flow keeps its spoken name and breaks before strom');
assert.match(compoundChoices, /aria-label="V̇ Volumenstrom"[^>]*><span class="tc-flow-symbol"><span aria-hidden="true">V<\/span><span class="visually-hidden">V̇<\/span><\/span> Volumen\u00adstrom<\/button>/, 'volume flow keeps its spoken name and centers the dot');

const volumeFieldHtml = renderField({ id: 'volumeFlow', label: 'Volumenstrom V̇', unit: 'm³/h' });
assert.match(volumeFieldHtml, /<label for="volumeFlow">Volumenstrom <span class="tc-flow-symbol"><span aria-hidden="true">V<\/span><span class="visually-hidden">V̇<\/span><\/span><\/label>/, 'field label renders centered dot with accessible symbol');

const unitFieldHtml = renderField({ id: 'massFlow', label: 'Massenstrom', unit: 'kg/h', unitField: 'massFlowUnit', unitOptions: [{ value: 'kg/h', label: 'kg/h' }] });
assert.match(unitFieldHtml, /<select class="unit unit-select" name="massFlowUnit"/, 'unit selectors need a stable form name');

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
assert.match(html, /<span class="tc-field__label">Betrieb<\/span><div class="segmented[^>]*role="group" aria-label="Betrieb"/, 'segment headings must not be orphaned form labels');
assert.doesNotMatch(html, /<label>Betrieb<\/label>/, 'segment headings must not render unassociated labels');
assert.match(html, /data-field="flow"/, 'number inputs must expose central data-field markers');
assert.match(html, /data-field="system"/, 'selects must expose central data-field markers');
assert.match(html, /data-lookup="true"/, 'selects must default to lookup hydration');
assert.doesNotMatch(html, /nur Kälte/, 'visibleWhen must hide fields that do not match state');

const coolingHtml = renderFormSchema(schema, { mode: 'cooling', flow: 25, system: 'b' });
assert.match(coolingHtml, /nur Kälte/, 'visibleWhen must render matching readonly fields');
assert.match(coolingHtml, /<span class="tc-field__label">Kältehinweis<\/span>/, 'readonly headings must not render unassociated labels');

const results = renderResultSchema([
  { title: 'Ergebnis', rows: [{ key: 'power', label: 'Leistung', unit: 'kW' }, { stateKey: 'flow', label: 'Volumenstrom', unit: 'm³/h' }] }
], { power: 10 }, { state: { flow: 25 }, accent: 'cyan' });
assert.match(results, /Leistung/, 'result schema must render calculation rows');
assert.match(results, /Volumenstrom/, 'result schema must resolve state rows');

const view = createSchemaView({ config: { accent: 'cyan' }, schema, calculate: state => ({ power: Number(state.flow || 0) * 2 }), results: [{ title: 'Ergebnis', rows: [{ key: 'power', label: 'Leistung' }] }] });
assert.match(view({ flow: 5, mode: 'heating', system: 'a' }), /10/, 'createSchemaView must combine form and result rendering');

console.log('phase16c schema renderer ok');
