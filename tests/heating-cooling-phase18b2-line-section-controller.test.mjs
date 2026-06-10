import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const moduleSource = readFileSync('js/modules/heating-cooling/index.js', 'utf8');
const controllerSource = readFileSync('js/platform/lineSectionController/index.js', 'utf8');

assert.match(controllerSource, /export function createLineSectionController/, 'platform must expose a generic line-section controller.');
assert.match(controllerSource, /'line:save'/, 'platform line-section controller must own line save action.');
assert.match(controllerSource, /'line:update'/, 'platform line-section controller must own line update action.');
assert.match(controllerSource, /'saved:load'/, 'platform line-section controller must own saved load action.');
assert.match(controllerSource, /renderSavedRecordList/, 'platform line-section controller must render saved record rows centrally.');
assert.match(moduleSource, /createLineSectionController/, 'heating/cooling must delegate line-section handling to the platform controller.');
assert.doesNotMatch(moduleSource, /function bindLineSections/, 'heating/cooling must not keep the old line-section binding function.');
assert.doesNotMatch(moduleSource, /function lineSectionsCard/, 'heating/cooling must not keep the old line-section card renderer.');
assert.match(moduleSource, /export function readLineSections\(\)/, 'project import/export compatibility must stay intact.');
assert.match(moduleSource, /export function writeLineSections\(items\)/, 'project import/export compatibility must stay intact.');

console.log('heating-cooling phase18b2 line-section controller regression ok');
