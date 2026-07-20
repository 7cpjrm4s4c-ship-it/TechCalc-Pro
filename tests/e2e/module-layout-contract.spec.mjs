import { test, expect } from '@playwright/test';

async function seedPreferences(page) {
  await page.addInitScript(() => {
    localStorage.setItem('techcalc-preferences', JSON.stringify({
      mobileQuickAccess: ['flooding-verification', 'heating-cooling', 'ventilation', 'pipe-sizing']
    }));
  });
}

async function openApp(page) {
  await page.goto('/');
  await expect(page.locator('#app .module-view')).toBeVisible();
  await page.waitForLoadState('networkidle');
}

async function discoverModuleIds(page) {
  return page.locator('[data-module-id]').evaluateAll(elements =>
    [...new Set(elements.map(element => element.dataset.moduleId).filter(Boolean))]
  );
}

async function openModule(page, moduleId) {
  await page.evaluate(id => { window.location.hash = `#/${id}`; }, moduleId);
  await expect(page.locator('#app')).toHaveAttribute('data-active-module-id', moduleId);
  await expect(page.locator('#app .module-view')).toBeVisible();
}

async function mutateFirstEditableControl(page) {
  const control = page.locator('#app input:not([type="hidden"]):not([disabled]):not([readonly]), #app textarea:not([disabled]):not([readonly]), #app select:not([disabled])').first();
  if (!(await control.count()) || !(await control.isVisible())) return false;

  const tagName = await control.evaluate(element => element.tagName.toLowerCase());
  if (tagName === 'select') {
    const current = await control.inputValue();
    const values = await control.locator('option').evaluateAll(options => options.map(option => option.value).filter(Boolean));
    const alternative = values.find(value => value !== current);
    if (!alternative) return false;
    await control.selectOption(alternative);
  } else {
    const current = await control.inputValue();
    const type = await control.getAttribute('type');
    const next = type === 'number' || type === 'range' ? String((Number(current) || 1) + 1) : `${current || 'Test'} 1`;
    await control.fill(next);
    await control.dispatchEvent('change');
  }

  await page.waitForTimeout(80);
  return true;
}

async function measureLayout(page) {
  return page.locator('#app').evaluate(root => {
    const tolerance = 1.5;
    const view = root.querySelector(':scope > .module-view');
    const moduleRoot = view?.querySelector(':scope > .tc-module-root-stack');
    const layout = moduleRoot?.querySelector(':scope > .tc-module-layout');
    const columns = layout ? [...layout.children].filter(element => element.classList.contains('tc-module-column')) : [];
    const viewportWidth = document.documentElement.clientWidth;
    const expectedGap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tc-module-card-gap')) ||
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tc-card-stack-gap')) || 0;

    const rect = element => element?.getBoundingClientRect();
    const viewRect = rect(view);
    const rootRect = rect(moduleRoot);
    const layoutRect = rect(layout);
    const appRect = rect(root);

    const stackViolations = [];
    root.querySelectorAll('.tc-module-column, .tc-module-section, .tc-stack, .tc-stack--section').forEach(container => {
      const visibleChildren = [...container.children].filter(child => child.getBoundingClientRect().height > 0);
      for (let index = 1; index < visibleChildren.length; index += 1) {
        const previous = visibleChildren[index - 1].getBoundingClientRect();
        const current = visibleChildren[index].getBoundingClientRect();
        if (current.top < previous.bottom - tolerance) continue;
        const distance = current.top - previous.bottom;
        if (Math.abs(distance - expectedGap) > tolerance) {
          stackViolations.push({ className: container.className, distance, expectedGap });
        }
      }
    });

    return {
      viewportWidth,
      expectedGap,
      viewExists: Boolean(view),
      rootExists: Boolean(moduleRoot),
      layoutExists: Boolean(layout),
      columnCount: columns.length,
      viewWidth: viewRect?.width || 0,
      rootWidth: rootRect?.width || 0,
      layoutWidth: layoutRect?.width || 0,
      appWidth: appRect?.width || 0,
      viewLeft: viewRect?.left || 0,
      appLeft: appRect?.left || 0,
      columnRects: columns.map(column => {
        const box = column.getBoundingClientRect();
        return { left: box.left, top: box.top, width: box.width };
      }),
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      bodyOverflow: document.body.scrollWidth - document.body.clientWidth,
      appOverflow: root.scrollWidth - root.clientWidth,
      stackViolations
    };
  });
}

function assertLayout(measurement, context) {
  expect(measurement.viewExists, context).toBe(true);
  expect(measurement.rootExists, context).toBe(true);
  expect(measurement.layoutExists, context).toBe(true);
  expect(measurement.columnCount, context).toBeGreaterThanOrEqual(1);

  expect(Math.abs(measurement.viewLeft - measurement.appLeft), context).toBeLessThanOrEqual(2);
  expect(Math.abs(measurement.viewWidth - measurement.appWidth), context).toBeLessThanOrEqual(2);
  expect(Math.abs(measurement.rootWidth - measurement.viewWidth), context).toBeLessThanOrEqual(2);
  expect(Math.abs(measurement.layoutWidth - measurement.rootWidth), context).toBeLessThanOrEqual(2);

  if (measurement.columnCount >= 2) {
    const [first, second] = measurement.columnRects;
    if (measurement.viewportWidth >= 1024) {
      expect(Math.abs(first.top - second.top), context).toBeLessThanOrEqual(2);
      expect(second.left, context).toBeGreaterThan(first.left + first.width - 1);
      expect(Math.abs(first.width - second.width), context).toBeLessThanOrEqual(2);
    } else {
      expect(Math.abs(first.left - second.left), context).toBeLessThanOrEqual(2);
      expect(second.top, context).toBeGreaterThanOrEqual(first.top);
    }
  }

  expect(measurement.documentOverflow, context).toBeLessThanOrEqual(1);
  expect(measurement.bodyOverflow, context).toBeLessThanOrEqual(1);
  expect(measurement.appOverflow, context).toBeLessThanOrEqual(1);
  expect(measurement.stackViolations, context).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await seedPreferences(page);
});

test('hält Layoutbreite, Spalten und Abstände in allen Modulen stabil', async ({ page }, testInfo) => {
  await openApp(page);
  const moduleIds = await discoverModuleIds(page);
  expect(moduleIds.length).toBeGreaterThan(0);

  for (const moduleId of moduleIds) {
    await openModule(page, moduleId);

    const before = await measureLayout(page);
    assertLayout(before, `${testInfo.project.name}/${moduleId}/initial\n${JSON.stringify(before, null, 2)}`);

    const changed = await mutateFirstEditableControl(page);
    if (!changed) continue;

    const after = await measureLayout(page);
    assertLayout(after, `${testInfo.project.name}/${moduleId}/after-change\n${JSON.stringify(after, null, 2)}`);
    expect(Math.abs(after.viewWidth - before.viewWidth), moduleId).toBeLessThanOrEqual(2);
    expect(Math.abs(after.layoutWidth - before.layoutWidth), moduleId).toBeLessThanOrEqual(2);
  }
});
