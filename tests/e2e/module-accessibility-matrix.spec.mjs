import { test, expect } from '@playwright/test';

const modules = [
  'heating-cooling', 'ventilation', 'pipe-sizing', 'unit-converter', 'heat-recovery',
  'mixed-air', 'hx-diagram', 'drinking-water', 'pressure-holding', 'buffer-storage',
  'wastewater', 'rainwater', 'flooding-verification', 'f-gases-check', 'en-378-safety-check'
];

test('all rendered module controls have names and valid semantic references', async ({ page }) => {
  for (const moduleId of modules) {
    await page.goto(`/#/${moduleId}`);
    await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', moduleId);
    const issues = await page.evaluate(() => {
      const app = document.getElementById('app');
      const visible = element => element.getClientRects().length > 0 && !element.closest('[hidden],[inert],[aria-hidden="true"]');
      const label = element => Boolean(element.getAttribute('aria-label')?.trim()
        || element.getAttribute('aria-labelledby')?.trim()
        || element.labels?.length
        || element.textContent?.trim()
        || element.getAttribute('title')?.trim());
      const problems = [];
      const ids = new Set();
      for (const element of document.querySelectorAll('[id]')) {
        if (ids.has(element.id)) problems.push(`duplicate id: ${element.id}`);
        ids.add(element.id);
      }
      for (const element of app.querySelectorAll('button,input:not([type="hidden"]),select,textarea,summary,[role="group"]')) {
        if (!visible(element) || element.disabled) continue;
        if (element.getAttribute('role') === 'group' && !element.getAttribute('aria-label')?.trim()) problems.push(`unnamed group ${element.outerHTML.slice(0, 120)}`);
        else if (!label(element)) problems.push(`unnamed ${element.outerHTML.slice(0, 120)}`);
      }
      for (const element of app.querySelectorAll('img')) {
        if (visible(element) && !element.hasAttribute('alt')) problems.push(`image lacks alt: ${element.outerHTML.slice(0, 120)}`);
      }
      for (const element of document.querySelectorAll('[aria-labelledby],[aria-describedby]')) {
        for (const attribute of ['aria-labelledby', 'aria-describedby']) {
          for (const reference of (element.getAttribute(attribute) || '').split(/\s+/).filter(Boolean)) {
            if (!ids.has(reference)) problems.push(`${attribute} points to missing ${reference}`);
          }
        }
      }
      return problems;
    });
    expect(issues, `${moduleId}: ${issues.join('; ')}`).toEqual([]);
  }
  await expect(page.getByRole('heading', { name: 'TechCalc Pro', level: 1 })).toHaveCount(1);
});

test('narrow viewport retains the primary form without page-level horizontal scroll', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const moduleId of ['heating-cooling', 'drinking-water', 'rainwater']) {
    await page.goto(`/#/${moduleId}`);
    await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', moduleId);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${moduleId} overflows the 320px viewport`).toBeLessThanOrEqual(1);
    const clippedControls = await page.locator('#app input, #app select, #app textarea, #app button').evaluateAll(elements =>
      elements.filter(element => element.getClientRects().length && !element.closest('[hidden],[inert]'))
        .filter(element => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && (rect.left < -1 || rect.right > window.innerWidth + 1);
        })
        .map(element => element.outerHTML.slice(0, 120)));
    expect(clippedControls, `${moduleId} has clipped input controls`).toEqual([]);
  }
});

test('theme switch exposes the active pressed button within a named group', async ({ page }) => {
  await page.goto('/');
  await page.locator('#settingsButton').click();
  await page.locator('#settingsPanel summary').nth(3).click();
  const theme = page.getByRole('group', { name: 'Farbschema' });
  await expect(theme).toBeVisible();
  const light = theme.getByRole('button', { name: 'Light' });
  await light.focus();
  await page.keyboard.press('Space');
  await expect(light).toHaveAttribute('aria-pressed', 'true');
  await expect(theme.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'false');
});

test('mobile light theme uses German compound breaks and keeps navigation opaque', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#settingsButton').click();
  await page.locator('#settingsPanel summary').nth(3).click();
  await page.getByRole('group', { name: 'Farbschema' }).getByRole('button', { name: 'Light' }).click();
  await page.getByRole('dialog', { name: 'Einstellungen' }).getByRole('button', { name: 'Schließen' }).click();

  const target = page.getByRole('group', { name: 'Berechnungsgröße' });
  const massFlow = target.getByRole('button', { name: 'ṁ Massenstrom' });
  const hyphenation = await massFlow.evaluate(button => {
    const style = getComputedStyle(button);
    return { label: button.getAttribute('aria-label'), text: button.textContent, hyphens: style.hyphens };
  });
  expect(hyphenation).toEqual({ label: 'ṁ Massenstrom', text: 'ṁ Massen\u00adstrom', hyphens: 'auto' });

  const navStyle = await page.locator('.module-nav').evaluate(nav => {
    const style = getComputedStyle(nav);
    return { background: style.backgroundColor, blur: style.backdropFilter, webkitBlur: style.webkitBackdropFilter };
  });
  expect(navStyle.background).toMatch(/^rgb\(/);
  expect(navStyle.blur).toBe('none');
  if (navStyle.webkitBlur) expect(navStyle.webkitBlur).toBe('none');

  const cardStyle = await page.locator('.card').filter({ has: page.locator('.card__title', { hasText: 'Betriebsart' }) }).first().evaluate(card => {
    const style = getComputedStyle(card);
    return {
      widths: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth],
      blur: style.backdropFilter,
      webkitBlur: style.webkitBackdropFilter
    };
  });
  expect(cardStyle.widths).toEqual(['1px', '1px', '1px', '1px']);
  expect(cardStyle.blur).toBe('none');
  if (cardStyle.webkitBlur) expect(cardStyle.webkitBlur).toBe('none');

  await page.setViewportSize({ width: 320, height: 800 });
  const first = await target.getByRole('button', { name: 'Q Leistung' }).evaluate(button => button.getBoundingClientRect().top);
  const second = await massFlow.evaluate(button => button.getBoundingClientRect().top);
  expect(second).toBeGreaterThan(first);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
