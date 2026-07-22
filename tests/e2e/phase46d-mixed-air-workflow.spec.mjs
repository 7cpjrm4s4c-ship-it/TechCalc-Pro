import { test, expect } from '@playwright/test';
import path from 'node:path';

function isKnownExternalNoise(message) {
  return /cdn\.segment\.com|ERR_BLOCKED_BY_CLIENT|apple-mobile-web-app-capable is deprecated|Copilot in Edge/i.test(message);
}

function collectRuntimeErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    const text = message.text();
    if (message.type() === 'error' && !isKnownExternalNoise(text)) errors.push(text);
  });
  return errors;
}

async function ensureAppBooted(page) {
  if (page.url() === 'about:blank') await page.goto('./');
  await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', /.+/, { timeout: 10_000 });
  await expect(page.locator('#app')).not.toHaveAttribute('aria-busy', /true/);
}

async function gotoModule(page, moduleId) {
  await ensureAppBooted(page);
  await page.evaluate(id => { window.location.hash = `#/${id}`; }, moduleId);
  await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', moduleId, { timeout: 10_000 });
  await expect(page.locator('#app')).not.toHaveAttribute('aria-busy', /true/);
}

async function fillMixedAirReferenceValues(page) {
  const values = {
    mixingOutdoorVolumeFlowM3h: '1000',
    mixingOutdoorTemp: '-8',
    mixingOutdoorRh: '85',
    mixingRecircVolumeFlowM3h: '2000',
    mixingRecircTemp: '22',
    mixingRecircRh: '45'
  };

  for (const [field, value] of Object.entries(values)) {
    const input = page.locator(`[data-field="${field}"]`).first();
    await expect(input).toBeVisible();
    await input.fill(value);
    await input.press('Tab');
  }
}

async function openPdfSettings(page) {
  await page.locator('#settingsButton').click();
  await expect(page.locator('#settingsPanel')).toHaveClass(/is-open/);
  const pdfDetails = page.locator('#settingsPanel details').filter({ hasText: /PDF-Export/ }).first();
  if (!(await pdfDetails.evaluate(node => node.open))) {
    await pdfDetails.locator('summary').click();
  }
}

test.describe('Phase 46D mixed-air E2E coverage', () => {
  test('mixed-air calculation can be saved as a module record', async ({ page }) => {
    const errors = collectRuntimeErrors(page);
    await gotoModule(page, 'mixed-air');

    await fillMixedAirReferenceValues(page);
    await page.locator('#activeMixedAirName').fill('Mischluft E2E');
    await page.getByRole('button', { name: /^Speichern$/ }).click();

    await expect(page.locator('#app')).toContainText('Mischluft E2E');
    await expect(page.locator('#app')).toContainText(/m³\/h|Mischluft/i);
    expect(errors).toEqual([]);
  });

  test('legacy WRG/Mischluft project separates saved records into both modules', async ({ page }) => {
    const errors = collectRuntimeErrors(page);
    await gotoModule(page, 'mixed-air');

    await page.setInputFiles('#openProjectFile', path.resolve('tests/fixtures/legacy-1.3.2-wrg-mixed-air.tcproj'));
    await expect(page.locator('#projectFileLabel')).toContainText(/legacy-1\.3\.2-wrg-mixed-air/i);

    await gotoModule(page, 'mixed-air');
    await expect(page.locator('[data-field="mixingOutdoorVolumeFlowM3h"]')).toHaveValue('1000');
    await expect(page.locator('[data-field="mixingRecircTemp"]')).toHaveValue('22');
    await expect(page.locator('#app')).toContainText('Mischluft Bestand');

    await gotoModule(page, 'heat-recovery');
    await expect(page.locator('#app')).toContainText('WRG Bestand');
    await expect(page.locator('#app')).not.toContainText('Mischluft Bestand');
    expect(errors).toEqual([]);
  });

  test('mixed-air project and PDF exports create downloadable artifacts', async ({ page }) => {
    const errors = collectRuntimeErrors(page);
    await gotoModule(page, 'mixed-air');
    await fillMixedAirReferenceValues(page);

    await page.evaluate(() => { window.showSaveFilePicker = undefined; });

    const projectDownload = page.waitForEvent('download');
    await expect(page.locator('#saveProjectButton')).toBeVisible();
    await page.locator('#saveProjectButton').click();
    await expect((await projectDownload).suggestedFilename()).toMatch(/\.tcproj$/);

    await openPdfSettings(page);
    const pdfDownload = page.waitForEvent('download');
    await expect(page.locator('#exportPdfButton')).toBeVisible();
    await page.locator('#exportPdfButton').click();
    await expect((await pdfDownload).suggestedFilename()).toMatch(/\.pdf$/);
    expect(errors).toEqual([]);
  });
});