import assert from 'node:assert/strict';
import fs from 'node:fs';

const controller = fs.readFileSync(new URL('../js/modules/hx-diagram/controller.js', import.meta.url), 'utf8');
const components = fs.readFileSync(new URL('../css/components.css', import.meta.url), 'utf8');

assert.match(controller, /function handleHxSignToggle/, 'h,x sign toggle must have a dedicated hardened handler');
assert.match(controller, /pointerdown.*earlyAction/s, 'h,x sign and clear actions must commit on pointerdown before mobile blur/click delay');
assert.match(controller, /touchstart.*earlyAction/s, 'h,x sign and clear actions must commit on touchstart for mobile Safari/Chrome');
assert.match(controller, /shouldSkipDuplicateHxAction/, 'h,x immediate actions must dedupe touchstart/pointerdown/click duplicate sequences');
assert.match(controller, /process:\s*'heat'/, 'diagram clear must reset the process to a deterministic default');
assert.match(controller, /expandedProcessId:\s*null/, 'diagram clear must close expanded process state');
assert.match(components, /body\.tc-keyboard-open \.module-nav[\s\S]*opacity:\s*1[\s\S]*pointer-events:\s*auto[\s\S]*transform:\s*translateY\(0\)/, 'mobile module navigation must remain visible after keyboard close/open cycles');

console.log('hx diagram phase 32A.3 mobile action hardening source ok');
