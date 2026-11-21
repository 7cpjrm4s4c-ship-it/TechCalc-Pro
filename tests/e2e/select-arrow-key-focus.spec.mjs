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
  return readStoreState(page, MODULE_ID);
}

async function openModuleById(page, moduleId, selectField) {
  await page.goto('/');
  await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', /.+/, { timeout: 15_000 });
  await page.evaluate(id => { window.location.hash = `#/${id}`; }, moduleId);
  await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', moduleId, { timeout: 15_000 });
  await expect(page.locator('#app')).not.toHaveAttribute('aria-busy', /true/);
  await expect(page.locator(`select[data-field="${selectField}"]`)).toBeVisible({ timeout: 15_000 });
}

async function readStoreState(page, moduleId) {
  return page.evaluate(async id => {
    const { getModuleStore } = await import('/core/state/index.js');
    const store = getModuleStore(id);
    if (store) return store.get();
    // Module without a central module store keep their own state module.
    const moduleState = await import(`/modules/${id}/state.js`);
    return moduleState.state.get();
  }, moduleId);
}

async function instrumentSelectCommits(page) {
  await page.evaluate(() => {
    const root = document.getElementById('app');
    window.__selectCommitActions = [];
    root.addEventListener('tc:commit', event => {
      const detail = event.detail || {};
      if (detail.type === 'field') {
        window.__selectCommitActions.push(`${detail.action}@${detail.field}`);
      }
    });
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

test.describe('select touch commit (mobile picker)', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test('touch selection in EN 378 commits once and does not re-focus the select', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await openModuleById(page, MODULE_ID, 'ventilationType');
    await instrumentSelectCommits(page);

    // Touch/Pointer auf dem Select: tippen, dann Wert im (emulierten) Dialog wählen.
    await page.tap('select[data-field="ventilationType"]');
    await page.locator('select[data-field="ventilationType"]').selectOption('mechanical');

    await expect.poll(() => readStoreState(page, MODULE_ID).then(state => state.ventilationType), { timeout: 5_000 }).toBe('mechanical');
    await expect(page.locator('select[data-field="ventilationType"]')).toHaveValue('mechanical');

    // Kein programmatic Focus auf das Select nach dem Touch-Commit: Der native
    // Auswahldialog darf nicht erneut geöffnet werden.
    await expect.poll(() => activeFieldKey(page), { timeout: 5_000 }).not.toBe('ventilationType');

    // Der Wert wird exakt einmal committet (kein zweites Change-Ereignis, keine Schleife).
    const actions = await page.evaluate(() => window.__selectCommitActions);
    expect(actions.filter(action => action === 'field:input:select@ventilationType')).toHaveLength(1);
    expect(actions.filter(action => action === 'field:change:immediate@ventilationType')).toHaveLength(1);

    expect(pageErrors).toEqual([]);
  });

  test('touch selection in rainwater commits once and does not re-focus the select (kernel-wide)', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await openModuleById(page, 'rainwater', 'drainSize');
    await instrumentSelectCommits(page);

    const drainSize = page.locator('select[data-field="drainSize"]');
    const before = await drainSize.inputValue();
    const optionValues = await drainSize.locator('option').evaluateAll(options => options.map(option => option.value));
    const target = optionValues.find(value => value !== before) || optionValues[0];

    await page.tap('select[data-field="drainSize"]');
    await drainSize.selectOption(target);

    await expect.poll(() => readStoreState(page, 'rainwater').then(state => state.drainSize), { timeout: 5_000 }).toBe(target);
    await expect(drainSize).toHaveValue(target);
    await expect.poll(() => activeFieldKey(page), { timeout: 5_000 }).not.toBe('drainSize');

    // Der Wert wird genau einmal committet: kein wiederholtes Commit, keine Dialog-Schleife.
    const actions = await page.evaluate(() => window.__selectCommitActions);
    const drainSizeCommits = actions.filter(action => action.endsWith('@drainSize'));
    expect(drainSizeCommits.length, `drainSize commits: ${JSON.stringify(actions)}`).toBeGreaterThan(0);
    expect(drainSizeCommits.length, `maximal input+change, kein Doppel-Commit: ${JSON.stringify(actions)}`).toBeLessThanOrEqual(2);
    expect(new Set(drainSizeCommits).size, `kein Commit doppelt (keine Schleife): ${JSON.stringify(actions)}`).toBe(drainSizeCommits.length);

    expect(pageErrors).toEqual([]);
  });
});
