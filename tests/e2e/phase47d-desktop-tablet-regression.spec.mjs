import { test, expect } from '@playwright/test';

const SUPPORTED_PROJECTS = new Set([
  'chromium-desktop',
  'firefox-desktop',
  'chromium-tablet',
  'webkit-tablet'
]);

async function seedPreferredModule(page, moduleId = 'flooding-verification') {
  await page.addInitScript(id => {
    localStorage.setItem('techcalc-preferences', JSON.stringify({
      mobileQuickAccess: [id, 'heating-cooling', 'ventilation', 'pipe-sizing']
    }));
  }, moduleId);
}

async function openApp(page) {
  await page.goto('/');
  await expect(page.locator('#app [data-module="flooding-verification"], #app .module-view[data-module="flooding-verification"]')).toBeVisible();
  await page.waitForLoadState('networkidle');
}

async function firstAlternativeModuleButton(page) {
  const direct = page.locator('.module-nav [data-module-id]:not([data-module-id="flooding-verification"])').first();
  if (await direct.count()) return direct;

  await page.locator('[data-overflow]').click();
  return page.locator('#overflowMenu [data-module-id]:not([data-module-id="flooding-verification"])').first();
}

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(!SUPPORTED_PROJECTS.has(testInfo.project.name), 'Desktop-/Tablet-Teilgate');
  await seedPreferredModule(page);
});

test('startet mit dem obersten Modul der Moduleinstellungen', async ({ page }) => {
  await openApp(page);
  expect(new URL(page.url()).hash).toBe('#/flooding-verification');
  await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', 'flooding-verification');
});

test('setzt beim Modulwechsel alle relevanten Scrollhosts nach oben', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => {
    document.body.style.minHeight = '2400px';
    window.scrollTo(0, 900);
    document.documentElement.scrollTop = 900;
    document.body.scrollTop = 900;
    const app = document.getElementById('app');
    if (app) app.scrollTop = 500;
  });

  const button = await firstAlternativeModuleButton(page);
  await expect(button).toBeVisible();
  await button.click();
  await expect.poll(() => page.evaluate(() => document.getElementById('app')?.dataset.activeModuleId || '')).not.toBe('flooding-verification');

  await expect.poll(() => page.evaluate(() => ({
    windowY: window.scrollY,
    rootY: document.documentElement.scrollTop,
    bodyY: document.body.scrollTop,
    appY: document.getElementById('app')?.scrollTop || 0
  }))).toEqual({ windowY: 0, rootY: 0, bodyY: 0, appY: 0 });
});

test('schließt beim Beenden des Hauptmenüs alle Menü-Cards', async ({ page }) => {
  await openApp(page);
  await page.locator('#settingsButton').click();
  const firstDetails = page.locator('#settingsPanel details.settings-submenu').first();
  await firstDetails.locator('summary').click();
  await expect(firstDetails).toHaveAttribute('open', '');

  await page.locator('#closeSettings').click();
  await page.locator('#settingsButton').click();
  await expect(page.locator('#settingsPanel details.settings-submenu[open]')).toHaveCount(0);
});

test('aktiviert nach einer Eingabe den nativen Verlassen-Hinweis', async ({ page }) => {
  await openApp(page);
  const input = page.locator('#app input:not([type="hidden"]):not([disabled]), #app textarea:not([disabled]), #app select:not([disabled])').first();
  await expect(input).toBeVisible();

  const tagName = await input.evaluate(element => element.tagName.toLowerCase());
  if (tagName === 'select') {
    const options = await input.locator('option').evaluateAll(items => items.map(item => item.value).filter(Boolean));
    if (options.length) await input.selectOption(options.at(-1));
    else await input.dispatchEvent('change');
  } else {
    await input.fill('47D Regression');
  }

  const dialogPromise = page.waitForEvent('dialog');
  const reloadPromise = page.reload({ waitUntil: 'domcontentloaded' });
  const dialog = await dialogPromise;
  expect(dialog.type()).toBe('beforeunload');
  await dialog.accept();
  await reloadPromise;
});

test('hat in Desktop- und Tablet-Viewports keinen horizontalen Seitenüberlauf', async ({ page }) => {
  await openApp(page);
  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.body.clientWidth,
    app: document.getElementById('app')?.scrollWidth - document.getElementById('app')?.clientWidth || 0
  }));
  expect(overflow.document).toBeLessThanOrEqual(1);
  expect(overflow.body).toBeLessThanOrEqual(1);
  expect(overflow.app).toBeLessThanOrEqual(1);
});
