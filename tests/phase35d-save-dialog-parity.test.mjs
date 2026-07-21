import assert from 'node:assert/strict';
import { savedPlantsCard } from '../js/modules/pressure-holding/controller.js';
import { createLineSectionController } from '../js/platform/lineSectionController/index.js';

const stateStub = snapshot => ({
  get: () => snapshot,
  set() {}
});

const wastewaterSavedController = createLineSectionController({
  state: stateStub({ name: '', savedCalculations: [] }),
  listKey: 'savedCalculations',
  activeIdKey: 'activeCalculationId',
  nameKey: 'name',
  expandedIdKey: 'expandedCalculationId',
  cardTitle: 'Gespeicherte Berechnungen',
  nameInputId: 'name',
  dynamicAttr: 'line-sections'
});

const rainwaterSavedController = createLineSectionController({
  state: stateStub({ areaName: '', surfaces: [] }),
  listKey: 'surfaces',
  activeIdKey: 'activeSurfaceId',
  nameKey: 'areaName',
  expandedIdKey: 'expandedSurfaceResultId',
  cardTitle: 'Gespeicherte Flächen',
  nameInputId: 'areaName',
  dynamicAttr: 'line-sections'
});

const pressureHtml = savedPlantsCard({ plantName: '', savedPlants: [] });
assert.match(pressureHtml, /data-tc-action="line:save"/);
assert.match(pressureHtml, /data-line-save/);
assert.doesNotMatch(pressureHtml.match(/<button[^>]+data-line-save[^>]*>/)?.[0] || '', /disabled/);
assert.match(pressureHtml, /data-ph-dynamic="saved-records"/);

const wastewaterHtml = wastewaterSavedController.renderCard({ name: '', savedCalculations: [] });
assert.match(wastewaterHtml, /data-tc-action="line:save"/);
assert.match(wastewaterHtml, /data-line-save/);
assert.doesNotMatch(wastewaterHtml.match(/<button[^>]+data-line-save[^>]*>/)?.[0] || '', /disabled/);
assert.match(wastewaterHtml, /data-line-dynamic="line-sections"/);

const rainwaterHtml = rainwaterSavedController.renderCard({ areaName: '', surfaces: [] });
assert.match(rainwaterHtml, /data-tc-action="line:save"/);
assert.match(rainwaterHtml, /data-line-save/);
assert.doesNotMatch(rainwaterHtml.match(/<button[^>]+data-line-save[^>]*>/)?.[0] || '', /disabled/);
assert.match(rainwaterHtml, /data-line-dynamic="line-sections"/);

console.log('phase35d save dialog parity regression ok');