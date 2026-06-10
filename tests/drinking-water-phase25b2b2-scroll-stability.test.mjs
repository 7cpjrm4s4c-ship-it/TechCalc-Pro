import assert from 'node:assert/strict';
import fs from 'node:fs';

const controller = fs.readFileSync(new URL('../js/modules/drinking-water/controller.js', import.meta.url), 'utf8');

assert(!controller.includes('function rerender'), 'controller must not expose full rerender helper');
assert(!controller.includes('rerender(root)'), 'controller actions must not trigger full module rerender');
assert(controller.includes('preserveScrollPosition'), 'controller refresh must preserve scroll position');
assert(controller.includes('export function refreshDrinkingWater'), 'controller must use partial refresh entrypoint');

for (const name of ['saveUnit', 'saveSingle', 'deleteUnit', 'deleteSingle', 'editUnit', 'editSingle', 'clearActiveEdit']) {
  const start = controller.indexOf(`function ${name}`);
  assert(start >= 0, `${name} must exist`);
  const next = controller.indexOf('\nfunction ', start + 10);
  const body = controller.slice(start, next >= 0 ? next : controller.length);
  assert(body.includes('refreshDrinkingWater(root)'), `${name} must use partial refresh`);
}

console.log('drinking-water phase25b2b2 scroll stability ok');
