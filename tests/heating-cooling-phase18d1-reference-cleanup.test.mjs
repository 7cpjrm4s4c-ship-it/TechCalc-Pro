import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const moduleIndex = fs.readFileSync(path.join(root, 'js/modules/heating-cooling/index.js'), 'utf8');
const moduleView = fs.readFileSync(path.join(root, 'js/modules/heating-cooling/view.js'), 'utf8');

assert.match(moduleIndex, /createPlatformModule\(/, 'Heizung/Kälte must keep the platform module runtime as the mount owner.');
assert.match(moduleIndex, /createHeatingCoolingView\(/, 'Heizung/Kälte index should delegate ordered layout/view composition to view.js.');
assert.doesNotMatch(moduleIndex, /renderModuleShell|card\(|selectField\(|renderRecommendationCard/, 'Heizung/Kälte index must not own card/result view rendering helpers after 18D.1.');
assert.match(moduleView, /renderModuleShell/, 'Ordered layout remains isolated in the heating-cooling view adapter.');
assert.match(moduleView, /dynamicRenderers/, 'Dynamic renderer callback composition should live with the view adapter, not in index.js.');
assert.doesNotMatch(moduleIndex, /function setInner|function setInputValue|function updateCardAccent|function setCardTitle|function updateSegment/, 'No legacy dynamic DOM helper functions may remain in the module index.');

console.log('heating-cooling-phase18d1-reference-cleanup passed');
