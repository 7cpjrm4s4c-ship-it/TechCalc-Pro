export function parseGermanNumber(value, fallback = 0) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const raw = String(value).trim().replace(/\s/g, '');
  if (!raw) return fallback;

  // Deutsche Eingabe:
  // 2.500   => 2500
  // 2.500,5 => 2500.5
  // 2,5     => 2.5
  // 0.9     => 0.9, falls technische Punkt-Dezimalschreibweise aus Daten kommt
  const normalized = raw.includes(',')
    ? raw.replace(/\./g, '').replace(',', '.')
    : (/^-?\d{1,3}(\.\d{3})+$/.test(raw) ? raw.replace(/\./g, '') : raw);
  const n = Number(normalized);
  return Number.isFinite(n) ? n : fallback;
}

export function canonicalGermanNumberInput(value) {
  if (value === null || value === undefined) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  const n = parseGermanNumber(raw, NaN);
  if (!Number.isFinite(n)) return raw;
  return String(n).replace('.', ',');
}

export function formatGermanNumber(value, digits = 2, fallback = '—') {
  const n = parseGermanNumber(value, NaN);
  if (!Number.isFinite(n)) return fallback;
  return n.toLocaleString('de-DE', { maximumFractionDigits: digits });
}
