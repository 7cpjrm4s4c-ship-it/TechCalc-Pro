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


export function createVentilationDynamicRenderer(options = {}) {
  const {
    calculate,
    activeCalculationState,
    prefixFor,
    key,
    fmtInput,
    renderTemperatures,
    renderModeSegment,
    renderTargetSegment,
    renderInputFields,
    renderResult,
    renderAirStats,
    renderFormula,
    lineSectionController
  } = options;

  if (typeof calculate !== 'function') throw new Error('createVentilationDynamicRenderer requires calculate');
  if (typeof activeCalculationState !== 'function') throw new Error('createVentilationDynamicRenderer requires activeCalculationState');

  function update(root, s = {}, meta = {}) {
    const active = activeCalculationState(s);
    const r = calculate(active);
    const accent = s.mode === 'cooling' ? 'cyan' : 'orange';
    const modeLabel = s.mode === 'cooling' ? 'Kälte' : 'Heizung';
    const previous = root.__tcVentilationDynamic || {};
    const previousPrefix = previous.prefix || 'heating';
    const currentPrefix = prefixFor(s);
    const action = String(meta.action || '');
    const changed = Array.isArray(meta.changed) ? meta.changed : [];
    const modeChanged = previous.mode !== s.mode || changed.includes('mode');
    const targetChanged = previous.calcTarget !== active.calcTarget || previousPrefix !== currentPrefix || changed.includes(key(s, 'CalcTarget'));
    const lineStructural = /^(line:|saved:)/.test(action);
    const appStructural = /^(record:|module:|replace|reset)/.test(action);

    updateCardAccent(root, '[data-vent-dynamic="temperatures"]', accent);
    updateCardAccent(root, '[data-vent-dynamic="mode-segment"]', accent);
    updateCardAccent(root, '[data-vent-dynamic="target-segment"]', accent);
    updateSegment(root, 'mode', s.mode);

    if (modeChanged) {
      setInner(root, '[data-vent-dynamic="temperatures"]', renderTemperatures(s, r, active, accent));
      setInner(root, '[data-vent-dynamic="mode-segment"]', renderModeSegment(s, r, active, accent));
      setCardTitle(root, '[data-vent-dynamic="target-segment"]', `${modeLabel} — Eingaben`);
    }

    if (modeChanged || targetChanged) {
      setInner(root, '[data-vent-dynamic="target-segment"]', renderTargetSegment(s, r, active, accent));
      setInner(root, '[data-vent-dynamic="input-fields"]', renderInputFields(s, r, active, accent));
    } else {
      updateSegment(root, key(s, 'CalcTarget'), active.calcTarget);
      setInputValue(root, key(s, 'PowerW'), fmtInput(active.powerW, 2));
      setInputValue(root, key(s, 'VolumeFlowM3h'), fmtInput(active.volumeFlowM3h, 2));
      setInputValue(root, key(s, 'DeltaT'), fmtInput(active.deltaT, 2));
      setInputValue(root, key(s, 'SupplyTemp'), fmtInput(active.supplyTemp, 2));
      setInputValue(root, key(s, 'RoomTemp'), fmtInput(active.roomTemp, 2));
    }

    setInputValue(root, key(s, 'SupplyTemp'), fmtInput(active.supplyTemp, 2));
    setInputValue(root, key(s, 'RoomTemp'), fmtInput(active.roomTemp, 2));

    setInner(root, '[data-vent-dynamic="result"]', renderResult(s, r, active, accent));
    setInner(root, '[data-vent-dynamic="air-stats"]', renderAirStats(s, r, active, accent));
    setInner(root, '[data-vent-dynamic="formula"]', renderFormula(s, r, active, accent));

    if (lineStructural || appStructural || hasAnyChanged(changed, ['ventLineSections', 'activeVentLineSectionId', 'activeVentLineSectionName', 'expandedVentLineSectionId'])) {
      lineSectionController?.updateControls?.(root, s);
      setInner(root, '[data-line-dynamic="line-sections"]', lineSectionController?.renderRows?.(s) || '');
    }

    root.__tcVentilationDynamic = {
      mode: s.mode,
      prefix: currentPrefix,
      calcTarget: active.calcTarget
    };
  }

  return { update };
}

export function createPressureHoldingDynamicRenderer(options = {}) {
  const {
    calculate,
    fmtInput,
    renderBasis,
    renderVolumeFields,
    renderPressureFields,
    renderHoldingOptions,
    renderSavedPanel,
    renderResult
  } = options;

  if (typeof calculate !== 'function') throw new Error('createPressureHoldingDynamicRenderer requires calculate');
  if (typeof renderResult !== 'function') throw new Error('createPressureHoldingDynamicRenderer requires renderResult');

  const structuralVolumeFields = ['waterContentMode'];
  const structuralPressureFields = ['connectionType'];
  const structuralHoldingFields = ['holdingType'];
  const savedFields = ['savedPlants', 'activePlantId', 'expandedPlantId'];

  function syncFields(root, s = {}) {
    updateSegment(root, 'systemType', s.systemType);
    updateSegment(root, 'holdingType', s.holdingType);
    updateSegment(root, 'connectionType', s.connectionType);
    updateSegment(root, 'includeServitec', s.includeServitec);
    setSelectValue(root, 'waterContentMode', s.waterContentMode);
    setSelectValue(root, 'frostMode', s.frostMode);
    setSelectValue(root, 'dynamicType', s.dynamicType);
    setInputValue(root, 'plantName', s.plantName || '');
    setInputValue(root, 'heatPowerKw', fmtInput?.(s.heatPowerKw, 1) ?? s.heatPowerKw);
    setInputValue(root, 'systemVolumeL', fmtInput?.(s.systemVolumeL, 1) ?? s.systemVolumeL);
    setInputValue(root, 'specificWaterContent', fmtInput?.(s.specificWaterContent, 1) ?? s.specificWaterContent);
    setInputValue(root, 'additionalVolumeL', fmtInput?.(s.additionalVolumeL, 1) ?? s.additionalVolumeL);
    setInputValue(root, 'tMinC', fmtInput?.(s.tMinC, 1) ?? s.tMinC);
    setInputValue(root, 'tMaxC', fmtInput?.(s.tMaxC, 1) ?? s.tMaxC);
    setInputValue(root, 'staticHeightM', fmtInput?.(s.staticHeightM, 1) ?? s.staticHeightM);
    setInputValue(root, 'staticPressureBar', fmtInput?.(s.staticPressureBar, 2) ?? s.staticPressureBar);
    setInputValue(root, 'pumpPressureBar', fmtInput?.(s.pumpPressureBar, 2) ?? s.pumpPressureBar);
    setInputValue(root, 'safetyValveBar', fmtInput?.(s.safetyValveBar, 2) ?? s.safetyValveBar);
  }

  function update(root, s = {}, meta = {}) {
    const r = calculate(s);
    const action = String(meta.action || '');
    const changed = Array.isArray(meta.changed) ? meta.changed : [];
    const previous = root.__tcPressureHoldingDynamic || {};
    const appStructural = /^(record:|module:|replace|reset)/.test(action);
    const savedStructural = /^(saved:|pressure:)/.test(action) || hasAnyChanged(changed, savedFields);
    const volumeStructural = appStructural || hasAnyChanged(changed, structuralVolumeFields) || previous.waterContentMode !== s.waterContentMode;
    const pressureStructural = appStructural || hasAnyChanged(changed, structuralPressureFields) || previous.connectionType !== s.connectionType;
    const holdingStructural = appStructural || hasAnyChanged(changed, structuralHoldingFields) || previous.holdingType !== s.holdingType;
    const basisStructural = appStructural || holdingStructural || pressureStructural || hasAnyChanged(changed, ['systemType']);

    if (basisStructural && typeof renderBasis === 'function') setIslandInner(root, '[data-ph-dynamic="basis"]', renderBasis(s, r, 'purple'));
    if (volumeStructural && typeof renderVolumeFields === 'function') setIslandInner(root, '[data-ph-dynamic="volume-fields"]', renderVolumeFields(s, r, 'purple'));
    if (pressureStructural && typeof renderPressureFields === 'function') setIslandInner(root, '[data-ph-dynamic="pressure-fields"]', renderPressureFields(s, r, 'purple'));
    if (holdingStructural && typeof renderHoldingOptions === 'function') setIslandInner(root, '[data-ph-dynamic="holding-options"]', renderHoldingOptions(s, r, 'purple'));
    if (savedStructural && typeof renderSavedPanel === 'function') setIslandInner(root, '[data-ph-dynamic="saved-records"]', renderSavedPanel(s, r, 'purple'));

    syncFields(root, s);
    setIslandInner(root, '[data-ph-dynamic="result"]', renderResult(s, r, 'purple'));

    root.__tcPressureHoldingDynamic = {
      waterContentMode: s.waterContentMode,
      connectionType: s.connectionType,
      holdingType: s.holdingType,
      activePlantId: s.activePlantId,
      expandedPlantId: s.expandedPlantId
    };
  }

  return { update };
}


export function createPipeSizingDynamicRenderer(options = {}) {
  const {
    calculate,
    fmt,
    renderInput,
    renderSavedPanel,
    renderResult
  } = options;

  if (typeof calculate !== 'function') throw new Error('createPipeSizingDynamicRenderer requires calculate');
  if (typeof renderResult !== 'function') throw new Error('createPipeSizingDynamicRenderer requires renderResult');

  const savedFields = ['savedPipes', 'activePipeId', 'expandedPipeId'];

  function syncFields(root, s = {}) {
    setSelectValue(root, 'systemId', s.systemId);
    setInputValue(root, 'maxPressurePam', s.maxPressurePam || '');
    setInputValue(root, 'flowValue', s.flowValue || s.massFlowKgh || s.volumeFlowM3h || '');
    setSelectValue(root, 'flowUnit', s.flowUnit || 'kg/h');
    setInputValue(root, 'pipeName', s.pipeName || '');
  }

  function update(root, s = {}, meta = {}) {
    const r = calculate(s);
    const action = String(meta.action || '');
    const changed = Array.isArray(meta.changed) ? meta.changed : [];
    const previous = root.__tcPipeSizingDynamic || {};
    const appStructural = /^(record:|module:|replace|reset)/.test(action);
    const savedStructural = /^(saved:|pipe:)/.test(action) || hasAnyChanged(changed, savedFields);
    const inputStructural = appStructural || previous.flowUnit !== s.flowUnit || hasAnyChanged(changed, ['flowUnit']);

    if (inputStructural && typeof renderInput === 'function') {
      setIslandInner(root, '[data-pipe-dynamic="input"]', renderInput(s, r, 'blue'));
    }

    if (savedStructural && typeof renderSavedPanel === 'function') {
      setIslandInner(root, '[data-pipe-dynamic="saved-records"]', renderSavedPanel(s, r, 'blue'));
    }

    syncFields(root, s);
    setIslandInner(root, '[data-pipe-dynamic="result"]', renderResult(s, r, 'blue'));

    root.__tcPipeSizingDynamic = {
      flowUnit: s.flowUnit,
      activePipeId: s.activePipeId,
      expandedPipeId: s.expandedPipeId
    };
  }

  return { update };
}

export function createUnitConverterDynamicRenderer(options = {}) {
  const {
    calculate,
    fmt,
    normalizeUnitSelection,
    renderConversion,
    renderResult
  } = options;

  if (typeof calculate !== 'function') throw new Error('createUnitConverterDynamicRenderer requires calculate');
  if (typeof normalizeUnitSelection !== 'function') throw new Error('createUnitConverterDynamicRenderer requires normalizeUnitSelection');
  if (typeof renderResult !== 'function') throw new Error('createUnitConverterDynamicRenderer requires renderResult');

  function syncFields(root, s = {}) {
    const { from, to } = normalizeUnitSelection(s);
    setSelectValue(root, 'category', s.category || 'pressure');
    setInputValue(root, 'value', s.value || '');
    setSelectValue(root, 'from', from);
    setSelectValue(root, 'to', to);
    setInputValue(root, 'convertedValue', fmt?.(calculate({ ...s, from, to }), 2) ?? calculate({ ...s, from, to }));
  }

  function update(root, s = {}, meta = {}) {
    const action = String(meta.action || '');
    const changed = Array.isArray(meta.changed) ? meta.changed : [];
    const previous = root.__tcUnitConverterDynamic || {};
    const { units, from, to } = normalizeUnitSelection(s);
    const categoryStructural = previous.category !== s.category || changed.includes('category') || /^(record:|module:|replace|reset)/.test(action);

    if (categoryStructural && typeof renderConversion === 'function') {
      setIslandInner(root, '[data-unit-dynamic="conversion"]', renderConversion({ ...s, from, to }, units, from, to, 'green'));
    }

    syncFields(root, { ...s, from, to });
    setIslandInner(root, '[data-unit-dynamic="result"]', renderResult({ ...s, from, to }, 'green'));

    root.__tcUnitConverterDynamic = {
      category: s.category,
      from,
      to
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
