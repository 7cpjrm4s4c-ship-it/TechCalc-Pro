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

test('more modules announces its open state and resets after outside click', async ({ page }) => {
  await page.goto('/');
  const more = page.locator('#primaryNav [data-overflow]');
  await expect(more).toHaveText(/Mehr/);
  await more.focus();
  await page.keyboard.press('Enter');
  await expect(more).toHaveAttribute('aria-expanded', 'true');
  await expect(more).toHaveAttribute('aria-label', 'Weitere Module schließen');
  await page.locator('.app-header .brand').click();
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await expect(more).toHaveAttribute('aria-label', 'Weitere Module öffnen');
});

test('long F-Gases legal references remain available behind keyboard-operated disclosure', async ({ page }) => {
  await page.goto('/#/f-gases-check');
  const sources = page.locator('.tc-warning__sources').first();
  await expect(sources).toBeVisible();
  await expect(sources).not.toHaveAttribute('open', '');
  await sources.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(sources).toHaveAttribute('open', '');
  await expect(sources.locator('p')).toContainText('Verordnung (EU) 2024/573');
});
