import { test, expect } from '@playwright/test';

test.skip(process.env.STATIC_ROOT !== 'dist', 'deploy artifact test runs against dist/ only');

test('deploy artifact loads one offline-capable stylesheet across modules', async ({ page }) => {
  await page.goto('/#/heating-cooling');
  await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', 'heating-cooling');
  const links = page.locator('link[rel="stylesheet"]');
  await expect(links).toHaveCount(1);
  await expect(links.first()).toHaveAttribute('href', './css/techcalc.bundle.css');
  await expect(page.locator('#app .card')).toHaveCSS('display', 'flex');
  const backgrounds = await page.locator('#app .card').first().evaluate(element => ({
    border: getComputedStyle(element).borderStyle,
    background: getComputedStyle(element).backgroundImage
  }));
  expect(backgrounds.border).not.toBe('none');
  expect(backgrounds.background).not.toBe('none');
  await page.goto('/#/drinking-water');
  await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', 'drinking-water');
  await expect(page.locator('#app .card').first()).toBeVisible();
  await page.goto('/#/heating-cooling');
  await page.locator('#settingsButton').click();
  const dialog = page.getByRole('dialog', { name: 'Einstellungen' });
  await expect(dialog).toBeVisible();
  await expect(page.locator('#app')).toHaveAttribute('inert', '');
});
