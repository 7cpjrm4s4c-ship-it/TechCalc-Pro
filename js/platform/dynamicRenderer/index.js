// Phase 18B.3: Centralized dynamic-island renderer.
//
// This renderer extracts the DOM island update mechanics that previously lived
// inside modules/heating-cooling/index.js. The module still provides the
// domain-specific render callbacks during the adapter phase, while the platform
// owns selectors, field synchronization, segment activation, card accent/title
// updates and saved-record island refresh rules.

function setInner(root, selector, html) {
  const el = root?.querySelector?.(selector);
  if (!el) return;
  const next = String(html ?? '');
  if (el.innerHTML !== next) el.innerHTML = next;
}

function findDynamicIsland(root, selector) {
  const island = root?.querySelector?.(selector);
  if (!island) return null;
  // Phase 18C.1: dynamic module updates must never cross from the module body
  // into the global app shell/navigation. If a future mount accidentally passes
  // a larger root, this guard still constrains the update to the requested
  // island instead of replacing an ancestor.
  if (island.id === 'primaryNav' || island.closest?.('#primaryNav, .module-nav, #overflowMenu')) return null;
  return island;
}

function setIslandInner(root, selector, html) {
  const island = findDynamicIsland(root, selector);
  if (!island) return false;
  const next = String(html ?? '');
  if (island.innerHTML !== next) island.innerHTML = next;
  return true;
}

function setSelectValue(root, field, value) {
  const el = root?.querySelector?.(`[data-field="${field}"]`);
  if (el && el.value !== String(value ?? '')) el.value = String(value ?? '');
}

function setInputValue(root, field, value) {
  const el = root?.querySelector?.(`input[data-field="${field}"], textarea[data-field="${field}"]`);
  if (!el || document.activeElement === el) return;
  const next = String(value ?? '');
  if (el.value !== next) el.value = next;
}

function updateCardAccent(root, selector, accent) {
  const cardEl = root?.querySelector?.(selector)?.closest?.('.card');
  if (!cardEl) return;
  [...cardEl.classList].forEach(cls => {
    if (cls.startsWith('card--accent-')) cardEl.classList.remove(cls);
  });
  cardEl.classList.add(`card--accent-${accent}`);
}

function setCardTitle(root, selector, title) {
  const titleEl = root?.querySelector?.(selector)?.closest?.('.card')?.querySelector?.('.card__title');
  if (titleEl && titleEl.textContent !== title) titleEl.textContent = title;
}

function updateSegment(root, name, value) {
  root?.querySelectorAll?.(`[data-segment="${name}"]`)?.forEach(button => {
    const selected = String(button.dataset.value) === String(value);
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-selected', String(selected));
  });
}

function hasAnyChanged(changed = [], keys = []) {
  return keys.some(key => changed.includes(key));
}

export function createHeatingCoolingDynamicRenderer(options = {}) {
  const {
    calculate,
    activeCalculationState,
    prefixFor,
    key,
    activeValue,
    activeMassFlowUnit,
    formatMassFlowInput,
    fmtInput,
    renderResult,
    renderFormula,
    renderMediumStats,
    renderModeSegment,
    renderTargetSegment,
    renderInputFields,
    renderPipeRecommendation,
    lineSectionController
  } = options;

  if (typeof calculate !== 'function') throw new Error('createHeatingCoolingDynamicRenderer requires calculate');
  if (typeof activeCalculationState !== 'function') throw new Error('createHeatingCoolingDynamicRenderer requires activeCalculationState');

  function update(root, s = {}, meta = {}) {
    const active = activeCalculationState(s);
    const r = calculate(active);
    const accent = s.mode === 'cooling' ? 'cyan' : 'orange';
    const modeLabel = s.mode === 'cooling' ? 'Kälte' : 'Heizung';
    const previous = root.__tcHeatingCoolingDynamic || {};
    const previousPrefix = previous.prefix || 'heating';
    const currentPrefix = prefixFor(s);
    const action = String(meta.action || '');
    const changed = Array.isArray(meta.changed) ? meta.changed : [];
    const modeChanged = previous.mode !== s.mode || changed.includes('mode');
    const targetChanged = previous.calcTarget !== active.calcTarget || previousPrefix !== currentPrefix || changed.includes(key(s, 'CalcTarget'));
    const unitChanged = previous.massFlowUnit !== active.massFlowUnit || hasAnyChanged(changed, [key(s, 'MassFlowUnit'), key(s, 'PowerUnit')]);
    const lineStructural = /^(line:|saved:)/.test(action);
    const appStructural = /^(record:|module:|replace|reset)/.test(action);
    const pipeOnlyChange = !appStructural
      && !lineStructural
      && changed.length > 0
      && changed.every(field => field === 'pipeSystemId');

    if (pipeOnlyChange) {
      // Phase 18C.1: Rohrwerkstoff changes are recommendation-only. Keep the
      // global nav/app shell and all unrelated dynamic islands mounted.
      setSelectValue(root, 'pipeSystemId', s.pipeSystemId);
      setIslandInner(root, '[data-hc-dynamic="pipe-recommendation"]', renderPipeRecommendation(s, r, active, accent));
      root.__tcHeatingCoolingDynamic = {
        mode: s.mode,
        prefix: currentPrefix,
        calcTarget: active.calcTarget,
        massFlowUnit: active.massFlowUnit,
        mediumId: s.mediumId,
        pipeSystemId: s.pipeSystemId
      };
      return;
    }

    setSelectValue(root, 'mediumId', s.mediumId);
    setSelectValue(root, 'pipeSystemId', s.pipeSystemId);
    setInner(root, '[data-hc-dynamic="medium-stats"]', renderMediumStats(s, r, active, accent));

    updateCardAccent(root, '[data-hc-dynamic="mode-segment"]', accent);
    updateCardAccent(root, '[data-hc-dynamic="target-segment"]', accent);
    updateSegment(root, 'mode', s.mode);

    if (modeChanged) {
      setInner(root, '[data-hc-dynamic="mode-segment"]', renderModeSegment(s, r, active, accent));
      setCardTitle(root, '[data-hc-dynamic="target-segment"]', `${modeLabel} — Eingaben`);
    }

    if (modeChanged || targetChanged) {
      setInner(root, '[data-hc-dynamic="target-segment"]', renderTargetSegment(s, r, active, accent));
    } else {
      updateSegment(root, key(s, 'CalcTarget'), active.calcTarget);
    }

    if (modeChanged || targetChanged || unitChanged || appStructural) {
      setInner(root, '[data-hc-dynamic="input-fields"]', renderInputFields(s, r, active, accent));
    } else {
      setInputValue(root, key(s, 'PowerW'), fmtInput(active.powerW, 2));
      setInputValue(root, key(s, 'MassFlowKgh'), formatMassFlowInput(activeValue(s, 'MassFlowKgh'), activeMassFlowUnit(s), s.mediumId));
      setInputValue(root, key(s, 'DeltaT'), fmtInput(active.deltaT, 2));
    }

    setInner(root, '[data-hc-dynamic="result"]', renderResult(s, r, active, accent));
    setInner(root, '[data-hc-dynamic="formula"]', renderFormula(s, r, active, accent));
    setIslandInner(root, '[data-hc-dynamic="pipe-recommendation"]', renderPipeRecommendation(s, r, active, accent));

    if (lineStructural || appStructural || hasAnyChanged(changed, ['lineSections', 'activeLineSectionId', 'activeLineSectionName', 'expandedLineSectionId'])) {
      lineSectionController?.updateControls?.(root, s);
      setInner(root, '[data-hc-dynamic="line-sections"]', lineSectionController?.renderRows?.(s) || '');
    }

    root.__tcHeatingCoolingDynamic = {
      mode: s.mode,
      prefix: currentPrefix,
      calcTarget: active.calcTarget,
      massFlowUnit: active.massFlowUnit,
      mediumId: s.mediumId,
      pipeSystemId: s.pipeSystemId
    };
  }

  return { update };
}

export const dynamicRendererInternals = {
  setInner,
  setSelectValue,
  setInputValue,
  updateCardAccent,
  setCardTitle,
  updateSegment,
  findDynamicIsland,
  setIslandInner
};
