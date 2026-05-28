import { readFileSync } from 'node:fs';

const renderer = readFileSync('js/core/renderer.js', 'utf8');
const savedRecords = readFileSync('js/core/savedRecords.js', 'utf8');
const savedController = readFileSync('js/core/savedCalculationController.js', 'utf8');
const scrollManager = readFileSync('js/core/scrollManager.js', 'utf8');

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

assert(renderer.includes('bindCommittedInteractionGuard'), 'missing committed interaction guard');
assert(renderer.includes('tcCommittedActionAt'), 'missing committed action timestamp');
assert(renderer.includes('[data-line-card]') && renderer.includes('.saved-record-card'), 'saved cards are not guarded against blur re-render');
assert(renderer.includes('button, summary, details, [role="button"], [data-line-card], .saved-record-card'), 'global no-click scroll still targets interactive saved controls');
assert(savedRecords.includes('preserveLoadScroll = true'), 'saved record list must allow callers to opt out of nested scroll preservation');
assert(savedController.includes('preserveLoadScroll: false'), 'central saved calculation controller must avoid nested scroll preservation');
assert(!scrollManager.includes('blurActive: true'), 'scroll presets must not force blur during saved-record actions');

console.log('saved-record interaction regression ok');
