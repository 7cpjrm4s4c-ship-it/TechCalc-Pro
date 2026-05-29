import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('js/core/eventPipeline.js', 'utf8');

assert.match(
  source,
  /root\.__tcCentralEventPipelineState === state/,
  'central pipeline must recognize an existing binding only when it belongs to the same module state'
);

assert.match(
  source,
  /root\.__tcCentralEventPipelineCleanup\?\.\(\)/,
  'central pipeline must cleanup stale module bindings before rebinding'
);

assert.match(
  source,
  /root\.__tcCentralEventPipelineState = state/,
  'central pipeline must record the module state it is currently bound to'
);
