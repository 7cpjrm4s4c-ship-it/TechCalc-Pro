import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../css/components-polish.css', import.meta.url), 'utf8');

test('central card spacing tokens separate title, content and sibling rhythms', () => {
  assert.match(css, /--tc-card-title-gap:\s*calc\(var\(--tc-gap\)\s*\*\s*0\.5\)/);
  assert.match(css, /--tc-card-content-gap:\s*var\(--tc-gap\)/);
  assert.match(css, /--tc-card-stack-gap:\s*var\(--tc-gap\)/);
  assert.match(css, /\.card,\s*\n\.tc-card,\s*\n\.result-card\s*\{[^}]*gap:\s*var\(--tc-card-title-gap\)/s);
  assert.match(css, /\.card__body,\s*\n\.tc-card__body,\s*\n\.result-card__body\s*\{[^}]*gap:\s*var\(--tc-card-content-gap\)/s);
});

test('top-level card stacks use one global sibling gap', () => {
  assert.match(css, /\.tc-stack,[\s\S]*?\.module-content\s*>\s*\.span-12\s*\{[^}]*gap:\s*var\(--tc-card-stack-gap\)/);
});

test('nested result groups use grid gap instead of ad-hoc margins', () => {
  assert.match(css, /\.result-group\s*\{[^}]*display:\s*grid[^}]*gap:\s*var\(--tc-card-stack-gap\)/s);
  assert.match(css, /\.result-group\s*>\s*\.card\s*\{[^}]*margin:\s*0/s);
  assert.doesNotMatch(css, /\.result-group\s*>\s*\.card\s*\+\s*\.card\s*\{[^}]*margin-top/s);
});
