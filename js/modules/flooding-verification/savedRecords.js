const clone = value => typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));

const modeLabel = mode => ({
  'table-existing-pipe': 'Leitung prüfen',
  'table-size-pipe': 'Leitung dimensionieren',
  'manual-full-flow': 'Qvoll manuell',
  'authority-discharge-limit': 'Einleitungsbegrenzung'
}[mode] || 'Leitungsnachweis');

export function verificationSnapshot(current = {}, result = {}) {
  const state = clone(current);
  delete state.savedVerifications;
  delete state.activeVerificationId;
  delete state.expandedVerificationId;
  return {
    name: String(current.savedVerificationName || current.projectName || '').trim() || 'Überflutungsnachweis',
    state,
    result: {
      requiredRainFlowLs: result.requiredRainFlowLs,
      availableFlowLs: result.availableFlowLs,
      utilizationPercent: result.utilizationPercent,
      dischargeAdequate: result.dischargeAdequate,
      dischargeMode: result.dischargeMode,
      totalArea: result.totalArea,
      surfaceCount: result.surfaceCount
    }
  };
}

export function hydrateVerification(item = {}, current = {}) {
  return {
    ...(item.state || item.inputState || {}),
    savedVerifications: Array.isArray(current.savedVerifications) ? current.savedVerifications : [],
    activeVerificationId: item.id,
    expandedVerificationId: current.expandedVerificationId || null,
    savedVerificationName: item.name || item.state?.savedVerificationName || ''
  };
}

export function savedVerificationModel(state = {}) {
  const items = Array.isArray(state.savedVerifications) ? state.savedVerifications : [];
  const editMode = Boolean(state.activeVerificationId);
  return {
    enabled: true,
    title: 'Gespeicherte Einträge',
    nameFieldId: 'savedVerificationName',
    nameLabel: 'Bezeichnung',
    nameValue: state.savedVerificationName || '',
    namePlaceholder: 'z. B. Grundstück Musterstraße 1',
    activeId: state.activeVerificationId,
    expandedId: state.expandedVerificationId,
    addDisabled: editMode,
    updateDisabled: !editMode,
    emptyText: 'Noch keine Einträge gespeichert.',
    accent: 'green',
    loadAttr: 'data-line-select',
    toggleAttr: 'data-line-toggle',
    deleteAttr: 'data-line-delete',
    items: items.map(item => ({
      ...item,
      title: item.name || 'Überflutungsnachweis',
      subtitle: `${modeLabel(item.result?.dischargeMode)} · ${Number(item.result?.totalArea || 0).toLocaleString('de-DE')} m²`,
      stats: [
        { label: 'Qr', value: Number(item.result?.requiredRainFlowLs || 0).toLocaleString('de-DE', { maximumFractionDigits: 2 }), unit: 'l/s' },
        { label: 'Flächen', value: String(item.result?.surfaceCount || 0) },
        { label: 'Nachweis', value: item.result?.dischargeAdequate ? 'ausreichend' : 'nicht ausreichend' }
      ]
    }))
  };
}

export default savedVerificationModel;
