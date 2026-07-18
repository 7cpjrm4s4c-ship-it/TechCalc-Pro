import { PDF_PAGE, PDF_THEME } from './reportTheme.js';

const finite = value => Number.isFinite(Number(value));
const CHART_HEADROOM_FACTOR = 1.1;

function number(value, digits = 2) {
  if (!finite(value)) return '—';
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(Number(value));
}

function durationMinutes(entry = {}) {
  return entry.durationMinutes ?? entry.duration ?? entry.rainDurationMinutes ?? null;
}

function volumeM3(entry = {}) {
  return entry.volumeM3 ?? entry.storageVolumeM3 ?? entry.resultM3 ?? entry.valueM3 ?? entry.volume ?? null;
}

function durationSeries(entries = [], governing = {}) {
  const governingDuration = durationMinutes(governing);
  const mapped = entries
    .map(entry => ({
      duration: finite(durationMinutes(entry)) ? Number(durationMinutes(entry)) : null,
      label: finite(durationMinutes(entry)) ? `${number(durationMinutes(entry), 0)} min` : '—',
      value: finite(volumeM3(entry)) ? Math.max(0, Number(volumeM3(entry))) : null
    }))
    .filter(item => item.value != null);
  const maximum = mapped.length ? Math.max(...mapped.map(item => item.value)) : null;
  return mapped.map(item => Object.freeze({
    label: item.label,
    value: item.value,
    governing: maximum != null
      && Math.abs(item.value - maximum) < 1e-9
      && (!finite(governingDuration) || item.duration === Number(governingDuration) || mapped.filter(candidate => Math.abs(candidate.value - maximum) < 1e-9).length === 1)
  }));
}

export function buildAuthorityChartModel(dto = {}) {
  const din = durationSeries(dto.durationComparison?.din || [], dto.floodingVerification?.equation21Governing || {});
  const dwa = durationSeries(dto.durationComparison?.dwa || [], dto.retentionVerification?.governing || {});
  const governingSource = String(dto.summary?.governingSource || '').toLowerCase();
  const comparison = [
    { label: 'DIN 1986-100', value: finite(dto.summary?.dinVolumeM3) ? Number(dto.summary.dinVolumeM3) : null, governing: governingSource.includes('din') || /DIN/i.test(dto.summary?.governingLabel || '') },
    { label: 'DWA-A 117', value: finite(dto.summary?.dwaVolumeM3) ? Number(dto.summary.dwaVolumeM3) : null, governing: governingSource.includes('dwa') || /DWA/i.test(dto.summary?.governingLabel || '') }
  ].filter(item => item.value != null);
  return Object.freeze({ din, dwa, comparison });
}

export function authorityChartScaleMaximum(series = []) {
  const dataMaximum = Math.max(1, ...series.map(item => Math.max(0, Number(item?.value) || 0)));
  return dataMaximum * CHART_HEADROOM_FACTOR;
}

function drawBarChart(report, { title, series, x, y, width, height }) {
  const padding = { top: 25, right: 12, bottom: 35, left: 36 };
  const plotX = x + padding.left;
  const plotY = y + padding.top;
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const scaleMaximum = authorityChartScaleMaximum(series);
  const count = Math.max(1, series.length);
  const slotW = plotW / count;
  const barW = Math.max(2, Math.min(24, slotW * 0.62));

  report.rect(x, y, width, height, { fill: [255, 255, 255], stroke: PDF_THEME.line, width: 0.5 });
  report.text(title, x + 8, y + 13, { size: 7.2, font: 'F2', color: PDF_THEME.accent, maxWidth: width - 16 });

  [0, 0.5, 1].forEach(factor => {
    const lineY = plotY + plotH - plotH * factor;
    report.line(plotX, lineY, plotX + plotW, lineY, PDF_THEME.rowLine, 0.3);
    report.text(`${number(scaleMaximum * factor, factor === 0 ? 0 : 1)} m³`, plotX - 5, lineY + 2, { size: 5.2, font: 'F1', color: PDF_THEME.muted, align: 'right', maxWidth: 31 });
  });

  series.forEach((item, index) => {
    const centerX = plotX + slotW * (index + 0.5);
    const barX = centerX - barW / 2;
    const normalizedValue = Math.max(0, Number(item.value));
    const barH = normalizedValue === 0 ? 1.5 : Math.max(1.5, (normalizedValue / scaleMaximum) * plotH);
    const barY = plotY + plotH - barH;
    const fill = item.governing ? PDF_THEME.accent : PDF_THEME.muted;

    report.rect(barX, barY, barW, barH, { fill, stroke: null, width: 0 });
    report.text(`${number(item.value)} m³`, centerX, Math.max(plotY + 7, barY - 4), { size: 5.5, font: 'F2', color: item.governing ? PDF_THEME.accent : PDF_THEME.text, align: 'center', maxWidth: Math.max(slotW, barW) });
    report.text(item.label, centerX, plotY + plotH + 13, { size: 5.5, font: item.governing ? 'F2' : 'F1', color: item.governing ? PDF_THEME.accent : PDF_THEME.text, align: 'center', maxWidth: slotW });
  });
}

export function renderAuthorityCharts(report, dto = {}) {
  const model = buildAuthorityChartModel(dto);
  if (!model.din.length && !model.dwa.length && !model.comparison.length) return false;

  const m = PDF_THEME.margin;
  const width = PDF_PAGE.width - m * 2;
  const gap = 8;
  const half = (width - gap) / 2;
  const chartHeight = 170;
  const comparisonHeight = 155;
  const totalHeight = 18 + chartHeight + gap + comparisonHeight + 8;

  report.ensureSpace(totalHeight + 8);
  report.sectionTitle('11. Diagramme');
  const startY = report.cursorY;

  if (model.din.length) drawBarChart(report, {
    title: 'DIN 1986-100 – Dauerstufenvergleich',
    series: model.din,
    x: m,
    y: startY,
    width: half,
    height: chartHeight
  });
  if (model.dwa.length) drawBarChart(report, {
    title: 'DWA-A 117 – Dauerstufenvergleich',
    series: model.dwa,
    x: m + half + gap,
    y: startY,
    width: half,
    height: chartHeight
  });

  const comparisonY = startY + chartHeight + gap;
  if (model.comparison.length) drawBarChart(report, {
    title: 'Vergleich der maßgebenden Speichervolumina',
    series: model.comparison,
    x: m,
    y: comparisonY,
    width,
    height: comparisonHeight
  });

  report.cursorY = comparisonY + comparisonHeight + 8;
  return true;
}

export default renderAuthorityCharts;
