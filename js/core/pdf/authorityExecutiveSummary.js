const clean = value => String(value ?? '').trim();
const finite = value => Number.isFinite(Number(value)) ? Number(value) : null;
const array = value => Array.isArray(value) ? value : [];
const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

function countFrom(diagnostics, key, fallbackType) {
  const counts = object(diagnostics.counts);
  const direct = finite(counts[key]);
  if (direct != null) return direct;
  return array(diagnostics.items).filter(item => clean(item?.type).toLowerCase() === fallbackType).length;
}

function firstDiagnostic(diagnostics, types) {
  const normalized = types.map(type => type.toLowerCase());
  return array(diagnostics.items).find(item => normalized.includes(clean(item?.type).toLowerCase())) || null;
}

export function buildAuthorityExecutiveSummary(moduleData = {}) {
  const dto = object(moduleData.reportDto);
  const summary = object(dto.summary);
  const rainfall = object(dto.rainfall);
  const flooding = object(dto.floodingVerification);
  const diagnostics = object(dto.diagnostics);
  const interpretation = object(dto.interpretation);
  const critical = firstDiagnostic(diagnostics, ['error', 'warning', 'warn']);
  const errors = countFrom(diagnostics, 'errors', 'error');
  const warnings = countFrom(diagnostics, 'warnings', 'warning') + countFrom(diagnostics, 'warn', 'warn');
  const hints = countFrom(diagnostics, 'hints', 'hint') + countFrom(diagnostics, 'info', 'info');
  const statusLabel = clean(diagnostics.statusLabel || diagnostics.status || summary.status) || 'Status nicht ausgewiesen';

  return Object.freeze({
    kind: 'authority-executive-summary',
    planningVolumeM3: finite(summary.planningVolumeM3),
    governingLabel: clean(summary.governingLabel || summary.governingSource) || '—',
    governingDurationMinutes: finite(rainfall.governingDurationMinutes),
    totalAreaM2: finite(flooding.totalAreaM2),
    dinVolumeM3: finite(summary.dinVolumeM3),
    dwaVolumeM3: finite(summary.dwaVolumeM3),
    statusLabel,
    errors,
    warnings,
    hints,
    statement: clean(interpretation.summary || summary.governingReason || summary.rule) || 'Keine planerische Zusammenfassung verfügbar.',
    recommendation: clean(interpretation.recommendation) || 'Ergebnis in der weiteren Entwurfs- und Ausführungsplanung berücksichtigen.',
    criticalNotice: clean(critical?.message || critical?.title || diagnostics.statusReason) || ''
  });
}

export default buildAuthorityExecutiveSummary;
