import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.locator('#settingsButton').click();
  await page.locator('.settings-submenu > summary').filter({ hasText: 'Moduleinstellungen' }).click();
});

test('mouse drag reorders all modules and persists the desktop navigation order', async ({ page }) => {
  const cards = page.locator('#quickAccessSettings .module-order-card');
  await expect(cards).toHaveCount(15);
  const first = await cards.nth(0).getAttribute('data-order-id');
  const third = await cards.nth(2).getAttribute('data-order-id');
  await cards.nth(2).scrollIntoViewIfNeeded();
  const source = await cards.nth(0).boundingBox();
  const target = await cards.nth(2).boundingBox();
  await page.mouse.move(source.x + 45, source.y + source.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x + 45, target.y + target.height * .8, { steps: 8 });
  await page.mouse.up();
  await expect(cards.nth(2)).toHaveAttribute('data-order-id', first);
  await expect(cards.nth(1)).toHaveAttribute('data-order-id', third);
  await page.reload();
  await expect(page.locator('#primaryNav [data-module-id]').first()).toHaveAttribute('data-module-id', await cards.nth(0).getAttribute('data-order-id'));
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('techcalc-preferences')));
  expect(persisted.moduleOrder).toHaveLength(15);
});

test('move buttons keep every module keyboard accessible and update quick accesses', async ({ page }) => {
  const cards = page.locator('#quickAccessSettings .module-order-card');
  const fifth = await cards.nth(4).getAttribute('data-order-id');
  await cards.nth(4).getByRole('button', { name: /nach oben/ }).click();
  await expect(cards.nth(3)).toHaveAttribute('data-order-id', fifth);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('techcalc-preferences')));
  expect(stored.mobileQuickAccess[3]).toBe(fifth);
  expect(await page.locator('#primaryNav [data-module-id]').evaluateAll(items => items.map(item => item.dataset.moduleId))).toContain(fifth);
});
