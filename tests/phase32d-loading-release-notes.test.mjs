import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createModuleRuntime } from '../js/core/moduleRuntime.js';

function createRoot() {
  return {
    dataset: {},
    innerHTML: '',
    attributes: new Set(),
    __tcLastHtml: '',
    setAttribute(name) { this.attributes.add(name); },
    removeAttribute(name) { this.attributes.delete(name); },
    hasAttribute(name) { return this.attributes.has(name); },
    dispatchEvent() { return true; },
    focus() {}
  };
}

const fastRoot = createRoot();
const runtime = createModuleRuntime({
  root: fastRoot,
  modules: { get: () => ({ mount(root) { root.innerHTML = '<section>Fast</section>'; } }) },
  loadingDelayMs: 50
});

assert.equal(await runtime.mount('fast'), true);
assert.equal(fastRoot.innerHTML, '<section>Fast</section>');
assert.equal(fastRoot.innerHTML.includes('Modul wird geladen'), false, 'fast mounts must not flash loading copy');

const appSource = fs.readFileSync('js/core/app.js', 'utf8');
assert.match(appSource, /scheduleLazyModulePreload\(\)/, 'lazy modules are preloaded after app boot');
assert.match(appSource, /requestIdleCallback\(preload, \{ timeout: 1500 \}\)/, 'preload uses idle scheduling');
assert.match(appSource, /#\{1,3\}/, 'release notes parser accepts root h1 release heading');

const releaseNotes = fs.readFileSync('RELEASE_NOTES.md', 'utf8');
assert.match(releaseNotes, /^# TechCalc Pro 1\.3\.0/m, 'root release notes expose current release heading');
assert.match(releaseNotes, /Release documentation consolidated/, 'root release notes contain parseable bullet content');

console.log('Phase 32D loading and release notes hardening test passed');
