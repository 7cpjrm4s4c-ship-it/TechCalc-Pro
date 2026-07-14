function setIsland(root, selector, html) {
  const host = root?.querySelector?.(selector);
  if (!host) return false;
  const next = String(html ?? '');
  if (host.innerHTML !== next) host.innerHTML = next;
  return true;
}

function hasAny(changed = [], keys = []) {
  return keys.some(key => changed.includes(key));
}

export function createFloodingDynamicRenderer({ calculate, renderSurfaceForm, renderCalculationForm, renderResult, lineSectionController } = {}) {
  function update(root, state = {}, meta = {}) {
    if (!root) return;
    const action = String(meta.action || '');
    const changed = Array.isArray(meta.changed) ? meta.changed : [];
    const result = calculate(state);
    const surfaceStructural = /^(line:|saved:|flooding:import-roofs|flooding:surface-type|platform:segment:surfaceCategory)/.test(action)
      || hasAny(changed, ['surfaces', 'activeSurfaceId', 'expandedSurfaceId', 'surfaceCategory', 'surfaceAreaType', 'surfaceCs', 'surfaceCm', 'importStatus']);
    const calculationStructural = action.startsWith('platform:segment:rainDurationMode')
      || action.startsWith('platform:segment:dischargeMode')
      || hasAny(changed, [
        'rainDurationMode', 'manualRainDuration', 'manualRainDurationReason',
        'meanSlopePercent', 'surfaces', 'dischargeMode', 'pipeNominalDiameterDn',
        'pipeSlopePercent', 'manualFullFlowLs', 'authorityLimitLs',
        'retentionRecurrenceFrequencyPerYear', 'retentionRiskClass',
        'retentionFlowTimeMinutes', 'retentionDryWeatherFlowLs',
        'retentionUpstreamThrottleFlowLs', 'retentionRainDuration5',
        'retentionRainDuration10', 'retentionRainDuration15',
        'rainR2Duration5', 'rainR2Duration10', 'rainR2Duration15'
      ]);

    if (surfaceStructural) {
      setIsland(root, '[data-flooding-dynamic="surface-form"]', renderSurfaceForm(state, result));
      lineSectionController?.updateControls?.(root, state);
      if (!lineSectionController?.updateRows?.(root, state)) {
        setIsland(root, '[data-flooding-dynamic="surface-records"]', lineSectionController?.renderCard?.(state) || '');
      }
    }

    if (calculationStructural) {
      setIsland(root, '[data-flooding-dynamic="calculation-form"]', renderCalculationForm(state, result));
    }

    setIsland(root, '[data-flooding-dynamic="result"]', renderResult(state, result));
  }

  return { update };
}

export default createFloodingDynamicRenderer;
