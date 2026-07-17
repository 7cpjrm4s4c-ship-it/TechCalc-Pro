import { buildAuthorityCoverPage } from './authorityCoverPage.js';
import { buildAuthorityExecutiveSummary } from './authorityExecutiveSummary.js';
import { renderAuthorityCharts } from './authorityCharts.js';
import { renderAuthorityCorporateBlock } from './authorityCorporateBlock.js';
import {
  addAuthorityTocPrelude,
  recordAuthorityTocEntry,
  renderAuthorityTableOfContents
} from './authorityTableOfContents.js';
import {
  authorityTableKind,
  renderDurationTable,
  renderRainfallTable,
  renderSurfaceTable
} from './authorityTables.js';
import { PDF_PAGE, PDF_THEME } from './reportTheme.js';

export function isFloodingAuthorityReport(moduleData = {}) {
  return moduleData.id === 'flooding-verification'
    && moduleData.reportSource === 'typed-dto'
    && moduleData.reportDto;
}

function formatNumber(value, digits = 2) {
  if (!Number.isFinite(Number(value))) return '—';
  return new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(Number(value));
}

function formatVolume(value) {
  return Number.isFinite(Number(value)) ? `${formatNumber(value)} m³` : '—';
}

function formatArea(value) {
  return Number.isFinite(Number(value)) ? `${formatNumber(value)} m²` : '—';
}

function formatDuration(value) {
  return Number.isFinite(Number(value)) ? `${formatNumber(value, 0)} min` : '—';
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

export function renderAuthorityExecutiveSummary(report, moduleData) {
  const summary = buildAuthorityExecutiveSummary(moduleData);
  const m = PDF_THEME.margin;
  const width = PDF_PAGE.width - m * 2;
  const heroHeight = 62;
  const metricHeight = 45;
  const narrativeHeight = summary.criticalNotice ? 94 : 72;
  const totalHeight = 20 + heroHeight + 7 + metricHeight + 7 + narrativeHeight + 8;

  report.ensureSpace(totalHeight + 8, { repeatTitle: 'MANAGEMENT SUMMARY' });
  const startY = report.cursorY;
  report.text('MANAGEMENT SUMMARY', m, startY + 7, { size: 8.6, font: 'F2', color: PDF_THEME.accent });

  const heroY = startY + 18;
  report.rect(m, heroY, width, heroHeight, { fill: PDF_THEME.soft, stroke: PDF_THEME.line, width: 0.65 });
  report.text('PLANERISCH ANZUSETZENDES SPEICHERVOLUMEN', m + 12, heroY + 17, { size: 6.4, font: 'F2', color: PDF_THEME.muted });
  report.text(formatVolume(summary.planningVolumeM3), m + 12, heroY + 45, { size: 19, font: 'F2', color: PDF_THEME.accent });
  report.text(`Maßgebend: ${summary.governingLabel}`, m + width - 12, heroY + 22, { size: 7.1, font: 'F2', align: 'right', maxWidth: 190 });
  report.text(summary.statusLabel, m + width - 12, heroY + 42, { size: 7.4, font: 'F2', align: 'right', maxWidth: 190 });

  const metricY = heroY + heroHeight + 7;
  const gap = 6;
  const metricWidth = (width - gap * 3) / 4;
  const metrics = [
    ['BEMESSUNGSDAUER', formatDuration(summary.governingDurationMinutes)],
    ['GESAMTFLÄCHE', formatArea(summary.totalAreaM2)],
    ['DIN-VOLUMEN', formatVolume(summary.dinVolumeM3)],
    ['DWA-VOLUMEN', formatVolume(summary.dwaVolumeM3)]
  ];
  metrics.forEach(([label, value], index) => {
    const x = m + index * (metricWidth + gap);
    report.rect(x, metricY, metricWidth, metricHeight, { fill: [255, 255, 255], stroke: PDF_THEME.line, width: 0.45 });
    report.text(label, x + 6, metricY + 13, { size: 5.6, font: 'F2', color: PDF_THEME.muted, maxWidth: metricWidth - 12 });
    report.text(value, x + 6, metricY + 31, { size: 8.2, font: 'F2', maxWidth: metricWidth - 12 });
  });

  const narrativeY = metricY + metricHeight + 7;
  report.rect(m, narrativeY, width, narrativeHeight, { fill: [255, 255, 255], stroke: PDF_THEME.line, width: 0.45 });
  const statusText = `Status: ${summary.errors} Fehler · ${summary.warnings} Warnungen · ${summary.hints} Hinweise`;
  report.text(statusText, m + 8, narrativeY + 13, { size: 6.5, font: 'F2', color: PDF_THEME.muted, maxWidth: width - 16 });
  report.text(summary.statement, m + 8, narrativeY + 31, { size: 6.9, font: 'F2', maxWidth: width - 16, lineHeight: 1.18 });
  report.text(`Empfehlung: ${summary.recommendation}`, m + 8, narrativeY + 52, { size: 6.6, font: 'F1', maxWidth: width - 16, lineHeight: 1.18 });
  if (summary.criticalNotice) {
    report.line(m + 8, narrativeY + 69, m + width - 8, narrativeY + 69, PDF_THEME.rowLine, 0.35);
    report.text(`Kritischer Hinweis: ${summary.criticalNotice}`, m + 8, narrativeY + 82, { size: 6.5, font: 'F2', color: PDF_THEME.accent, maxWidth: width - 16, lineHeight: 1.16 });
  }

  report.cursorY = startY + totalHeight;
}

function renderAuthorityTable(report, section, dto) {
  const kind = authorityTableKind(section?.title || '');
  if (kind === 'surfaces') renderSurfaceTable(report, dto);
  else if (kind === 'rainfall') renderRainfallTable(report, dto);
  else if (kind === 'din-duration') renderDurationTable(report, dto, 'din');
  else if (kind === 'dwa-duration') renderDurationTable(report, dto, 'dwa');
  else return false;
  return true;
}

export function installAuthorityCoverPage(GlobalPdfReport) {
  if (!GlobalPdfReport?.prototype || GlobalPdfReport.prototype.__tcAuthorityCoverInstalled) return false;
  const originalBuild = GlobalPdfReport.prototype.build;
  GlobalPdfReport.prototype.build = function buildWithAuthorityCover(project, moduleData) {
    if (!isFloodingAuthorityReport(moduleData)) return originalBuild.call(this, project, moduleData);

    renderAuthorityCoverPage(this, project, moduleData);
    this.addPage();
    const tocPageIndex = this.pages.length - 1;
    this.addPage();

    const tocEntries = [];
    const originalProjectData = this.projectData;
    const originalStandardSection = this.standardSection;
    const originalCorporateBlock = this.corporateBlock;
    const originalSectionTitle = this.sectionTitle;
    const originalFooter = this.footer;

    this.projectData = function projectDataWithExecutiveSummary(projectData) {
      originalProjectData.call(this, projectData);
      addAuthorityTocPrelude(tocEntries, this.pages.length);
      renderAuthorityExecutiveSummary(this, moduleData);
    };
    this.sectionTitle = function sectionTitleWithToc(title) {
      recordAuthorityTocEntry(tocEntries, title, this.pages.length);
      return originalSectionTitle.call(this, title);
    };
    this.standardSection = function authorityAwareStandardSection(section) {
      if (!renderAuthorityTable(this, section, moduleData.reportDto)) originalStandardSection.call(this, section);
    };
    this.corporateBlock = function corporateBlockWithAuthorityCharts(projectData, currentModuleData) {
      renderAuthorityCharts(this, moduleData.reportDto);
      renderAuthorityCorporateBlock(this, projectData, currentModuleData);
    };
    this.footer = function footerWithAuthorityToc() {
      renderAuthorityTableOfContents(this, tocPageIndex, tocEntries, moduleData);
      return originalFooter.call(this);
    };

    try {
      return originalBuild.call(this, project, moduleData);
    } finally {
      this.projectData = originalProjectData;
      this.standardSection = originalStandardSection;
      this.corporateBlock = originalCorporateBlock;
      this.sectionTitle = originalSectionTitle;
      this.footer = originalFooter;
    }
  };
  Object.defineProperty(GlobalPdfReport.prototype, '__tcAuthorityCoverInstalled', { value: true });
  return true;
}

export default installAuthorityCoverPage;
