import assert from 'node:assert/strict';
import { savedPlantsCard } from '../js/modules/pressure-holding/controller.js';
import { wastewaterSavedController } from '../js/modules/wastewater/controller.js';
import { rainwaterSavedController } from '../js/modules/rainwater/controller.js';

const pressureHtml = savedPlantsCard({ plantName: '', savedPlants: [] });
assert.match(pressureHtml, /data-tc-action="line:save"/);
assert.match(pressureHtml, /data-line-save/);
assert.doesNotMatch(pressureHtml.match(/<button[^>]+data-line-save[^>]*>/)?.[0] || '', /disabled/);
assert.match(pressureHtml, /data-ph-dynamic="saved-records"/);

const wastewaterHtml = wastewaterSavedController.renderCard({ name: '', savedCalculations: [] });
assert.match(wastewaterHtml, /data-tc-action="line:save"/);
assert.match(wastewaterHtml, /data-line-save/);
assert.doesNotMatch(wastewaterHtml.match(/<button[^>]+data-line-save[^>]*>/)?.[0] || '', /disabled/);
assert.match(wastewaterHtml, /data-platform-dynamic="saved-records"/);

const rainwaterHtml = rainwaterSavedController.renderCard({ areaName: '', surfaces: [] });
assert.match(rainwaterHtml, /data-tc-action="line:save"/);
assert.match(rainwaterHtml, /data-line-save/);
assert.doesNotMatch(rainwaterHtml.match(/<button[^>]+data-line-save[^>]*>/)?.[0] || '', /disabled/);
assert.match(rainwaterHtml, /data-platform-dynamic="saved-records"/);

console.log('phase35d save dialog parity regression ok');
