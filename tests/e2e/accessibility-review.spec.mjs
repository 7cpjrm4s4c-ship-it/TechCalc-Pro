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
  await page.goto('/');
  await page.locator('[data-overflow]').click();
  await page.locator('#overflowMenu [data-module-id="f-gases-check"]').click();
  await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', 'f-gases-check');
  const sources = page.locator('.tc-warning__sources').first();
  await expect(sources).toBeVisible();
  await expect(sources).not.toHaveAttribute('open', '');
  await sources.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(sources).toHaveAttribute('open', '');
  await expect(sources.locator('p')).toContainText('Verordnung (EU) 2024/573');
});

test('Tab leaves sign toggles, import actions and save buttons', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', /.+/);
  const gotoModule = async moduleId => {
    const direct = page.locator(`.module-nav [data-module-id="${moduleId}"]`);
    if (await direct.isVisible()) {
      await direct.click();
    } else {
      await page.locator('#primaryNav [data-overflow]').click();
      await page.locator(`#overflowMenu [data-module-id="${moduleId}"]`).click();
    }
    await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', moduleId);
  };
  const checkNextTab = async (locator, key = 'Tab') => {
    await locator.focus();
    await page.keyboard.press(key);
    const focus = await page.evaluate(() => ({
      visible: Boolean(document.activeElement?.getClientRects().length),
      tag: document.activeElement?.tagName
    }));
    await expect(locator).not.toBeFocused();
    expect(focus.visible, `Tab moved to invisible ${focus.tag}`).toBe(true);
  };

  for (const moduleId of ['heating-cooling', 'ventilation', 'mixed-air', 'flooding-verification']) {
    await gotoModule(moduleId);
    const toggles = page.locator('#app .sign-toggle:visible');
    if (await toggles.count()) {
      await checkNextTab(toggles.first());
    }
  }

  const importButton = page.getByRole('button', { name: 'Flächen importieren' });
  await expect(importButton).toBeVisible();
  await checkNextTab(importButton);

  await gotoModule('heating-cooling');
  const saveButton = page.locator('#app button').filter({ hasText: /^Speichern$/ }).first();
  await expect(saveButton).toBeVisible();
  // The save action can be the last focusable control in the module. Reverse
  // traversal verifies that it does not trap focus without depending on how
  // the browser transfers forward focus into its own chrome at the page edge.
  await checkNextTab(saveButton, 'Shift+Tab');
});
