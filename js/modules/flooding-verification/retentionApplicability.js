const finite = value => {
  const number = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(number) ? number : null;
};

const STATUS_LABELS = Object.freeze({
  inactive: 'nicht aktiv',
  incomplete: 'unvollständig',
  applicable: 'anwendbar',
  'preliminary-only': 'nur Vorbemessung',
  'long-term-simulation-required': 'Langzeitsimulation erforderlich'
});

export function evaluateDwa117Applicability({
  enabled = false,
  dischargeMode = '',
  catchmentAreaHa,
  flowTimeMinutes,
  recurrenceFrequencyPerYear,
  throttleRainShareLsHa,
  surchargeFactorFz,
  reductionFactorFa
} = {}) {
  const active = Boolean(enabled) && dischargeMode === 'authority-discharge-limit';
  if (!active) {
    return Object.freeze({
      active: false,
      status: 'inactive',
      statusLabel: STATUS_LABELS.inactive,
      unrestricted: false,
      checks: Object.freeze([]),
      messages: Object.freeze([])
    });
  }

  const area = finite(catchmentAreaHa);
  const flowTime = finite(flowTimeMinutes);
  const n = finite(recurrenceFrequencyPerYear);
  const qDr = finite(throttleRainShareLsHa);
  const fz = finite(surchargeFactorFz);
  const fA = finite(reductionFactorFa);

  const missing = [];
  if (!(area >= 0)) missing.push('Einzugsgebietsfläche');
  if (!(flowTime >= 0)) missing.push('Fließzeit');
  if (!(n > 0)) missing.push('Überschreitungshäufigkeit n');
  if (!(qDr >= 0)) missing.push('Regenanteil der Drosselabflussspende qDr,R,u');
  if (!(fz > 0)) missing.push('Zuschlagsfaktor fz');
  if (!(fA > 0)) missing.push('Abminderungsfaktor fA');

  if (missing.length) {
    return Object.freeze({
      active: true,
      status: 'incomplete',
      statusLabel: STATUS_LABELS.incomplete,
      unrestricted: false,
      catchmentAreaHa: area,
      flowTimeMinutes: flowTime,
      recurrenceFrequencyPerYear: n,
      throttleRainShareLsHa: qDr,
      checks: Object.freeze([]),
      messages: Object.freeze([`Für die Anwendungsprüfung fehlen: ${missing.join(', ')}.`])
    });
  }

  const checks = [
    {
      key: 'catchment-or-flow-time',
      label: 'Einzugsgebiet ≤ 200 ha oder Fließzeit ≤ 15 min',
      passed: area <= 200 || flowTime <= 15,
      severity: 'hard'
    },
    {
      key: 'recurrence-minimum',
      label: 'Überschreitungshäufigkeit n ≥ 0,1/a',
      passed: n >= 0.1,
      severity: 'hard'
    },
    {
      key: 'throttle-minimum',
      label: 'qDr,R,u ≥ 2 l/(s·ha)',
      passed: qDr >= 2,
      severity: 'hard'
    },
    {
      key: 'fa-flow-time-domain',
      label: 'fA-Gültigkeit: 0 ≤ tf ≤ 30 min',
      passed: flowTime >= 0 && flowTime <= 30,
      severity: 'empirical'
    },
    {
      key: 'fa-throttle-domain',
      label: 'fA-Gültigkeit: 2 ≤ qDr,R,u ≤ 40 l/(s·ha)',
      passed: qDr >= 2 && qDr <= 40,
      severity: 'empirical'
    },
    {
      key: 'fa-frequency-domain',
      label: 'fA-Gültigkeit: 0,1 ≤ n ≤ 1,0/a',
      passed: n >= 0.1 && n <= 1,
      severity: 'empirical'
    }
  ];

  const hardFailures = checks.filter(check => check.severity === 'hard' && !check.passed);
  const empiricalFailures = checks.filter(check => check.severity === 'empirical' && !check.passed);
  const status = hardFailures.length
    ? 'long-term-simulation-required'
    : empiricalFailures.length
      ? 'preliminary-only'
      : 'applicable';

  const messages = [
    ...hardFailures.map(check => `${check.label} ist nicht erfüllt.`),
    ...empiricalFailures.map(check => `${check.label} ist überschritten; das einfache Verfahren ist nur zur Vorbemessung zu verwenden.`)
  ];

  return Object.freeze({
    active: true,
    status,
    statusLabel: STATUS_LABELS[status],
    unrestricted: status === 'applicable',
    catchmentAreaHa: area,
    flowTimeMinutes: flowTime,
    recurrenceFrequencyPerYear: n,
    throttleRainShareLsHa: qDr,
    checks: Object.freeze(checks.map(check => Object.freeze(check))),
    messages: Object.freeze(messages)
  });
}

export default evaluateDwa117Applicability;
