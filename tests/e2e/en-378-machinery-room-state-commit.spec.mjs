import { test, expect } from '@playwright/test';

const MODULE_ID = 'en-378-safety-check';

// Documented input set (review of 18.11.2026): R-32, 5 kg, 79 m3, machinery
// room, risk analysis present with result "yes", mechanical ventilation,
// detector/alarm/independent alarm power = yes.
const STEPS = [
  { field: 'refrigerantId', value: 'HFKW-32', kind: 'select' },
  { field: 'chargeKg', value: '5', kind: 'input' },
  { field: 'roomVolumeM3', value: '79', kind: 'input' },
  { field: 'installationLocation', value: 'machinery-room', kind: 'select' },
  { field: 'machineryRoomRiskAnalysisStatus', value: 'present', kind: 'select' },
  { field: 'machineryRoomRiskAnalysisResult', value: 'yes', kind: 'select' },
  { field: 'ventilationType', value: 'mechanical', kind: 'select' },
  { field: 'hasDetector', value: 'yes', kind: 'select' },
  { field: 'hasAlarm', value: 'yes', kind: 'select' },
  { field: 'hasIndependentAlarmPower', value: 'yes', kind: 'select' }
];

const MACHINERY_ROOM_FIELDS = [
  'machineryRoomOccupied',
  'machineryRoomLargestSystemChargeKg',
  'machineryRoomEmergencyFanSuitable',
  'hasEmergencyVentilationControlOutside',
  'hasEmergencyVentilationControlInside'
];

async function readModuleState(page) {
  return page.evaluate(async () => {
    const { getModuleStore } = await import('/core/state/index.js');
    return getModuleStore('en-378-safety-check').get();
  });
}

async function readCalculation(page) {
  return page.evaluate(async () => {
    const { getModuleStore } = await import('/core/state/index.js');
    const { calculate } = await import('/modules/en-378-safety-check/logic.js');
    return calculate(getModuleStore('en-378-safety-check').get());
  });
}

async function openModule(page) {
  await page.goto('/');
  await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', /.+/, { timeout: 15_000 });
  await page.evaluate(id => { window.location.hash = `#/${id}`; }, MODULE_ID);
  await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', MODULE_ID, { timeout: 15_000 });
  await expect(page.locator('#app')).not.toHaveAttribute('aria-busy', /true/);
  await expect(page.locator('select[data-field="refrigerantId"]')).toBeVisible({ timeout: 15_000 });
}

async function commitStep(page, step) {
  const el = page.locator(`[data-field="${step.field}"]`).first();
  await expect(el).toBeVisible({ timeout: 10_000 });
  if (step.kind === 'select') await el.selectOption(step.value);
  else {
    await el.fill(step.value);
    await el.dispatchEvent('change');
  }
  // Every committed selection must be present in the module state afterwards.
  await expect.poll(() => readModuleState(page).then(state => state[step.field]), { timeout: 5_000 })
    .toEqual(step.value);
  // The rendered control must reflect the committed value (no stale DOM).
  await expect(page.locator(`[data-field="${step.field}"]`).first()).toHaveValue(step.value);
}

test.describe('EN 378 machinery-room inputs commit to module state', () => {
  test('documented input set reaches the state store step by step and renders without stale results', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    await openModule(page);

    for (const step of STEPS) {
      await commitStep(page, step);
    }

    // The machinery-room fields gated by the risk-analysis result must be visible.
    for (const field of MACHINERY_ROOM_FIELDS) {
      await expect(page.locator(`[data-field="${field}"]`).first()).toBeVisible({ timeout: 10_000 });
    }

    const state = await readModuleState(page);
    for (const step of STEPS) {
      expect(state[step.field], `state.${step.field} after selection`).toBe(step.value);
    }

    const calculation = await readCalculation(page);
    expect(calculation.inputValidation.issues).not.toContain('ventilationType:required');
    const openPoints = calculation.plannerGuidance.groups.find(group => group.id === 'openPoints');
    const openPointIds = (openPoints?.items || []).map(item => item.id);
    for (const field of ['hasDetector', 'hasAlarm', 'hasIndependentAlarmPower']) {
      expect(openPointIds, `open point for ${field}`).not.toContain(field);
    }

    const appText = await page.locator('#app').innerText();
    expect(appText).not.toContain('Lüftung fehlt.');

    expect(pageErrors, 'no uncaught page errors during the flow').toEqual([]);
  });
});
