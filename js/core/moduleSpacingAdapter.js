const CARD_SELECTOR = [
  '.card',
  '.tc-card',
  '.result-card',
  '.saved-record-card',
  '.line-section-card',
  '.ph-saved-item'
].join(',');

const BASE_STACK_ADAPTERS = Object.freeze([
  { selector: '.module-content', mode: 'card-bearing-items' },
  { selector: '.tc-stack', mode: 'all-items' },
  { selector: '.tc-stack--section', mode: 'all-items' },
  { selector: '.card-grid', mode: 'all-items' },
  { selector: '.result-group', mode: 'all-items' }
]);

const MODULE_STACK_ADAPTERS = Object.freeze({
  'heating-cooling': [],
  ventilation: [],
  'pressure-holding': [{ selector: '.ph-saved-list', mode: 'all-items' }],
  'buffer-storage': [{ selector: '.buffer-saved-list', mode: 'all-items' }],
  'heat-recovery': [
    { selector: '.wrg-flow-column', mode: 'all-items' },
    { selector: '.wrg-desktop-split__input', mode: 'all-items' },
    { selector: '.wrg-desktop-split__output', mode: 'all-items' }
  ],
  'mixed-air': [
    { selector: '.wrg-flow-column', mode: 'all-items' },
    { selector: '.wrg-desktop-split__input', mode: 'all-items' },
    { selector: '.wrg-desktop-split__output', mode: 'all-items' }
  ],
  'hx-diagram': [
    { selector: '.hx-layout__left', mode: 'all-items' },
    { selector: '.hx-layout__right', mode: 'all-items' },
    { selector: '.hx-process-path', mode: 'all-items' },
    { selector: '.hx-history', mode: 'all-items' }
  ],
  'pipe-sizing': [{ selector: '.pipe-dimension-list', mode: 'all-items' }],
  'unit-converter': [],
  'drinking-water': [
    { selector: '.dw-save-dialog__list', mode: 'all-items' },
    { selector: '.dw-save-dialog__body .tc-consumer-list', mode: 'all-items' }
  ],
  wastewater: [],
  rainwater: [],
  'flooding-verification': [{ selector: '.result-group', mode: 'all-items' }]
});

function isHidden(element) {
  return Boolean(element?.hidden || element?.getAttribute?.('aria-hidden') === 'true');
}

function isCardBearingItem(element) {
  if (!element || isHidden(element)) return false;
  return Boolean(element.matches?.(CARD_SELECTOR) || element.querySelector?.(CARD_SELECTOR));
}

function directItems(container, mode) {
  if (!container?.children) return [];
  const children = [...container.children].filter(child => !isHidden(child));
  if (mode === 'card-bearing-items') return children.filter(isCardBearingItem);
  return children;
}

function adaptContainer(container, mode) {
  const items = directItems(container, mode);
  if (items.length < 2) return false;
  container.classList.add('tc-module-card-stack');
  items.forEach(item => item.classList.add('tc-module-card-stack__item'));
  return true;
}

function clearAdapterClasses(root) {
  root.querySelectorAll('.tc-module-card-stack, .tc-module-card-stack__item').forEach(element => {
    element.classList.remove('tc-module-card-stack', 'tc-module-card-stack__item');
  });
}

function applyAdapters(root, moduleId) {
  clearAdapterClasses(root);
  const adapters = [...BASE_STACK_ADAPTERS, ...(MODULE_STACK_ADAPTERS[moduleId] || [])];
  const seen = new Set();

  for (const adapter of adapters) {
    root.querySelectorAll(adapter.selector).forEach(container => {
      if (seen.has(container)) return;
      seen.add(container);
      adaptContainer(container, adapter.mode);
    });
  }
}

export function applyModuleSpacingAdapter(root, moduleId) {
  if (!root?.querySelectorAll) return () => {};

  let frameId = 0;
  let disposed = false;
  const schedule = typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame
    : callback => globalThis.setTimeout(callback, 0);
  const cancel = typeof cancelAnimationFrame === 'function'
    ? cancelAnimationFrame
    : id => globalThis.clearTimeout(id);

  const scheduleApply = () => {
    if (disposed || frameId) return;
    frameId = schedule(() => {
      frameId = 0;
      if (!disposed) applyAdapters(root, moduleId);
    });
  };

  applyAdapters(root, moduleId);

  const observer = typeof MutationObserver !== 'undefined'
    ? new MutationObserver(records => {
        if (records.some(record => record.type === 'childList' && (record.addedNodes.length || record.removedNodes.length))) {
          scheduleApply();
        }
      })
    : null;

  observer?.observe(root, { childList: true, subtree: true });

  return () => {
    disposed = true;
    observer?.disconnect();
    if (frameId) cancel(frameId);
    frameId = 0;
    clearAdapterClasses(root);
  };
}

export const MODULE_SPACING_ADAPTERS = MODULE_STACK_ADAPTERS;
