import fs from 'node:fs';
import assert from 'node:assert/strict';

const renderer = fs.readFileSync('js/core/renderer.js', 'utf8');
assert.match(renderer, /bindCentralEventPipeline\(root, state, \{ renderOnBlur: true \}\)/,
  'Common inputs must delegate confirmation behavior to the central event pipeline.');

const eventPipeline = fs.readFileSync('js/core/eventPipeline.js', 'utf8');
assert.match(eventPipeline, /let hasDeferredInput = false/,
  'Central input handling must track deferred, not-yet-rendered input state.');
assert.match(eventPipeline, /const renderDeferred = \(force = false\) =>/,
  'Central input handling must render deferred input after confirmation.');
assert.match(eventPipeline, /const confirmSurface = event =>/,
  'Central input handling must support touch and click confirmation outside interactive fields.');
assert.match(eventPipeline, /event\.key !== 'Enter' && event\.key !== 'Tab'/,
  'Central input handling must confirm and navigate inputs with Enter and Tab.');
assert.match(eventPipeline, /add\(root, 'touchstart',[\s\S]*confirmSurface\(event\)/,
  'Touch interactions outside fields must confirm deferred input.');
assert.match(eventPipeline, /add\(root, 'pointerdown',[\s\S]*confirmSurface\(event\)/,
  'Pointer interactions outside fields must confirm deferred input.');
assert.match(eventPipeline, /add\(root, 'click', confirmSurface, true\)/,
  'Click interactions outside fields must confirm deferred input.');

const rainwaterLogic = fs.readFileSync('js/modules/rainwater/logic.js', 'utf8');
assert.match(rainwaterLogic, /surfaceRowsWithCurrentDraft/, 'Rainwater must calculate current input without requiring saved surfaces.');
assert.match(rainwaterLogic, /__current_input__/, 'Rainwater draft calculation must use a transient current-input surface.');

const drinkingLogic = fs.readFileSync('js/modules/drinking-water/logic.js', 'utf8');
assert.match(drinkingLogic, /draftUsageUnitFromState/, 'Drinking water must calculate draft usage units without save.');
assert.match(drinkingLogic, /draftSingleGroupFromState/, 'Drinking water must calculate draft single-consumer groups without save.');

console.log('Input confirmation and optional-save behavior verified.');
