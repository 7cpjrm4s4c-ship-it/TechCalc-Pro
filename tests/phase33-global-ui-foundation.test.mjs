import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const tokens = readFileSync('css/tokens.css', 'utf8');
const components = readFileSync('css/components.css', 'utf8');

function requireDeclaration(source, declaration) {
  assert.ok(source.includes(declaration), `missing declaration: ${declaration}`);
}

requireDeclaration(tokens, '--tc-gap: 10px;');
requireDeclaration(tokens, '--tc-card-padding: 10px;');
requireDeclaration(tokens, '--ui-gap: var(--tc-gap);');
requireDeclaration(tokens, '--card-gap: var(--tc-gap);');
requireDeclaration(tokens, '--field-gap: var(--tc-gap);');
requireDeclaration(tokens, '--section-gap: var(--tc-gap);');
requireDeclaration(tokens, '--radius-md: var(--tc-radius-base);');
requireDeclaration(tokens, '--radius-xl: var(--tc-radius-card);');

assert.match(components, /Phase 33: global UI geometry contract\./, 'components.css must include the Phase 33 global UI contract');
assert.match(components, /\.module-view[\s\S]*gap:\s*var\(--tc-gap\)\s*!important;/, 'module layout must be governed by the 10px global gap');
assert.match(components, /\.card,[\s\S]*padding:\s*var\(--tc-card-padding\);/, 'cards must use the global card padding token');
assert.match(components, /\.control,[\s\S]*min-height:\s*var\(--tc-control-height\);/, 'controls must use the global control height token');
assert.match(components, /overflow-wrap:\s*anywhere;/, 'result/card content must protect against text overflow');

const phase33Start = components.indexOf('/* Phase 33: global UI geometry contract.');
assert.ok(phase33Start > 0, 'Phase 33 contract must be appended after legacy rules so it wins the cascade');

console.log('phase33-global-ui-foundation: ok');
