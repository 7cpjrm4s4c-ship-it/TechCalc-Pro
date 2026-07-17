import { buildAuthorityCoverPage } from './authorityCoverPage.js';
import { PDF_PAGE, PDF_THEME } from './reportTheme.js';

export function isFloodingAuthorityReport(moduleData = {}) {
  return moduleData.id === 'flooding-verification'
    && moduleData.reportSource === 'typed-dto'
    && moduleData.reportDto;
}

function formatVolume(value) {
  if (!Number.isFinite(Number(value))) return '—';
  return `${new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value))} m3`;
}

export function renderAuthorityCoverPage(report, project, moduleData) {
  const cover = buildAuthorityCoverPage({ project, moduleData });
  const m = PDF_THEME.margin;
  const right = PDF_PAGE.width - m;
  const width = PDF_PAGE.width - m * 2;
  const center = PDF_PAGE.width / 2;

  if (report.images.appIcon) report.drawImage('ImAppIcon', m, m, 38, 38);
  report.text('TechCalc Pro', m + 46, m + 15, { size: 13, font: 'F2' });
  report.text('HLSK QUICK TOOLS', m + 46, m + 29, { size: 6.4, font: 'F2', color: PDF_THEME.muted });

  if (report.images.companyLogo) {
    const img = report.images.companyLogo;
    const ratio = Math.min(120 / img.width, 56 / img.height);
    const logoWidth = img.width * ratio;
    const logoHeight = img.height * ratio;
    report.drawImage('ImCompanyLogo', right - logoWidth, m, logoWidth, logoHeight);
  }

  report.line(m, m + 66, right, m + 66, PDF_THEME.line, 0.8);
  report.text(cover.eyebrow, center, 150, { size: 8, font: 'F2', color: PDF_THEME.accent, align: 'center' });
  report.text(cover.title, center, 185, { size: 25, font: 'F2', align: 'center', maxWidth: width - 70, lineHeight: 1.1 });
  report.text(cover.subtitle, center, 225, { size: 10, font: 'F1', color: PDF_THEME.muted, align: 'center' });
  report.text('DIN 1986-100  ·  DWA-A 117', center, 250, { size: 8.4, font: 'F2', color: PDF_THEME.accent, align: 'center' });

  const resultY = 300;
  report.rect(m + 62, resultY, width - 124, 92, { fill: PDF_THEME.soft, stroke: PDF_THEME.line, width: 0.7 });
  report.text('PLANERISCH ANZUSETZENDES SPEICHERVOLUMEN', center, resultY + 22, { size: 6.8, font: 'F2', color: PDF_THEME.muted, align: 'center' });
  report.text(formatVolume(cover.planningVolume), center, resultY + 56, { size: 22, font: 'F2', color: PDF_THEME.accent, align: 'center' });
  report.text(`Maßgebender Nachweis: ${cover.governingVerification}`, center, resultY + 77, { size: 7.6, font: 'F2', align: 'center', maxWidth: width - 150 });

  const dataY = 440;
  const rowHeight = 29;
  const labelX = m + 22;
  const valueX = m + 155;
  const dataWidth = width - 44;
  const rows = [
    ['Projekt', cover.project],
    ['Projektnummer', cover.projectNo],
    ['Auftraggeber', cover.client],
    ['Sachbearbeitung', cover.engineer],
    ['Behörde / Netzbetreiber', cover.authority],
    ['Aktenzeichen / Referenz', cover.authorityReference],
    ['Dokumentversion', cover.documentVersion],
    ['Ausgabedatum', cover.date]
  ];
  report.rect(m + 12, dataY - 10, dataWidth + 20, rows.length * rowHeight + 20, { fill: [255, 255, 255], stroke: PDF_THEME.line, width: 0.55 });
  rows.forEach(([label, value], index) => {
    const y = dataY + index * rowHeight;
    if (index) report.line(m + 20, y - 9, right - 20, y - 9, PDF_THEME.rowLine, 0.3);
    report.text(label, labelX, y + 7, { size: 6.4, font: 'F2', color: PDF_THEME.muted, maxWidth: 118 });
    report.text(value || '—', valueX, y + 7, { size: 7.2, font: 'F2', maxWidth: right - valueX - 24 });
  });

  const approvalY = 708;
  report.line(m, approvalY, right, approvalY, PDF_THEME.line, 0.55);
  report.text(cover.companyName, m, approvalY + 18, { size: 7, font: 'F2', maxWidth: 170 });
  report.text(`Geprüft: ${cover.checkedBy}`, center, approvalY + 18, { size: 6.6, font: 'F1', align: 'center', maxWidth: 150 });
  report.text(`Freigabe: ${cover.approvedBy}`, right, approvalY + 18, { size: 6.6, font: 'F1', align: 'right', maxWidth: 150 });
}

export function installAuthorityCoverPage(GlobalPdfReport) {
  if (!GlobalPdfReport?.prototype || GlobalPdfReport.prototype.__tcAuthorityCoverInstalled) return false;
  const originalBuild = GlobalPdfReport.prototype.build;
  GlobalPdfReport.prototype.build = function buildWithAuthorityCover(project, moduleData) {
    if (!isFloodingAuthorityReport(moduleData)) return originalBuild.call(this, project, moduleData);
    renderAuthorityCoverPage(this, project, moduleData);
    this.addPage();
    return originalBuild.call(this, project, moduleData);
  };
  Object.defineProperty(GlobalPdfReport.prototype, '__tcAuthorityCoverInstalled', { value: true });
  return true;
}

export default installAuthorityCoverPage;
