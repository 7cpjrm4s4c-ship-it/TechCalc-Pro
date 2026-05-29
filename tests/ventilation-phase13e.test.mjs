import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('js/modules/ventilation/index.js', 'utf8');

assert.match(source, /function temperatureFields\(s, active\)/, 'ventilation must render temperature inputs through a dedicated dynamic block.');
assert.match(source, /data-vent-dynamic="temperatures"/, 'temperature inputs must have a dynamic render anchor.');
assert.match(source, /setInner\(root, '\[data-vent-dynamic="temperatures"\]', temperatureFields\(s, active\)\)/, 'mode changes must rerender temperature fields with the active mode keys.');
assert.match(source, /setInputValue\(root, key\(s, 'SupplyTemp'\), fmtInput\(active\.supplyTemp, 2\)\)/, 'temperature fields must be refreshed from active store state.');
assert.match(source, /setInputValue\(root, key\(s, 'RoomTemp'\), fmtInput\(active\.roomTemp, 2\)\)/, 'room temperature field must be refreshed from active store state.');

console.log('ventilation phase13e mode temperature render regression ok');
