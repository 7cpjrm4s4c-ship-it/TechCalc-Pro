import { areaTypes } from '../../shared/rainwaterDomainTables.js';
import { PDF_PAGE, PDF_THEME } from './reportTheme.js';

const finite = value => Number.isFinite(Number(value));
const text = value => String(value ?? '').trim() || '—';

const DOMAIN_SURFACE_TYPE_LABELS = Object.fromEntries(
  areaTypes.map(areaType => [areaType.id, areaType.name])
);

const LEGACY_SURFACE_TYPE_LABELS = Object.freeze({
  'green-extensive-flat': 'Extensivbegrünung ≤ 5°',
  'paving-permeable': 'Wasserdurchlässige Pflasterfläche',
  roof: 'Dachfläche',
  yard: 'Hoffläche'
});

const SURFACE_TYPE_LABELS = Object.freeze({
  ...DOMAIN_SURFACE_TYPE_LABELS,
  ...LEGACY_SURFACE_TYPE_LABELS
});

export function surfaceTypeLabel(value) {
  const key = String(value ?? '').trim();
  return SURFACE_TYPE_LABELS[key] || 'Freie Fläche / eigener Abflussbeiwert';
}

function number(value, digits = 2) {
  if (!finite(value)) return '—';
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(Number(value));
}

function cell(report, value, x, y, width, { align = 'left', font = 'F1', size = 6.2, color = PDF_THEME.text } = {}) {
  const anchor = align === 'right' ? x + width - 4 : x + 4;
  report.text(text(value), anchor, y, { size, font, color, align, maxWidth: width - 8, lineHeight: 1.12 });
}

function table(report, { title, headers, rows, widths, rowHeight = 25, headerHeight = 24 }) {
  const m = PDF_THEME.margin;
  const totalWidth = PDF_PAGE.width - m * 2;
  const absoluteWidths = widths.map(value => totalWidth * value);
  const titleHeight = 18;
  const blockHeight = titleHeight + headerHeight + rows.length * rowHeight + 8;
  report.ensureSpace(blockHeight + 4);
  report.sectionTitle(title);
  const y0 = report.cursorY;

  report.rect(m, y0, totalWidth, headerHeight + rows.length * rowHeight, { fill: [255, 255, 255], stroke: PDF_THEME.line, width: 0.55 });
  report.rect(m, y0, totalWidth, headerHeight, { fill: PDF_THEME.soft, stroke: PDF_THEME.line, width: 0.45 });

  let x = m;
  headers.forEach((header, index) => {
    cell(report, header, x, y0 + 15, absoluteWidths[index], { font: 'F2', size: 5.8, color: PDF_THEME.muted, align: index >= headers.length - 3 ? 'right' : 'left' });
    x += absoluteWidths[index];
    if (index < headers.length - 1) report.line(x, y0, x, y0 + headerHeight + rows.length * rowHeight, PDF_THEME.rowLine, 0.3);
  });

  rows.forEach((row, rowIndex) => {
    const rowY = y0 + headerHeight + rowIndex * rowHeight;
    if (rowIndex) report.line(m, rowY, m + totalWidth, rowY, PDF_THEME.rowLine, 0.3);
    let rowX = m;
    row.forEach((value, index) => {
      cell(report, value, rowX, rowY + 15, absoluteWidths[index], {
        font: index === 0 ? 'F2' : 'F1',
        size: 6.15,
        align: index >= row.length - 3 ? 'right' : 'left'
      });
      rowX += absoluteWidths[index];
    });
  });

  report.cursorY = y0 + headerHeight + rows.length * rowHeight + 7;
}

export function renderSurfaceTable(report, dto = {}) {
  const surfaces = Array.isArray(dto.surfaces) ? dto.surfaces : [];
  const rows = surfaces.map((surface, index) => [
    String(index + 1),
    text(surface.name || `Fläche ${index + 1}`),
    surfaceTypeLabel(surface.areaType || surface.category),
    finite(surface.areaM2) ? number(surface.areaM2) : '—',
    finite(surface.runoffCoefficientCs) ? number(surface.runoffCoefficientCs) : '—',
    finite(surface.weightedCsAreaM2) ? number(surface.weightedCsAreaM2) : '—'
  ]);
  table(report, {
    title: `4. Flächenübersicht (${rows.length})`,
    headers: ['Nr.', 'Bezeichnung', 'Flächenart', 'A [m²]', 'Cₛ', 'A × Cₛ [m²]'],
    rows,
    widths: [0.06, 0.21, 0.31, 0.14, 0.11, 0.17],
    rowHeight: 30
  });
}

function durationValue(entry = {}) {
  return entry.valueM3
    ?? entry.volumeM3
    ?? entry.storageVolumeM3
    ?? entry.resultM3
    ?? entry.volume
    ?? null;
}

function durationMinutes(entry = {}) {
  return entry.durationMinutes ?? entry.duration ?? entry.rainDurationMinutes ?? null;
}

export function renderDurationTable(report, dto = {}, kind = 'din') {
  const isDin = kind === 'din';
  const entries = isDin ? (dto.durationComparison?.din || []) : (dto.durationComparison?.dwa || []);
  const governing = isDin ? dto.floodingVerification?.equation21Governing : dto.retentionVerification?.governing;
  const governingDuration = durationMinutes(governing || {});
  const rows = entries.map(entry => {
    const duration = durationMinutes(entry);
    const governingMark = finite(duration) && finite(governingDuration) && Number(duration) === Number(governingDuration);
    return [
      finite(duration) ? `${number(duration, 0)} min` : '—',
      finite(durationValue(entry)) ? `${number(durationValue(entry))} m³` : '—',
      governingMark ? 'maßgebend' : '—'
    ];
  });
  table(report, {
    title: isDin ? '8. DIN 1986-100 – Gleichung (21), Dauerstufenvergleich' : '10. DWA-A 117 – Dauerstufenvergleich',
    headers: ['Regendauer', 'Speichervolumen', 'Bewertung'],
    rows,
    widths: [0.28, 0.34, 0.38],
    rowHeight: 25
  });
}

export function renderRainfallTable(report, dto = {}) {
  const rainfall = dto.rainfall || {};
  const durations = [5, 10, 15];
  const rows = durations.map(duration => [
    `${duration} min`,
    finite(rainfall.r2ByDuration?.[duration]) ? number(rainfall.r2ByDuration[duration]) : '—',
    finite(rainfall.r30ByDuration?.[duration]) ? number(rainfall.r30ByDuration[duration]) : '—',
    finite(rainfall.r100ByDuration?.[duration]) ? number(rainfall.r100ByDuration[duration]) : '—'
  ]);
  table(report, {
    title: '5. Regendaten und Berechnungsgrundlagen',
    headers: ['Regendauer', 'r(D,2) [l/(s·ha)]', 'r(D,30) [l/(s·ha)]', 'r(D,100) [l/(s·ha)]'],
    rows,
    widths: [0.22, 0.26, 0.26, 0.26],
    rowHeight: 25
  });
}

export function authorityTableKind(title = '') {
  if (/^4\.\s*Flächenübersicht/i.test(title)) return 'surfaces';
  if (/^5\.\s*Regendaten/i.test(title)) return 'rainfall';
  if (/^8\.\s*DIN 1986-100.*Dauerstufenvergleich/i.test(title)) return 'din-duration';
  if (/^10\.\s*DWA-A 117.*Dauerstufenvergleich/i.test(title)) return 'dwa-duration';
  return '';
}

export default authorityTableKind;