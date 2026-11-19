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

const FULL_INPUT_SET = [

      { field: 'refrigerantId', value: 'HFKW-32', kind: 'select' },
      { field: 'chargeKg', value: '5', kind: 'input' },
      { field: 'roomVolumeM3', value: '79', kind: 'input' },
      { field: 'installationLocation', value: 'machinery-room', kind: 'select' },
      { field: 'installationClass', value: 'III', kind: 'select' },
      { field: 'accessArea', value: 'authorized-access', kind: 'select' },
      { field: 'usageType', value: 'industrial', kind: 'select' },
      { field: 'applicationType', value: 'other', kind: 'select' },
      { field: 'locationLevel', value: 'other', kind: 'select' },
      { field: 'ventilationType', value: 'mechanical', kind: 'select' },
      { field: 'machineryRoomRiskAnalysisStatus', value: 'present', kind: 'select' },
      { field: 'machineryRoomRiskAnalysisResult', value: 'yes', kind: 'select' },
      { field: 'machineryRoomOccupied', value: 'no', kind: 'select' },
      { field: 'machineryRoomLargestSystemChargeKg', value: '5', kind: 'input' },
      { field: 'hasEmergencyVentilation', value: 'yes', kind: 'select' },
      { field: 'hasEmergencyVentilationControlOutside', value: 'yes', kind: 'select' },
      { field: 'hasEmergencyVentilationControlInside', value: 'yes', kind: 'select' },
      { field: 'hasDetector', value: 'yes', kind: 'select' },
      { field: 'hasAlarm', value: 'yes', kind: 'select' },
      { field: 'hasIndependentAlarmPower', value: 'yes', kind: 'select' },
      { field: 'hasExplosionProtectedElectricalEquipment', value: 'yes', kind: 'select' },
      { field: 'machineryRoomEmergencyFanSuitable', value: 'yes', kind: 'select' }
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

  test('result summary shows compact status groups Erfüllt/Offen/Nicht erfüllt without a separate safety components card', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await openModule(page);

    for (const step of FULL_INPUT_SET) {
      await commitStep(page, step);
    }

    const heading = title => page.locator('h2.card__title').filter({ hasText: new RegExp(`^${title}$`) });
    await expect(page.locator('#app').locator(heading('Offen'))).toHaveCount(1);
    await expect(page.locator('#app').locator(heading('Nicht erfüllt'))).toHaveCount(1);
    await expect(page.locator('#app').locator(heading('Erfüllt'))).toHaveCount(1);

    // Innermost status card whose own heading is the group title.
    const statusCard = title => page.locator('#app .card').filter({
      has: page.locator(':scope > h2.card__title').filter({ hasText: new RegExp(`^${title}$`) })
    });

    // Open points group exists but is empty for the fully answered input set.
    await expect(statusCard('Offen').locator('.result-row')).toHaveCount(0);

    // Passed points are listed compactly in the "Erfüllt" group.
    await expect(statusCard('Erfüllt').locator('.result-row').first()).toBeVisible();

    // The former standalone "Sicherheitskomponenten" result card is gone; its points live in the planner guidance.
    const resultColumn = page.locator('#app [data-platform-dynamic="result-saved"]');
    await expect(resultColumn.locator('.card__title').filter({ hasText: /Sicherheitskomponenten/ })).toHaveCount(0);
    await expect(resultColumn.locator('.card__title').filter({ hasText: /^Planer-Leitfaden – Statusübersicht$/ })).toHaveCount(1);

    expect(pageErrors).toEqual([]);
  });

  test('acceptable overall status, planner checklist acknowledgement persists across reload and appears in the PDF report', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await openModule(page);

    for (const step of FULL_INPUT_SET) {
      await commitStep(page, step);
    }

    // Gesamtbefund: "Anforderungen nach aktuellem Prüfstand erfüllt" (Status acceptable).
    const overallStatus = page.locator('#app .main-result strong');
    await expect(overallStatus).toHaveText('Anforderungen nach aktuellem Prüfstand erfüllt');

    // Gruppe "Erforderlich" mit abhakbaren Punkten ist vorhanden.
    const checklistCard = page.locator('#app .card').filter({
      has: page.locator(':scope > h2.card__title').filter({ hasText: /^Erforderlich$/ })
    });
    const checkbox = checklistCard.locator('input[type="checkbox"][data-checklist-index]').first();
    await expect(checkbox).toBeVisible();
    await expect(checkbox).not.toBeChecked();

    // Abhaken: reine Planer-Notiz, Gesamtbefund und normativer Status bleiben unverändert.
    await checkbox.dispatchEvent('click');
    await expect(checkbox).toBeChecked();
    await expect(checklistCard.locator('.tc-checklist-item.is-acknowledged')).toHaveCount(1);
    await expect(checklistCard.locator('.tc-checklist-item__ack')).toHaveText('berücksichtigt');
    await expect(overallStatus).toHaveText('Anforderungen nach aktuellem Prüfstand erfüllt');
    let state = await readModuleState(page);
    expect(Object.keys(state.en378ChecklistAcknowledged || {})).toHaveLength(1);

    // Abwahl (Wiederherstellung) ist möglich.
    await checkbox.dispatchEvent('click');
    await expect(checkbox).not.toBeChecked();
    state = await readModuleState(page);
    expect(Object.keys(state.en378ChecklistAcknowledged || {})).toHaveLength(0);
    await expect(overallStatus).toHaveText('Anforderungen nach aktuellem Prüfstand erfüllt');

    // Erneut abhaken für den Persistenz-/PDF-Teil.
    await checkbox.dispatchEvent('click');
    await expect(checkbox).toBeChecked();

    // PDF-Bericht enthält das Kennzeichen "berücksichtigt (Planer)".
    const pdfJson = await page.evaluate(async () => {
      const { getModuleStore } = await import('/core/state/index.js');
      const { calculate } = await import('/modules/en-378-safety-check/logic.js');
      const { buildEN378SafetyCheckReportDto } = await import('/modules/en-378-safety-check/reportAdapter.js');
      const { buildEN378ReportSections } = await import('/core/pdf/en378ReportSections.js');
      const moduleState = getModuleStore('en-378-safety-check').get();
      const calculation = calculate(moduleState);
      const dto = buildEN378SafetyCheckReportDto({ state: moduleState, calculation, generatedAt: '2026-11-19T00:00:00.000Z' });
      return JSON.stringify(buildEN378ReportSections(dto));
    });
    expect(pdfJson).toContain('berücksichtigt (Planer)');

    // Reload: Abhakzustand und Gesamtbefund bleiben erhalten.
    await page.reload();
    await openModule(page);
    await expect(page.locator('#app .main-result strong')).toHaveText('Anforderungen nach aktuellem Prüfstand erfüllt');
    const restoredState = await readModuleState(page);
    expect(Object.keys(restoredState.en378ChecklistAcknowledged || {})).toHaveLength(1);
    const restoredCheckbox = page.locator('#app .card').filter({
      has: page.locator(':scope > h2.card__title').filter({ hasText: /^Erforderlich$/ })
    }).locator('input[type="checkbox"][data-checklist-index]').first();
    await expect(restoredCheckbox).toBeChecked();
    await expect(page.locator('#app .tc-checklist-item.is-acknowledged')).toHaveCount(1);

    expect(pageErrors).toEqual([]);
  });
});
