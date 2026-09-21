import { parseNumber, formatNumber, toInputNumber } from './numberService.js';

export function parseGermanNumber(value, fallback = 0) {
  return parseNumber(value, { fallback, locale: 'de-DE' });
}

export function canonicalGermanNumberInput(value) {
  return toInputNumber(value, { fallback: '', locale: 'de-DE' });
}

export function formatGermanNumber(value, digits = 2, fallback = '—') {
  return formatNumber(value, { fallback, locale: 'de-DE', maximumFractionDigits: digits });
}

export function num(value) {
  return parseGermanNumber(value, 0);
}

export function fmt(value, digits = 2) {
  return formatGermanNumber(value, digits, '—');
}

export function fmtInput(value, digits = 2) {
  if (value === '' || value === null || value === undefined) return '';
  const parsed = num(value);
  if (!parsed) return String(value);
  return parsed.toLocaleString('de-DE', { maximumFractionDigits: digits });
}
