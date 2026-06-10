const THOUSANDS_DOT_PATTERN = /^-?\d{1,3}(\.\d{3})+(,\d+)?$/;

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
  toInput: toInputNumber
});
