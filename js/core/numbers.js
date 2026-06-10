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
