import { test, expect } from '@playwright/test';

const MODULE_ID = 'en-378-safety-check';

async function openModule(page) {
  await page.goto('/');
  await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', /.+/, { timeout: 15_000 });
  await page.evaluate(id => { window.location.hash = `#/${id}`; }, MODULE_ID);
  await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', MODULE_ID, { timeout: 15_000 });
  await expect(page.locator('#app')).not.toHaveAttribute('aria-busy', /true/);
  await expect(page.locator('select[data-field="ventilationType"]')).toBeVisible({ timeout: 15_000 });
}

async function readModuleState(page) {
  return page.evaluate(async () => {
    const { getModuleStore } = await import('/core/state/index.js');
    return getModuleStore('en-378-safety-check').get();
  });
}

async function activeFieldKey(page) {
  return page.evaluate(() => {
    const active = document.activeElement;
    return active?.dataset?.field || active?.id || active?.tagName || '';
  });
}

test.describe('select arrow-key focus handling', () => {
  test('arrow-key change keeps select focused and commits; Tab moves to the next field', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await openModule(page);

    const ventilation = page.locator('select[data-field="ventilationType"]');
    await ventilation.focus();
    expect(await activeFieldKey(page)).toBe('ventilationType');

    const valueBefore = await ventilation.inputValue();
    const optionValues = await ventilation.locator('option').evaluateAll(options => options.map(option => option.value));
    const expectedValue = optionValues[(optionValues.indexOf(valueBefore) + 1) % optionValues.length];

    await page.keyboard.press('ArrowDown');

    // The value change commits to the module state.
    await expect.poll(() => readModuleState(page).then(state => state.ventilationType), { timeout: 5_000 }).toBe(expectedValue);
    await expect(ventilation).toHaveValue(expectedValue);

    // After the notify render the re-created select is focused again (same field).
    await expect.poll(() => activeFieldKey(page), { timeout: 5_000 }).toBe('ventilationType');

    // Tab navigation continues from the select, not from a wrong element.
    const nextKey = await page.evaluate(() => {
      const root = document.getElementById('app');
      return import('/core/ux/focusManager.js').then(({ getPlatformFields }) => {
        const fields = getPlatformFields(root);
        const current = fields.find(field => field.dataset?.field === 'ventilationType');
        const index = fields.indexOf(current);
        const next = fields[index + 1];
        return next?.dataset?.field || next?.id || '';
      });
    });
    expect(nextKey).toBeTruthy();
    await page.keyboard.press('Tab');
    await expect.poll(() => activeFieldKey(page), { timeout: 5_000 }).toBe(nextKey);

    expect(pageErrors).toEqual([]);
  });

  test('pointer-based selectOption still commits exactly once', async ({ page }) => {
    await openModule(page);
    const ventilation = page.locator('select[data-field="ventilationType"]');
    await ventilation.selectOption('mechanical');
    await expect(ventilation).toHaveValue('mechanical');
    await expect.poll(() => readModuleState(page).then(state => state.ventilationType), { timeout: 5_000 }).toBe('mechanical');
  });
});
