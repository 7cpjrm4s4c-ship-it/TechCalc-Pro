import assert from 'node:assert/strict';

import { calculate } from '../js/modules/hx-diagram/logic.js';
import { chartCard } from '../js/modules/hx-diagram/diagramRenderer.js';
import { buildHxResultModel } from '../js/modules/hx-diagram/results.js';

const impossibleInput = {
  tempC: 20,
  rhPercent: 60,
  targetTempC: 24,
  targetRhPercent: 30,
  airVolumeM3h: 1000
};

for (const process of ['adiabatic', 'steam']) {
  const result = calculate({ ...impossibleInput, process });

  assert.equal(result.selectedProcess, process, 'the user-selected humidification process must be preserved');
  assert.equal(result.effectiveProcess, 'heat', 'an impossible humidification must fall back to sensible heating');
  assert.equal(result.processIssue, 'humidification-not-possible');
  assert.equal(result.targetReached, false);
  assert.equal(result.processPath.length, 2, 'only the physically possible heating path may be displayed');
  assert.ok(
    result.processPath.every(point => Math.abs(point.humidityRatio - result.current.humidityRatio) <= 1e-7),
    'the fallback heating path must keep the humidity ratio constant'
  );
  assert.ok(
    result.processPath.every(point => point.humidityRatio >= result.current.humidityRatio - 1e-7),
    'the path must not contain negative humidification'
  );

  const chart = chartCard(result.processPath, result.targetReached, result.processIssue);
  assert.match(chart, /Befeuchtung nicht möglich/);
  assert.doesNotMatch(chart, /Zielzustand wird nicht erreicht/);

  const model = buildHxResultModel({
    state: { ...impossibleInput, process },
    result,
    activePath: result.processPath,
    targetReached: result.targetReached
  });
  assert.deepEqual(model.notices[0].messages, ['Befeuchtung nicht möglich']);
  assert.ok(model.groups[0].rows.some(row => row.label === 'Erhitzerleistung'));
  assert.ok(!model.groups[0].rows.some(row => row.label === 'Vorerhitzerleistung'));
}

const possible = calculate({
  ...impossibleInput,
  targetRhPercent: 70,
  process: 'steam'
});
assert.equal(possible.processIssue, null, 'valid humidification must remain unchanged');
assert.equal(possible.effectiveProcess, 'steam');
assert.equal(possible.processPath.length, 3);
assert.equal(possible.targetReached, true);

const impossibleDehumidification = calculate({
  tempC: 26,
  rhPercent: 30,
  targetTempC: 20,
  targetRhPercent: 60,
  airVolumeM3h: 1000,
  process: 'cool-dehumidify'
});
assert.equal(impossibleDehumidification.selectedProcess, 'cool-dehumidify');
assert.equal(impossibleDehumidification.effectiveProcess, 'cool', 'an impossible dehumidification must fall back to sensible cooling');
assert.equal(impossibleDehumidification.processIssue, 'dehumidification-not-possible');
assert.equal(impossibleDehumidification.targetReached, false);
assert.equal(impossibleDehumidification.processPath.length, 2, 'only the physically possible cooling path may be displayed');
assert.ok(
  impossibleDehumidification.processPath.every(point => Math.abs(point.humidityRatio - impossibleDehumidification.current.humidityRatio) <= 1e-7),
  'the fallback cooling path must keep the humidity ratio constant'
);
assert.ok(
  impossibleDehumidification.processPath.every(point => point.humidityRatio <= impossibleDehumidification.current.humidityRatio + 1e-7),
  'the path must not contain humidification'
);

const dehumidificationChart = chartCard(
  impossibleDehumidification.processPath,
  impossibleDehumidification.targetReached,
  impossibleDehumidification.processIssue
);
assert.match(dehumidificationChart, /Entfeuchtung nicht möglich/);
assert.doesNotMatch(dehumidificationChart, /Zielzustand wird nicht erreicht/);

const dehumidificationModel = buildHxResultModel({
  state: { airVolumeM3h: 1000, process: 'cool-dehumidify' },
  result: impossibleDehumidification,
  activePath: impossibleDehumidification.processPath,
  targetReached: impossibleDehumidification.targetReached
});
assert.deepEqual(dehumidificationModel.notices[0].messages, ['Entfeuchtung nicht möglich']);
assert.equal(dehumidificationModel.primary.primary.value, 'Kühlen');

const possibleDehumidification = calculate({
  tempC: 26,
  rhPercent: 70,
  targetTempC: 20,
  targetRhPercent: 45,
  process: 'cool-dehumidify'
});
assert.equal(possibleDehumidification.processIssue, null, 'valid dehumidification must remain unchanged');
assert.equal(possibleDehumidification.effectiveProcess, 'cool-dehumidify');

console.log('h,x impossible humidification and dehumidification regression ok');
