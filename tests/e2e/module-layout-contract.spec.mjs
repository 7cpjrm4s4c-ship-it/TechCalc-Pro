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

    const viewLeftInset = viewRect && appRect ? viewRect.left - appRect.left : 0;
    const viewRightInset = viewRect && appRect ? appRect.right - viewRect.right : 0;

    // Central select sizing contract: within one field grid every visible select
    // matches its siblings in width and height and fills its control shell.
    const selectSizeViolations = [];
    root.querySelectorAll('.tc-fields').forEach(grid => {
      const selects = [...grid.querySelectorAll('select')].filter(element => element.getBoundingClientRect().height > 0 && !element.classList.contains('unit-select'));
      if (selects.length < 2) return;
      const reference = selects[0].getBoundingClientRect();
      for (const element of selects.slice(1)) {
        const box = element.getBoundingClientRect();
        const fieldId = element.id || element.getAttribute('data-schema-field') || '';
        if (Math.abs(box.height - reference.height) > tolerance) {
          selectSizeViolations.push({ grid: grid.className, field: fieldId, height: box.height, referenceHeight: reference.height });
        }
        if (Math.abs(box.width - reference.width) > tolerance * 2) {
          selectSizeViolations.push({ grid: grid.className, field: fieldId, width: box.width, referenceWidth: reference.width });
        }
      }
    });

    // Field-box telemetry + contract: measure the whole field container (label + control),
    // not only the select element. Windows font rasterization (Segoe UI) can wrap an
    // uppercase 12 px label into two lines where macOS keeps one; without a common label
    // min-height the control shell then starts at a different y per row and the fields
    // read as "differently sized". Within one grid row (same y group, tolerance 4 px) the
    // field-container heights must not differ by more than 2 px.
    const fieldBoxes = [];
    const fieldBoxViolations = [];
    root.querySelectorAll('.tc-fields').forEach(grid => {
      const fields = [...grid.querySelectorAll('[data-schema-field-wrapper]')]
        .map(wrapper => {
          const select = wrapper.querySelector('select:not(.unit-select)');
          if (!select || select.getBoundingClientRect().height <= 0) return null;
          const sb = select.getBoundingClientRect();
          const fb = wrapper.getBoundingClientRect();
          return {
            id: select.id || wrapper.getAttribute('data-schema-field-wrapper') || '',
            select: { x: sb.x, y: sb.y, width: sb.width, height: sb.height },
            field: { x: fb.x, y: fb.y, width: fb.width, height: fb.height }
          };
        })
        .filter(Boolean);
      fieldBoxes.push({ grid: grid.className, fields });
      const rowGroups = new Map();
      for (const entry of fields) {
        const existingKey = [...rowGroups.keys()].find(y => Math.abs(y - entry.field.y) <= 4);
        const groupKey = existingKey === undefined ? entry.field.y : existingKey;
        if (!rowGroups.has(groupKey)) rowGroups.set(groupKey, []);
        rowGroups.get(groupKey).push(entry);
      }
      for (const [rowY, entries] of rowGroups) {
        if (entries.length < 2) continue;
        const heights = entries.map(entry => entry.field.height);
        if (Math.max(...heights) - Math.min(...heights) > 2) {
          fieldBoxViolations.push({ grid: grid.className, rowY, heights, fields: entries.map(entry => entry.id) });
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
      viewLeftInset,
      viewRightInset,
      columnRects: columns.map(column => {
        const box = column.getBoundingClientRect();
        return { left: box.left, top: box.top, width: box.width };
      }),
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      bodyOverflow: document.body.scrollWidth - document.body.clientWidth,
      appOverflow: root.scrollWidth - root.clientWidth,
      stackViolations,
      selectSizeViolations,
      fieldBoxes,
      fieldBoxViolations
    };
  });
}

function assertLayout(measurement, context, enforceFieldBoxes = false) {
  expect(measurement.viewExists, context).toBe(true);
  expect(measurement.rootExists, context).toBe(true);
  expect(measurement.layoutExists, context).toBe(true);
  expect(measurement.columnCount, context).toBeGreaterThanOrEqual(1);

  expect(measurement.viewLeftInset, context).toBeGreaterThanOrEqual(0);
  expect(measurement.viewRightInset, context).toBeGreaterThanOrEqual(0);
  expect(Math.abs(measurement.viewLeftInset - measurement.viewRightInset), context).toBeLessThanOrEqual(2);
  expect(Math.abs(measurement.viewWidth + measurement.viewLeftInset + measurement.viewRightInset - measurement.appWidth), context).toBeLessThanOrEqual(2);
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
  expect(measurement.selectSizeViolations, context).toEqual([]);
  // Field-box height contract is enforced on chromium-desktop first; the Windows/Edge
  // run (msedge-desktop) reports the measured values before this becomes a hard gate there.
  if (enforceFieldBoxes) expect(measurement.fieldBoxViolations, context).toEqual([]);
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

    const enforceFieldBoxes = testInfo.project.name === 'chromium-desktop';
    const before = await measureLayout(page);
    assertLayout(before, `${testInfo.project.name}/${moduleId}/initial\n${JSON.stringify(before, null, 2)}`, enforceFieldBoxes);

    if (moduleId === 'f-gases-check') {
      // Dedicated telemetry for the reported fields of the "Regelrelevante Eigenschaften"
      // card (data only, no assertion): field-container and control rects for the named
      // fields plus a neighbour, so the Windows/Edge run can be compared numerically.
      const fieldReport = await page.evaluate(() => {
        const ids = ['leakDetectionSystemStatus', 'coolingBelowMinus50Status', 'specificRefrigerantLossPercent', 'hermeticallySealedStatus'];
        return ids.map(id => {
          const wrapper = document.querySelector(`[data-schema-field-wrapper="${id}"]`);
          const control = wrapper?.querySelector('select, input');
          const cb = control?.getBoundingClientRect();
          const fb = wrapper?.getBoundingClientRect();
          return {
            id,
            field: fb ? { x: Math.round(fb.x * 10) / 10, y: Math.round(fb.y * 10) / 10, width: Math.round(fb.width * 10) / 10, height: Math.round(fb.height * 10) / 10 } : null,
            control: cb ? { x: Math.round(cb.x * 10) / 10, y: Math.round(cb.y * 10) / 10, width: Math.round(cb.width * 10) / 10, height: Math.round(cb.height * 10) / 10 } : null
          };
        });
      });
      console.log(`f-gases-check regulatory grid field boxes: ${JSON.stringify(fieldReport)}`);
      testInfo.annotations.push({ type: 'f-gases-field-boxes', description: JSON.stringify(fieldReport) });
    }

    const changed = await mutateFirstEditableControl(page);
    if (!changed) continue;

    const after = await measureLayout(page);
    assertLayout(after, `${testInfo.project.name}/${moduleId}/after-change\n${JSON.stringify(after, null, 2)}`, enforceFieldBoxes);
    expect(Math.abs(after.viewWidth - before.viewWidth), moduleId).toBeLessThanOrEqual(2);
    expect(Math.abs(after.layoutWidth - before.layoutWidth), moduleId).toBeLessThanOrEqual(2);
  }
});
