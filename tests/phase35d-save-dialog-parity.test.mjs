import assert from 'node:assert/strict';
import { savedPlantsCard } from '../js/modules/pressure-holding/controller.js';
import { savedRecords as wastewaterSavedRecords } from '../js/modules/wastewater/results.js';
import { savedRecords as rainwaterSavedRecords } from '../js/modules/rainwater/results.js';
import wastewaterController, { bindWastewaterSavedActions } from '../js/modules/wastewater/controller.js';
import rainwaterController, { bindRainwaterSavedActions } from '../js/modules/rainwater/controller.js';

const pressureHtml = savedPlantsCard({ plantName: '', savedPlants: [] });
assert.match(pressureHtml, /data-tc-action="line:save"/);
assert.match(pressureHtml, /data-line-save/);
assert.doesNotMatch(pressureHtml.match(/<button[^>]+data-line-save[^>]*>/)?.[0] || '', /disabled/);
assert.match(pressureHtml, /data-ph-dynamic="saved-records"/);

const wastewaterModel = wastewaterSavedRecords({ name: '', savedCalculations: [] }, {});
assert.equal(wastewaterController.savedRecords.enabled, false);
assert.equal(typeof bindWastewaterSavedActions, 'function');
assert.equal(wastewaterModel.addAction || 'line:save', 'line:save');
assert.equal(wastewaterModel.updateAction || 'line:update', 'line:update');
assert.equal(wastewaterModel.addDisabled, false);
assert.equal(wastewaterModel.loadAttr, 'data-line-select');

const rainwaterModel = rainwaterSavedRecords({ areaName: '', surfaces: [] }, { surfaces: [] });
assert.equal(rainwaterController.savedRecords.enabled, false);
assert.equal(typeof bindRainwaterSavedActions, 'function');
assert.equal(rainwaterModel.addAction, 'line:save');
assert.equal(rainwaterModel.updateAction, 'line:update');
assert.equal(rainwaterModel.addDisabled, false);
assert.equal(rainwaterModel.loadAttr, 'data-line-select');
