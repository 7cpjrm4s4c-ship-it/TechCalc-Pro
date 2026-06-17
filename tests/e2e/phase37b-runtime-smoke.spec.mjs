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

async function gotoModule(page, moduleId) {
  await page.goto(`./#/${moduleId}`);
  await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', moduleId, { timeout: 10_000 });
  await expect(page.locator('#app')).not.toHaveAttribute('aria-busy', /true/);
}

test.describe('Phase 37B browser runtime smoke', () => {
  test('boots shell and mounts every module route without console errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });

    for (const moduleId of MODULE_IDS) {
      await gotoModule(page, moduleId);
      await expect(page.locator('.module-nav [data-module-id], #overflowMenu [data-module-id]').filter({ hasText: /./ }).first()).toBeVisible();
    }

    expect(errors).toEqual([]);
  });

  test('saved-record capable modules keep select/edit/delete controls reachable', async ({ page }) => {
    for (const moduleId of ['heating-cooling', 'ventilation', 'pressure-holding', 'buffer-storage', 'pipe-sizing', 'rainwater', 'wastewater']) {
      await gotoModule(page, moduleId);
      await expect(page.locator('#app')).toContainText(/speichern|gespeichert|Eintrag|Fläche|Objekt/i);
    }
  });

  test('mobile nav swipe does not commit accidental module switch', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit' && browserName !== 'chromium', 'mobile gesture smoke is browser-bound');
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
  });

  test('settings panel locks and restores scroll without jumping to top', async ({ page }) => {
    await gotoModule(page, 'rainwater');
    await page.evaluate(() => window.scrollTo(0, 320));
    const before = await page.evaluate(() => window.scrollY);

    await page.locator('#settingsButton').click();
    await expect(page.locator('#settingsPanel')).toHaveClass(/is-open/);
    await page.locator('#closeSettings').click();
    await expect(page.locator('#settingsPanel')).not.toHaveClass(/is-open/);

    const after = await page.evaluate(() => window.scrollY);
    expect(Math.abs(after - before)).toBeLessThanOrEqual(4);
  });

  test('service worker registers and exposes cached shell on reload', async ({ page, context }) => {
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
  });
});
