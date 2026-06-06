import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('js/modules/ventilation/index.js', 'utf8');
const dynamicRendererSource = readFileSync('js/platform/dynamicRenderer/index.js', 'utf8');
const combinedSource = `${source}\n${dynamicRendererSource}`;

assert.match(source, /function temperatureFields\(s, active\)/, 'ventilation must render temperature inputs through a dedicated dynamic block.');
assert.match(source, /data-vent-dynamic="temperatures"/, 'temperature inputs must have a dynamic render anchor.');
assert.match(combinedSource, /setInner\(root, '\[data-vent-dynamic="temperatures"\]', renderTemperatures\(s, r, active, accent\)\)/, 'mode changes must rerender temperature fields with the active mode keys through the platform renderer.');
assert.match(combinedSource, /setInputValue\(root, key\(s, 'SupplyTemp'\), fmtInput\(active\.supplyTemp, 2\)\)/, 'temperature fields must be refreshed from active store state.');
assert.match(combinedSource, /setInputValue\(root, key\(s, 'RoomTemp'\), fmtInput\(active\.roomTemp, 2\)\)/, 'room temperature field must be refreshed from active store state.');

console.log('ventilation phase13e mode temperature render regression ok');
