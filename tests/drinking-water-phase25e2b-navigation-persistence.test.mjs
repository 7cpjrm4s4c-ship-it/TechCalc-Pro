import assert from 'node:assert/strict';
import fs from 'node:fs';

const controller = fs.readFileSync(new URL('../js/modules/drinking-water/controller.js', import.meta.url), 'utf8');
const dynamicRenderer = fs.readFileSync(new URL('../js/modules/drinking-water/dynamicRenderer.js', import.meta.url), 'utf8');

assert.ok(controller.includes('installNavigationPersistenceGuard'), 'controller must install a Trinkwasser navigation persistence guard');
assert.ok(controller.includes('tc-keyboard-open'), 'controller must explicitly release the mobile keyboard navigation lock');
assert.ok(controller.includes('window.visualViewport'), 'controller must handle mobile keyboard viewport resize/scroll events');
assert.ok(controller.includes('releaseKeyboardNavigationLock(root, 0)'), 'partial refresh must immediately release stale keyboard nav locks when no field remains focused');
assert.ok(dynamicRenderer.includes('[data-dw-dynamic="input"]'), 'dynamic updates must remain scoped to the input island');
assert.ok(dynamicRenderer.includes('[data-dw-dynamic="result"]'), 'dynamic updates must remain scoped to the result island');
assert.ok(!dynamicRenderer.includes('module-nav'), 'Trinkwasser dynamic renderer must not target global module navigation');

console.log('drinking-water phase25e2b navigation persistence ok');
