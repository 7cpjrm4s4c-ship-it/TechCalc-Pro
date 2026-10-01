import { test, expect } from '@playwright/test';

async function openDraft(page, kind) {
  await page.goto('/');
  await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', 'heating-cooling');
  await page.evaluate(async () => {
    const { navigate } = await import('/core/navigation/router.js');
    await navigate('drinking-water');
  });
  await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', 'drinking-water');
  const accordion = kind === 'unit' ? 'uiUnitFormOpen' : 'uiSingleFormOpen';
  await page.locator(`[data-dw-accordion="${accordion}"] > summary`).click();
  const button = page.locator(`[data-dw-draft-add="${kind}"]`);
  await expect(button).toBeVisible();
  return button;
}

async function draftCount(page, kind) {
  return page.evaluate(async type => {
    const { state } = await import('/modules/drinking-water/state.js');
    return state.get()[type === 'unit' ? 'unitDraftConsumers' : 'singleDraftConsumers'].length;
  }, kind);
}

for (const kind of ['unit', 'single']) {
  test(`${kind}: contact and cancellation do not add; confirmed tap or keyboard activation adds once`, async ({ page, hasTouch }) => {
    const button = await openDraft(page, kind);
    const result = await button.evaluate(element => {
      const start = new Event('touchstart', { bubbles: true, cancelable: true });
      element.dispatchEvent(start);
      element.dispatchEvent(new Event('touchmove', { bubbles: true, cancelable: true }));
      element.dispatchEvent(new Event('touchcancel', { bubbles: true }));
      element.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch' }));
      element.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerType: 'touch' }));
      return start.defaultPrevented;
    });
    expect(result).toBe(false);
    expect(await draftCount(page, kind)).toBe(0);
    // Keep an input focused to exercise the native blur/commit path before activation.
    await page.locator(`[data-field="${kind}Count"]`).fill('2');
    if (hasTouch) await button.tap();
    else { await button.focus(); await page.keyboard.press('Space'); }
    await expect.poll(() => draftCount(page, kind)).toBe(1);
    const quantity = await page.evaluate(async type => {
      const { state } = await import('/modules/drinking-water/state.js');
      return state.get()[type === 'unit' ? 'unitDraftConsumers' : 'singleDraftConsumers'][0].count;
    }, kind);
    expect(quantity).toBe(2);
  });
}

test('native swipe starting on the add button scrolls without adding a consumer', async ({ page, browserName, hasTouch }) => {
  test.skip(browserName !== 'chromium' || !hasTouch, 'Native touch gesture injection uses Chromium CDP.');
  const button = await openDraft(page, 'unit');
  await page.locator('#app').evaluate(root => {
    const spacer = document.createElement('div');
    spacer.style.height = '1600px';
    root.append(spacer);
  });
  await button.scrollIntoViewIfNeeded();
  const positions = () => page.evaluate(() => [document.scrollingElement, ...document.querySelectorAll('.app-main, #app, .module-view, .module-content')].map(element => element.scrollTop));
  const before = await positions();
  const box = await button.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const session = await page.context().newCDPSession(page);
  try {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let step = 1; step <= 8; step++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.max(5, y - step * 20) }] });
      await page.waitForTimeout(16);
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    expect(await draftCount(page, 'unit')).toBe(0);
    await expect.poll(positions).not.toEqual(before);
  } finally { await session.detach(); }
});
