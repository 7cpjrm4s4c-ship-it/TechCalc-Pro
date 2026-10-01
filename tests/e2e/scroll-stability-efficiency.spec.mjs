import { test, expect } from '@playwright/test';

test('scroll restoration respects user input and module unmount', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', 'heating-cooling');
  const result = await page.evaluate(async () => {
    const { restoreViewportStable, restoreViewport, cancelViewportRestoration } = await import('/core/ui/renderer.js');
    const spacer = document.createElement('div');
    spacer.style.height = '3000px';
    document.body.append(spacer);
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const nativeScroll = window.scrollTo.bind(window);
    let calls = 0;
    window.scrollTo = (...args) => { calls++; return nativeScroll(...args); };
    try {
      nativeScroll(0, 200);
      await wait(50);
      restoreViewport({ x: window.scrollX, y: window.scrollY });
      const unchangedCalls = calls;
      restoreViewportStable({ x: 0, y: 100 }, { frames: 8, delays: [40, 120, 260] });
      window.dispatchEvent(new WheelEvent('wheel'));
      nativeScroll(0, 300);
      await wait(350);
      const afterWheel = window.scrollY;
      restoreViewportStable({ x: 0, y: 100 }, { frames: 8, delays: [40, 120, 260] });
      document.getElementById('app').dispatchEvent(new CustomEvent('techcalc:module-before-unmount', { bubbles: false }));
      nativeScroll(0, 400);
      await wait(350);
      return { unchangedCalls, afterWheel, afterUnmount: window.scrollY };
    } finally {
      cancelViewportRestoration();
      window.scrollTo = nativeScroll;
      spacer.remove();
    }
  });
  expect(result.unchangedCalls).toBe(0);
  expect(result.afterWheel).toBe(300);
  expect(result.afterUnmount).toBe(400);
});

test('rapid module changes settle at the top without repeated scroll writes', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', 'heating-cooling');
  await page.evaluate(async () => {
    const { navigate } = await import('/core/navigation/router.js');
    window.scrollTo(0, 600);
    await Promise.all([navigate('ventilation'), navigate('pipe-sizing')]);
  });
  await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', 'pipe-sizing');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  const calls = await page.evaluate(async () => {
    const { resetModuleScroll } = await import('/core/ux/scrollManager.js');
    const original = window.scrollTo;
    let count = 0;
    window.scrollTo = (...args) => { count++; original.apply(window, args); };
    try {
      resetModuleScroll(document.getElementById('app'));
      resetModuleScroll(document.getElementById('app'));
      return count;
    } finally { window.scrollTo = original; }
  });
  expect(calls).toBe(0);
});
