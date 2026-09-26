const toNumber = value => Number(String(value ?? '').replace(',', '.'));

export const RETENTION_RISK_FACTORS = Object.freeze({
  low: 1.20,
  medium: 1.15,
  high: 1.10
});

export function surchargeFactorFromRiskClass(riskClass = 'medium') {
  return RETENTION_RISK_FACTORS[riskClass] ?? RETENTION_RISK_FACTORS.medium;
}

export function calculateReductionFactorFa({ flowTimeMinutes, throttleRainShareLsHa, recurrenceFrequencyPerYear } = {}) {
  const tf = toNumber(flowTimeMinutes);
  const q = toNumber(throttleRainShareLsHa);
  const n = toNumber(recurrenceFrequencyPerYear);
  const withinDomain = tf >= 0 && tf <= 30 && q >= 2 && q <= 40 && n >= 0.1 && n <= 1;
  if (!withinDomain) {
    return Object.freeze({ value: null, valid: false, withinDomain: false, source: 'DWA-A 117 Anhang B, Gleichung (B.1)' });
  }

  const f1 = 1
    - (1.00e-10 * tf ** 3 - 8.00e-9 * tf ** 2 + 1.00e-8 * tf) * q ** 3
    + (1.60e-8 * tf ** 3 - 9.15e-7 * tf ** 2 + 1.14e-6 * tf) * q ** 2
    + (1.80e-7 * tf ** 3 - 1.25e-5 * tf ** 2 + 1.56e-5 * tf) * q;
  const value = (0.6134 * n + 0.3866) * f1 - (0.6134 * n - 0.6134);

  return Object.freeze({
    value,
    valid: Number.isFinite(value) && value > 0,
    withinDomain: true,
    helperF1: f1,
    source: 'DWA-A 117 Anhang B, Gleichung (B.1)'
  });
}

export default { surchargeFactorFromRiskClass, calculateReductionFactorFa };
