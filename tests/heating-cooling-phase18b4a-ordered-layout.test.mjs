import fs from 'node:fs';
import assert from 'node:assert/strict';

const schemaSource = fs.readFileSync('js/modules/heating-cooling/schema.js', 'utf8');
const moduleSource = fs.readFileSync('js/modules/heating-cooling/index.js', 'utf8');
const configSource = fs.readFileSync('js/modules/heating-cooling/config.js', 'utf8');

assert.match(schemaSource, /layout:\s*\{[\s\S]*order:\s*\['medium', 'operatingMode', 'activeInputs', 'result', 'recommendation', 'lineSections'\]/, 'heating/cooling schema must declare the ordered card layout contract.');
assert.match(schemaSource, /title:\s*'Medium'/, 'heating/cooling schema must expose Medium as its first logical card.');
assert.match(schemaSource, /title:\s*'Betriebsart'/, 'heating/cooling schema must keep Betriebsart as a separate card.');
assert.doesNotMatch(schemaSource, /title:\s*'System'/, 'heating/cooling must not fall back to the generic System card layout.');
assert.match(schemaSource, /visibleWhen:\s*state\s*=>\s*state\.mode !== 'cooling'/, 'heating inputs must be visible only in heating mode.');
assert.match(schemaSource, /visibleWhen:\s*state\s*=>\s*state\.mode === 'cooling'/, 'cooling inputs must be visible only in cooling mode.');

const mediumIndex = moduleSource.indexOf("card('Medium'");
const modeIndex = moduleSource.indexOf("card('Betriebsart'");
const inputIndex = moduleSource.indexOf("card(`${modeLabel} — Eingaben`");
const resultIndex = moduleSource.indexOf('data-hc-dynamic="result"');
const recommendationIndex = moduleSource.indexOf('data-hc-dynamic="pipe-recommendation"');
const lineIndex = moduleSource.indexOf('lineSectionController.renderCard');
assert.ok(mediumIndex >= 0 && modeIndex > mediumIndex && inputIndex > modeIndex && resultIndex > inputIndex, 'custom view must keep Medium → Betriebsart → Eingaben → Ergebnis order.');
assert.ok(recommendationIndex > resultIndex && lineIndex > recommendationIndex, 'custom view must keep Ergebnis → Rohrdimensionsempfehlung → Leitungsabschnitte order.');
assert.match(configSource, /phase-18b4a-ordered-card-layout/, 'module migration status must record Phase 18B.4A.');

console.log('heating-cooling phase18b4a ordered-layout regression ok');
