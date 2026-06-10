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
assert(renderer.includes('button, summary, details, [role="button"], [data-line-card], [data-saved-record-card], .saved-record-card'), 'global no-click scroll still targets interactive saved controls');
assert(savedRecords.includes('preserveLoadScroll = true'), 'saved record list must allow callers to opt out of nested scroll preservation');
assert(savedController.includes('preserveLoadScroll: false'), 'central saved calculation controller must avoid nested scroll preservation');
assert(!scrollManager.includes('blurActive: true'), 'scroll presets must not force blur during saved-record actions');

assert(savedRecords.includes('data-saved-record-card'), 'saved cards need explicit central marker');
assert(savedRecords.includes('role="button"'), 'saved cards must expose button semantics');
assert(savedRecords.includes('bindScopedOnce'), 'saved record binding must be delegated and scoped');
assert(savedRecords.includes("bindScopedOnce(root, key, 'click'") && savedRecords.includes('}, true)'), 'saved record click handling must run in capture phase');
assert(savedRecords.includes("bindScopedOnce(root, key, 'keydown'"), 'saved records must support keyboard activation');
assert(savedRecords.includes('stopImmediatePropagation'), 'saved record activation must not be stolen by outside-click handlers');


console.log('saved-record interaction regression ok');
