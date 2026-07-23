import { test, expect } from '@playwright/test';

const SUPPORTED_PROJECTS = new Set([
  'chromium-desktop',
  'firefox-desktop',
  'chromium-tablet',
  'webkit-tablet'
]);

async function seedPreferredModule(page, moduleId = 'flooding-verification') {
  await page.addInitScript(id => {
    localStorage.setItem('techcalc-preferences', JSON.stringify({
      mobileQuickAccess: [id, 'heating-cooling', 'ventilation', 'pipe-sizing']
    }));
  }, moduleId);
}

async function openApp(page) {
  await page.goto('/');
  await expect(page.locator('#app [data-module="flooding-verification"], #app .module-view[data-module="flooding-verification"]')).toBeVisible();
  await page.waitForLoadState('networkidle');
}

async function firstAlternativeModuleButton(page) {
  const direct = page.locator('.module-nav [data-module-id]:not([data-module-id="flooding-verification"])').first();
  if (await direct.count()) return direct;

  await page.locator('[data-overflow]').click();
  return page.locator('#overflowMenu [data-module-id]:not([data-module-id="flooding-verification"])').first();
}

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(!SUPPORTED_PROJECTS.has(testInfo.project.name), 'Desktop-/Tablet-Teilgate');
  await seedPreferredModule(page);
});

test('startet mit dem obersten Modul der Moduleinstellungen', async ({ page }) => {
  await openApp(page);
  expect(new URL(page.url()).hash).toBe('#/flooding-verification');
  await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', 'flooding-verification');
});

test('setzt beim Modulwechsel alle relevanten Scrollhosts nach oben', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => {
    document.body.style.minHeight = '2400px';
    window.scrollTo(0, 900);
    document.documentElement.scrollTop = 900;
    document.body.scrollTop = 900;
    const app = document.getElementById('app');
    if (app) app.scrollTop = 500;
  });

  const button = await firstAlternativeModuleButton(page);
  await expect(button).toBeVisible();
  await button.click();
  await expect.poll(() => page.evaluate(() => document.getElementById('app')?.dataset.activeModuleId || '')).not.toBe('flooding-verification');

  await expect.poll(() => page.evaluate(() => ({
    windowY: window.scrollY,
    rootY: document.documentElement.scrollTop,
    bodyY: document.body.scrollTop,
    appY: document.getElementById('app')?.scrollTop || 0
  }))).toEqual({ windowY: 0, rootY: 0, bodyY: 0, appY: 0 });
});

test('behält die vertikale Position nach dem Mount ohne verzögerten Nachsprung', async ({ page }) => {
  await openApp(page);
  await page.evaluate(() => window.scrollTo(0, 700));

  const button = await firstAlternativeModuleButton(page);
  await expect(button).toBeVisible();
  await button.click();
  await expect.poll(() => page.evaluate(() => document.getElementById('app')?.dataset.activeModuleId || '')).not.toBe('flooding-verification');

  const samples = [];
  for (const delay of [0, 50, 140, 300, 600]) {
    if (delay) await page.waitForTimeout(delay - (samples.at(-1)?.delay || 0));
    samples.push({ delay, value: await page.evaluate(() => window.scrollY) });
  }
  expect(samples.map(sample => sample.value), JSON.stringify(samples)).toEqual([0, 0, 0, 0, 0]);
});

test('verschiebt die Moduloberkante während der Einblendung nicht', async ({ page }) => {
  await openApp(page);
  const button = await firstAlternativeModuleButton(page);
  await expect(button).toBeVisible();
  await button.click();
  await expect.poll(() => page.evaluate(() => document.querySelector('#app .module-view')?.getBoundingClientRect().top ?? null)).not.toBeNull();

  const positions = [];
  for (const delay of [0, 30, 80, 160, 260]) {
    if (delay) await page.waitForTimeout(delay - (positions.at(-1)?.delay || 0));
    positions.push({
      delay,
      top: await page.evaluate(() => document.querySelector('#app .module-view')?.getBoundingClientRect().top ?? null),
      transform: await page.evaluate(() => getComputedStyle(document.querySelector('#app .module-view')).transform)
    });
  }

  const tops = positions.map(sample => sample.top);
  expect(Math.max(...tops) - Math.min(...tops), JSON.stringify(positions)).toBeLessThanOrEqual(0.5);
  expect(positions.every(sample => sample.transform === 'none'), JSON.stringify(positions)).toBe(true);
});

test('verwendet für direkte Card-Geschwister ausschließlich den zentralen vertikalen Abstand', async ({ page }) => {
  await openApp(page);
  const moduleIds = await page.locator('[data-module-id]').evaluateAll(elements =>
    [...new Set(elements.map(element => element.dataset.moduleId).filter(Boolean))]
  );
  const violations = [];

  for (const moduleId of moduleIds) {
    await page.evaluate(id => { window.location.hash = `#/${id}`; }, moduleId);
    await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', moduleId);

    const moduleViolations = await page.locator('#app').evaluate((root, id) => {
      const expected = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tc-card-stack-gap'));
      const cardClasses = ['card', 'tc-card', 'result-card'];
      const rows = [];
      root.querySelectorAll('.module-view, .module-content, .tc-stack, .tc-stack--section, .card-grid, .form-grid, .result-group').forEach(container => {
        const cards = [...container.children].filter(element =>
          cardClasses.some(className => element.classList.contains(className)) && element.getBoundingClientRect().height > 0
        );
        for (let index = 1; index < cards.length; index += 1) {
          const previous = cards[index - 1].getBoundingClientRect();
          const current = cards[index].getBoundingClientRect();
          if (current.top < previous.bottom) continue;
          const distance = current.top - previous.bottom;
          if (Math.abs(distance - expected) > 1) rows.push({ id, distance, expected, className: container.className });
        }
      });
      return rows;
    }, moduleId);
    violations.push(...moduleViolations);
  }

  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
});

test('schließt beim Beenden des Hauptmenüs alle Menü-Cards', async ({ page }) => {
  await openApp(page);
  await page.locator('#settingsButton').click();
  const firstDetails = page.locator('#settingsPanel details.settings-submenu').first();
  await firstDetails.locator('summary').click();
  await expect(firstDetails).toHaveAttribute('open', '');

  await page.locator('#closeSettings').click();
  await page.locator('#settingsButton').click();
  await expect(page.locator('#settingsPanel details.settings-submenu[open]')).toHaveCount(0);
});

test('aktiviert nach einer Eingabe den nativen Verlassen-Hinweis', async ({ page }) => {
  await openApp(page);
  const input = page.locator('#app input:not([type="hidden"]):not([disabled]), #app textarea:not([disabled]), #app select:not([disabled])').first();
  await expect(input).toBeVisible();

  const tagName = await input.evaluate(element => element.tagName.toLowerCase());
  if (tagName === 'select') {
    const options = await input.locator('option').evaluateAll(items => items.map(item => item.value).filter(Boolean));
    if (options.length) await input.selectOption(options.at(-1));
    else await input.dispatchEvent('change');
  } else {
    await input.fill('47D Regression');
  }

  const guardResult = await page.evaluate(() => {
    const event = new Event('beforeunload', { cancelable: true });
    const dispatchResult = window.dispatchEvent(event);
    return {
      dispatchResult,
      defaultPrevented: event.defaultPrevented,
      returnValue: event.returnValue
    };
  });

  expect(guardResult.dispatchResult).toBe(false);
  expect(guardResult.defaultPrevented).toBe(true);
});

test('hat in Desktop- und Tablet-Viewports keinen horizontalen Seitenüberlauf', async ({ page }) => {
  await openApp(page);
  const overflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.body.scrollWidth - document.body.clientWidth,
    app: document.getElementById('app')?.scrollWidth - document.getElementById('app')?.clientWidth || 0
  }));
  expect(overflow.document).toBeLessThanOrEqual(1);
  expect(overflow.body).toBeLessThanOrEqual(1);
  expect(overflow.app).toBeLessThanOrEqual(1);
});