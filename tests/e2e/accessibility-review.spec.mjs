import { test, expect } from '@playwright/test';

test('settings contain keyboard focus and restore it on close', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#app [data-segment]').first()).toBeVisible();
  const opener = page.locator('#settingsButton');
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Einstellungen' });
  await expect(dialog).toBeVisible();
  const close = dialog.getByRole('button', { name: 'Schließen', exact: true });
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await expect(page.locator('#app')).toHaveAttribute('inert', '');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(page.locator('#app')).not.toHaveAttribute('inert', '');
});

test('segment selection exposes state after keyboard activation', async ({ page }) => {
  await page.goto('/');
  // Discover the visible operating-mode group by its user-facing button name.
  const cooling = page.getByRole('button', { name: '● Kälte', exact: true });
  await expect(cooling).toHaveAttribute('aria-pressed', 'false');
  await cooling.focus();
  await page.keyboard.press('Enter');
  await expect(cooling).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: '● Heizung', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#app [role="tablist"]')).toHaveCount(0);
});
