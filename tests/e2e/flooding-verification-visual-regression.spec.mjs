import { test, expect } from '@playwright/test';

const THEMES = ['dark', 'light', 'system'];
const MODULE_SELECTOR = '.module-view[data-module="flooding-verification"]';

async function openFloodingVerification(page) {
  await page.goto('/#/flooding-verification');
  await expect(page.locator(MODULE_SELECTOR)).toBeVisible();
  await page.waitForLoadState('networkidle');
}

async function applyTheme(page, theme) {
  await page.evaluate(value => {
    const root = document.documentElement;
    if (value === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', value);
  }, theme);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function collectVisualViolations(page) {
  return page.locator(MODULE_SELECTOR).evaluate(root => {
    const tolerance = 1;
    const violations = [];
    const visible = element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };

    const inspectOverflow = (element, label) => {
      if (!visible(element)) return;
      if (element.scrollWidth > element.clientWidth + tolerance) {
        violations.push(`${label}: horizontal overflow ${element.scrollWidth}px > ${element.clientWidth}px`);
      }
      if (element.scrollHeight > element.clientHeight + tolerance && getComputedStyle(element).overflowY === 'hidden') {
        violations.push(`${label}: vertically clipped content`);
      }
    };

    inspectOverflow(document.documentElement, 'document');
    inspectOverflow(document.body, 'body');
    inspectOverflow(root, 'module');

    root.querySelectorAll('.card, .card__body, .result-group, .result-list, .result-row, .inline-stat, .main-result')
      .forEach((element, index) => inspectOverflow(element, `${element.className || element.tagName}[${index}]`));

    root.querySelectorAll('.result-row').forEach((row, index) => {
      if (!visible(row)) return;
      const children = [...row.children].filter(visible);
      if (children.length < 2) return;
      const first = children[0].getBoundingClientRect();
      const second = children[1].getBoundingClientRect();
      const sameVisualRow = Math.abs(first.top - second.top) < Math.min(first.height, second.height);
      if (sameVisualRow && first.right > second.left + tolerance) {
        violations.push(`result-row[${index}]: label/value overlap`);
      }
    });

    root.querySelectorAll('.card').forEach((card, index) => {
      if (!visible(card)) return;
      const cardRect = card.getBoundingClientRect();
      [...card.children].filter(visible).forEach(child => {
        const rect = child.getBoundingClientRect();
        if (rect.left < cardRect.left - tolerance || rect.right > cardRect.right + tolerance) {
          violations.push(`card[${index}]: child outside horizontal card bounds`);
        }
      });
    });

    return violations;
  });
}

test.describe('47C.8.2G flooding verification visual contract', () => {
  for (const theme of THEMES) {
    test(`${theme}: no overflow, clipping or result overlap`, async ({ page }) => {
      await openFloodingVerification(page);
      await applyTheme(page, theme);

      const violations = await collectVisualViolations(page);
      expect(violations, violations.join('\n')).toEqual([]);

      await expect(page.locator(MODULE_SELECTOR)).toHaveScreenshot(
        `flooding-verification-${theme}.png`,
        { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.015 }
      );
    });
  }
});
