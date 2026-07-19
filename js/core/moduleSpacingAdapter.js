const CARD_SELECTOR = [
  '.card',
  '.tc-card',
  '.result-card',
  '.saved-record-card',
  '.line-section-card',
  '.ph-saved-item'
].join(',');

const BASE_STACK_SELECTORS = Object.freeze([
  '.module-content',
  '.tc-stack',
  '.tc-stack--section',
  '.card-grid',
  '.result-group'
]);

const MODULE_STACK_SELECTORS = Object.freeze({
  'heating-cooling': [],
  ventilation: [],
  'pressure-holding': ['.ph-saved-list'],
  'buffer-storage': ['.buffer-saved-list'],
  'heat-recovery': ['.wrg-flow-column', '.wrg-desktop-split__input', '.wrg-desktop-split__output'],
  'mixed-air': ['.wrg-flow-column', '.wrg-desktop-split__input', '.wrg-desktop-split__output'],
  'hx-diagram': ['.hx-layout__left', '.hx-layout__right', '.hx-process-path', '.hx-history'],
  'pipe-sizing': ['.pipe-dimension-list'],
  'unit-converter': [],
  'drinking-water': ['.dw-save-dialog__list', '.dw-save-dialog__body .tc-consumer-list'],
  wastewater: [],
  rainwater: [],
  'flooding-verification': ['.result-group']
});

function directCardChildren(container) {
  if (!container?.children) return [];
  return [...container.children].filter(child => child.matches?.(CARD_SELECTOR));
}

function hasCardBearingChild(container) {
  if (!container?.children) return false;
  return [...container.children].some(child =>
    child.matches?.(CARD_SELECTOR) || directCardChildren(child).length > 0
  );
}

function adaptContainer(container) {
  if (!container) return false;
  const directCards = directCardChildren(container);
  if (directCards.length < 2 && !hasCardBearingChild(container)) return false;
  container.classList.add('tc-module-card-stack');
  directCards.forEach(card => card.classList.add('tc-module-card-stack__item'));
  return true;
}

export function applyModuleSpacingAdapter(root, moduleId) {
  if (!root?.querySelectorAll) return () => {};

  root.querySelectorAll('.tc-module-card-stack, .tc-module-card-stack__item').forEach(element => {
    element.classList.remove('tc-module-card-stack', 'tc-module-card-stack__item');
  });

  const selectors = [...BASE_STACK_SELECTORS, ...(MODULE_STACK_SELECTORS[moduleId] || [])];
  const seen = new Set();

  for (const selector of selectors) {
    root.querySelectorAll(selector).forEach(container => {
      if (seen.has(container)) return;
      seen.add(container);
      adaptContainer(container);
    });
  }

  return () => {
    root.querySelectorAll('.tc-module-card-stack, .tc-module-card-stack__item').forEach(element => {
      element.classList.remove('tc-module-card-stack', 'tc-module-card-stack__item');
    });
  };
}

export const MODULE_SPACING_ADAPTERS = MODULE_STACK_SELECTORS;
