import { test, expect } from '@playwright/test';

const MODULE_IDS = [
  'heating-cooling',
  'ventilation',
  'pressure-holding',
  'buffer-storage',
  'heat-recovery',
  'hx-diagram',
  'pipe-sizing',
  'unit-converter',
  'drinking-water',
  'wastewater',
  'rainwater'
];

const SAVED_RECORD_MODULE_IDS = [
  'heating-cooling',
  'ventilation',
  'pressure-holding',
  'buffer-storage',
  'pipe-sizing',
  'drinking-water',
  'wastewater',
  'rainwater'
];

const DYNAMIC_RENDERER_MODULE_IDS = [
  'heating-cooling',
  'pressure-holding',
  'buffer-storage',
  'pipe-sizing',
  'unit-converter',
  'drinking-water',
  'wastewater',
  'rainwater'
];

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

async function gotoModule(page, moduleId) {
  await page.goto(`./#/${moduleId}`);
  await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', moduleId, { timeout: 10_000 });
  await expect(page.locator('#app')).not.toHaveAttribute('aria-busy', /true/);
}

async function commitFirstEditableField(page) {
  const field = page.locator('input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])').first();
  if (await field.count() === 0) return false;
  await field.focus();
  await page.keyboard.press('Tab');
  return true;
}

test.describe('Phase 37B browser runtime smoke', () => {
  test('boots shell and mounts every module route without app console errors', async ({ page }) => {
    const errors = collectRuntimeErrors(page);

    for (const moduleId of MODULE_IDS) {
      await gotoModule(page, moduleId);
      await expect(page.locator('.module-nav [data-module-id], #overflowMenu [data-module-id]').filter({ hasText: /./ }).first()).toBeVisible();
    }

    expect(errors).toEqual([]);
  });

  test('saved-record capable modules keep select/edit/delete controls reachable', async ({ page }) => {
    const errors = collectRuntimeErrors(page);

    for (const moduleId of SAVED_RECORD_MODULE_IDS) {
      await gotoModule(page, moduleId);
      await expect(page.locator('#app')).toContainText(/speichern|gespeichert|Eintrag|Fläche|Objekt|Gruppe/i);
      await expect(page.locator('button, [role="button"]').filter({ hasText: /Speichern/i }).first()).toBeVisible();
    }

    expect(errors).toEqual([]);
  });

  test('dynamic-renderer modules survive a field commit without runtime errors', async ({ page }) => {
    const errors = collectRuntimeErrors(page);

    for (const moduleId of DYNAMIC_RENDERER_MODULE_IDS) {
      await gotoModule(page, moduleId);
      await commitFirstEditableField(page);
      await page.waitForTimeout(50);
      await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', moduleId);
    }

    expect(errors).toEqual([]);
  });

  test('enter and tab field navigation keep focus inside the active module', async ({ page }) => {
    const errors = collectRuntimeErrors(page);
    await gotoModule(page, 'hx-diagram');

    const editable = page.locator('input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])');
    const count = await editable.count();
    test.skip(count < 2, 'module does not expose at least two editable fields in this viewport');

    await editable.nth(0).focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');

    const activeIsInsideApp = await page.evaluate(() => Boolean(document.activeElement && document.querySelector('#app')?.contains(document.activeElement)));
    expect(activeIsInsideApp).toBe(true);
    expect(errors).toEqual([]);
  });

  test('mobile nav swipe does not commit accidental module switch', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit' && browserName !== 'chromium', 'mobile gesture smoke is browser-bound');
    const errors = collectRuntimeErrors(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoModule(page, 'heating-cooling');

    const firstNav = page.locator('.module-nav').first();
    await expect(firstNav).toBeVisible();
    const box = await firstNav.boundingBox();
    expect(box).toBeTruthy();

    await page.mouse.move(box.x + 40, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 160, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();

    await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', 'heating-cooling');
    expect(errors).toEqual([]);
  });

  test('settings panel locks and restores scroll without jumping to top', async ({ page }) => {
    const errors = collectRuntimeErrors(page);
    await gotoModule(page, 'rainwater');
    await page.evaluate(() => window.scrollTo(0, 320));
    const before = await page.evaluate(() => window.scrollY);

    await page.locator('#settingsButton').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/is-open/);
    await page.locator('#closeSettings').click();
    await expect(page.locator('#settingsPanel')).not.toHaveClass(/is-open/);

    const after = await page.evaluate(() => window.scrollY);
    expect(Math.abs(after - before)).toBeLessThanOrEqual(4);
    expect(errors).toEqual([]);
  });

  test('service worker registers and exposes cached shell on reload', async ({ page, context }) => {
    const errors = collectRuntimeErrors(page);
    await gotoModule(page, 'rainwater');
    const hasServiceWorker = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const registration = await navigator.serviceWorker.ready;
      return Boolean(registration?.active || registration?.installing || registration?.waiting);
    });
    expect(hasServiceWorker).toBe(true);

    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#app')).toBeVisible();
    await context.setOffline(false);
    expect(errors).toEqual([]);
  });

  test('offline reload keeps every module route available after initial cache warmup', async ({ page, context }) => {
    const errors = collectRuntimeErrors(page);

    for (const moduleId of MODULE_IDS) {
      await gotoModule(page, moduleId);
    }

    const hasServiceWorker = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      const registration = await navigator.serviceWorker.ready;
      return Boolean(registration?.active || registration?.installing || registration?.waiting);
    });
    expect(hasServiceWorker).toBe(true);

    await context.setOffline(true);
    for (const moduleId of MODULE_IDS) {
      await page.goto(`./#/${moduleId}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', moduleId, { timeout: 10_000 });
      await expect(page.locator('#app')).toBeVisible();
    }
    await context.setOffline(false);

    expect(errors).toEqual([]);
  });

});
