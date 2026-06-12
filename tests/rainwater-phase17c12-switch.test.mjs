import assert from 'node:assert/strict';
import rainwater from '../js/modules/rainwater/index.js';
import { view as rainwaterView } from '../js/modules/rainwater/view.js';

function render(snapshot) {
  return rainwaterView(snapshot);
}

const roof = rainwater.initialState;
assert.match(render(roof), /Regenspende r\(5,5\)/);
assert.match(render(roof), /Vorwahl Dacheinlauf/);

const propertyPatch = rainwater.controller.segments.fields.surfaceMode.patch('property', roof);
const property = { ...roof, ...propertyPatch };
assert.equal(property.surfaceMode, 'property');
assert.equal(property.calculationType, 'property');
assert.equal(property.areaType, 'concrete-asphalt');

const html = render(property);
assert.match(html, /Regenspende r\(5,2\)/);
assert.doesNotMatch(html, /Regenspende r\(5,5\)/);
assert.match(html, /Vorwahl Hoftopf/);
assert.doesNotMatch(html, /Vorwahl Dacheinlauf/);

const controllerSource = await import('node:fs').then(fs => fs.readFileSync(new URL('../js/modules/rainwater/controller.js', import.meta.url), 'utf8'));
assert.doesNotMatch(controllerSource, /domPatch/);
assert.doesNotMatch(controllerSource, /querySelector/);
