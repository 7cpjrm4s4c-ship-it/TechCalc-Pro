import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const cssFiles = ['css/components.css', 'css/layout.css', 'css/tokens.css'];
const supportPattern = /@supports\s*\(\(-webkit-backdrop-filter:\s*blur\(1px\)\)\s*or\s*\(backdrop-filter:\s*blur\(1px\)\)\)/;

function assert(condition, message) {
  if (!condition) throw new Error(`Phase 38E audit failed: ${message}`);
}

function lineFor(source, index) {
  return source.slice(0, index).split('\n').length;
}

for (const file of cssFiles) {
  const source = readFileSync(join(process.cwd(), file), 'utf8');
  let supportDepth = 0;
  let pendingSupports = false;
  for (let i = 0; i < source.length; i += 1) {
    const rest = source.slice(i);
    if (supportPattern.test(rest.slice(0, 120))) pendingSupports = true;
    if (source[i] === '{') {
      if (pendingSupports) {
        supportDepth += 1;
        pendingSupports = false;
      } else if (supportDepth > 0) {
        supportDepth += 1;
      }
    } else if (source[i] === '}') {
      if (supportDepth > 0) supportDepth -= 1;
    }

    if (source.startsWith('backdrop-filter:', i) || source.startsWith('-webkit-backdrop-filter:', i)) {
      const nextSemicolon = source.indexOf(';', i);
      const nextBrace = source.indexOf('{', i);
      if (nextSemicolon !== -1 && (nextBrace === -1 || nextSemicolon < nextBrace)) {
        const declaration = source.slice(i, nextSemicolon + 1);
        const isDisabled = /:\s*none\s*;/.test(declaration);
        assert(isDisabled || supportDepth > 0, `${file}:${lineFor(source, i)} uses ${declaration.trim()} outside @supports`);
      }
    }
  }
}

const components = readFileSync('css/components.css', 'utf8');
const layout = readFileSync('css/layout.css', 'utf8');
const tokens = readFileSync('css/tokens.css', 'utf8');

assert(/\.glass-surface,[\s\S]*?\.tc-card\s*\{[\s\S]*?rgba\(32,39,49,\.94\)[\s\S]*?rgba\(18,22,28,\.90\)/.test(components), 'card/glass fallback must be opaque before backdrop enhancement');
assert(/\.app-header[\s\S]*?background:\s*rgba\(18,25,34,\.94\)/.test(components), 'header fallback must be opaque before backdrop enhancement');
assert(/body::before\s*\{[\s\S]*?background:\s*rgba\(18,25,34,\.94\)/.test(tokens), 'safe-area header fallback must be opaque before backdrop enhancement');
assert(/\.module-nav\s*\{[\s\S]*?background:\s*rgba\(8,12,18,\.94\)/.test(layout), 'mobile nav fallback must be opaque before backdrop enhancement');
assert(/@supports\s*\(\(-webkit-backdrop-filter:[\s\S]*?\.module-nav[\s\S]*?backdrop-filter:\s*blur\(18px\)/.test(layout), 'desktop nav blur must be isolated behind @supports');

console.log('Phase 38E low-end mobile rendering audit ok');
