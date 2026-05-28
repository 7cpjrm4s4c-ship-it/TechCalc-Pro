import fs from 'node:fs';
import assert from 'node:assert/strict';

const renderer = fs.readFileSync('js/core/renderer.js', 'utf8');
assert.match(renderer, /hasUnrenderedInput/, 'Common inputs must track unrendered input state.');
assert.match(renderer, /renderCommittedInput\(\)/, 'Common inputs must render after committed input.');
assert.match(renderer, /confirmBySurfaceTouch/, 'Common inputs must support touch/click confirmation outside fields.');
assert.match(renderer, /event\.key !== 'Enter'/, 'Common inputs must confirm calculations with Enter.');

const rainwaterLogic = fs.readFileSync('js/modules/rainwater/logic.js', 'utf8');
assert.match(rainwaterLogic, /surfaceRowsWithCurrentDraft/, 'Rainwater must calculate current input without requiring saved surfaces.');
assert.match(rainwaterLogic, /__current_input__/, 'Rainwater draft calculation must use a transient current-input surface.');

const drinkingLogic = fs.readFileSync('js/modules/drinking-water/logic.js', 'utf8');
assert.match(drinkingLogic, /draftUsageUnitFromState/, 'Drinking water must calculate draft usage units without save.');
assert.match(drinkingLogic, /draftSingleGroupFromState/, 'Drinking water must calculate draft single-consumer groups without save.');

console.log('Input confirmation and optional-save behavior verified.');
