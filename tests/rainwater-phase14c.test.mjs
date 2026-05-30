import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../js/modules/rainwater/index.js', import.meta.url), 'utf8');

assert.match(source, /deleteAttr:\s*'data-rainwater-surface-delete'/, 'Rainwater surface list must expose delete through the global saved-record renderer.');
assert.match(source, /'segment': selectSegment/, 'Rainwater surfaceMode switch must be handled through the central segment pipeline.');
assert.match(source, /calculationType: nextMode/, 'Rainwater surfaceMode switch must keep calculationType in sync.');
assert.ok(!/card\('Regenflächen', surfaceInputBlock\(s, r\), 'green'\),\s*saveCard\(s\)/.test(source), 'Rainwater must not render the extra calculation save card in the main input flow.');
assert.match(source, /surfacesTable\(r, s\)/, 'Rainwater surface editor must render the persisted surface list.');

console.log('rainwater phase14c workflow regression ok');
