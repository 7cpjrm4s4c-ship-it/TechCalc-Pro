const THOUSANDS_DOT_PATTERN = /^-?\d{1,3}(\.\d{3})+(,\d+)?$/;

export const ENGINEERING_NUMBER_FORMATS = Object.freeze({
  integer: Object.freeze({ minimumFractionDigits: 0, maximumFractionDigits: 0 }),
  volume: Object.freeze({ minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  flow: Object.freeze({ minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  velocity: Object.freeze({ minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  area: Object.freeze({ minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  percent: Object.freeze({ minimumFractionDigits: 1, maximumFractionDigits: 1 }),
  factor: Object.freeze({ minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  rainIntensity: Object.freeze({ minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  frequency: Object.freeze({ minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  duration: Object.freeze({ minimumFractionDigits: 0, maximumFractionDigits: 0 }),
  generic: Object.freeze({ minimumFractionDigits: 0, maximumFractionDigits: 2 })
});

export function parseNumber(value, { fallback = 0, locale = 'de-DE' } = {}) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;

  const raw = String(value).trim().replace(/\s/g, '');
  if (!raw) return fallback;

  let normalized = raw;
  if (locale === 'de-DE') {
    if (raw.includes(',')) normalized = raw.replace(/\./g, '').replace(',', '.');
    else if (THOUSANDS_DOT_PATTERN.test(raw)) normalized = raw.replace(/\./g, '');
  } else {
    normalized = raw.replace(/,/g, '');
  }

  const n = Number(normalized);
  return Number.isFinite(n) ? n : fallback;
}

export function formatNumber(value, {
  fallback = '—',
  locale = 'de-DE',
  minimumFractionDigits = 0,
  maximumFractionDigits = 2
} = {}) {
  const n = parseNumber(value, { fallback: NaN, locale });
  if (!Number.isFinite(n)) return fallback;
  return n.toLocaleString(locale, { minimumFractionDigits, maximumFractionDigits });
}

export function formatEngineeringNumber(value, kind = 'generic', options = {}) {
  const profile = ENGINEERING_NUMBER_FORMATS[kind] || ENGINEERING_NUMBER_FORMATS.generic;
  return formatNumber(value, { ...profile, ...options });
}

export function toInputNumber(value, { fallback = '', locale = 'de-DE', maximumFractionDigits = 10 } = {}) {
  if (value === null || value === undefined || value === '') return fallback;
  const n = parseNumber(value, { fallback: NaN, locale });
  if (!Number.isFinite(n)) return String(value ?? fallback);
  const formatted = n.toLocaleString(locale, {
    useGrouping: false,
    maximumFractionDigits
  });
  return formatted;
}

export function parsePositiveNumber(value, options = {}) {
  return Math.max(0, parseNumber(value, options));
}

export function parseInteger(value, { fallback = 0, min = null, max = null, locale = 'de-DE' } = {}) {
  let n = Math.round(parseNumber(value, { fallback, locale }));
  if (Number.isFinite(min)) n = Math.max(min, n);
  if (Number.isFinite(max)) n = Math.min(max, n);
  return Number.isFinite(n) ? n : fallback;
}

export const numberService = Object.freeze({
  parse: parseNumber,
  parsePositive: parsePositiveNumber,
  parseInteger,
  format: formatNumber,
  formatEngineering: formatEngineeringNumber,
  toInput: toInputNumber
});