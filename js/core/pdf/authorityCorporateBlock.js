import { PDF_PAGE, PDF_THEME } from './reportTheme.js';

const clean = value => String(value ?? '').trim();

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return clean(value) || '—';
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

export function buildAuthorityCorporateData(project = {}, moduleData = {}) {
  const dto = moduleData.reportDto || {};
  const metadata = dto.metadata || {};
  return Object.freeze({
    company: clean(project.companyName) || '—',
    address: clean(project.companyAddress),
    documentVersion: clean(project.documentVersion) || clean(metadata.appVersion) || '—',
    module: clean(moduleData.shortTitle) || clean(moduleData.title) || clean(metadata.moduleTitle) || 'Überflutungsnachweis',
    generatedAt: formatDate(metadata.generatedAt),
    checkedBy: clean(project.checkedBy),
    approvedBy: clean(project.approvedBy)
  });
}

export function renderAuthorityCorporateBlock(report, project = {}, moduleData = {}) {
  const data = buildAuthorityCorporateData(project, moduleData);
  const m = PDF_THEME.margin;
  const width = PDF_PAGE.width - m * 2;
  const hasApproval = Boolean(data.checkedBy || data.approvedBy);
  const hasAddress = Boolean(data.address);
  const height = hasAddress || hasApproval ? 54 : 42;

  report.ensureSpace(height + 8);
  const y = report.cursorY + 3;
  report.rect(m, y, width, height, { fill: PDF_THEME.soft, stroke: PDF_THEME.line, width: 0.45 });
  report.text('DOKUMENTINFORMATION', m + 7, y + 10, { size: 6.2, font: 'F2', color: PDF_THEME.accent });

  const columnGap = 10;
  const colWidth = (width - 14 - columnGap * 3) / 4;
  const columns = [0, 1, 2, 3].map(index => m + 7 + index * (colWidth + columnGap));
  const labels = ['Firma', 'Dokumentversion', 'Modul', 'Ausgabedatum'];
  const values = [data.company, data.documentVersion, data.module, data.generatedAt];

  labels.forEach((label, index) => {
    const x = columns[index];
    report.text(label.toUpperCase(), x, y + 22, { size: 5.2, font: 'F2', color: PDF_THEME.muted, maxWidth: colWidth });
    report.text(values[index] || '—', x, y + 34, { size: 6.2, font: 'F2', maxWidth: colWidth, lineHeight: 1.1 });
  });

  if (hasAddress || hasApproval) {
    const lower = [];
    if (hasAddress) lower.push(`Anschrift: ${data.address}`);
    if (data.checkedBy) lower.push(`Geprüft: ${data.checkedBy}`);
    if (data.approvedBy) lower.push(`Freigabe: ${data.approvedBy}`);
    report.line(m + 7, y + 40, m + width - 7, y + 40, PDF_THEME.rowLine, 0.3);
    report.text(lower.join(' · '), m + 7, y + 49, { size: 5.7, font: 'F1', color: PDF_THEME.muted, maxWidth: width - 14 });
  }

  report.cursorY = y + height + 5;
  return true;
}

export default renderAuthorityCorporateBlock;
