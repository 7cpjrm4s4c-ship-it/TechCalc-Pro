import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const eventPipeline = read('js/core/eventPipeline.js');
const drinkingDynamic = read('js/modules/drinking-water/dynamicRenderer.js');

assert.match(
  eventPipeline,
  /import \{[^}]*preserveFocusDuring[^}]*\} from '\.\/focusManager\.js';/,
  'eventPipeline must import preserveFocusDuring from focusManager instead of referencing a missing global'
);

assert.doesNotMatch(
  eventPipeline,
  /PlatformFocusManager\s*\./,
  'eventPipeline must not reference PlatformFocusManager as an undeclared global'
);

assert.match(
  drinkingDynamic,
  /function isDetachedNodeRace\(/,
  'drinking-water dynamic renderer must classify detached-node DOM races'
);

assert.match(
  drinkingDynamic,
  /island\.isConnected === false|!island\.isConnected/,
  'drinking-water dynamic renderer must guard disconnected dynamic islands before innerHTML writes'
);

assert.match(
  drinkingDynamic,
  /root\?\.contains && !root\.contains\(island\)/,
  'drinking-water dynamic renderer must skip stale dynamic-island anchors after blur/focus replacement'
);

assert.match(
  drinkingDynamic,
  /catch \(error\) \{[\s\S]*isDetachedNodeRace\(error\)[\s\S]*return false;/,
  'drinking-water dynamic renderer must suppress known detached-node NotFoundError races only'
);

console.log('phase37b1b browser runtime error elimination guard ok');
