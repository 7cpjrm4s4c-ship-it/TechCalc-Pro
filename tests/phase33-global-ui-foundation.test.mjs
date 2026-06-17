import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const tokens = readFileSync('css/tokens.css', 'utf8');
const components = readFileSync('css/components.css', 'utf8');
const modules = readFileSync('css/modules.css', 'utf8');

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

assert.match(components, /Phase 34B: rebuilt component system\./, 'components.css must identify the rebuilt global UI contract');
assert.match(components, /\.module-content,[\s\S]*gap:\s*var\(--tc-gap\);/, 'module layout must be governed by the 10px global gap');
assert.match(components, /\.card,[\s\S]*padding:\s*var\(--tc-card-padding\);/, 'cards must use the global card padding token');
assert.match(components, /\.control,[\s\S]*min-height:\s*var\(--tc-control-height\);/, 'controls must use the global control height token');
assert.match(components, /overflow-wrap:\s*anywhere;/, 'result/card content must protect against text overflow');
assert.match(modules, /Module-specific layout exceptions only\./, 'module-specific overrides must be separated from global components');

console.log('phase33-global-ui-foundation: ok');
