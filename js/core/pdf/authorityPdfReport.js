import { buildAuthorityCoverPage } from './authorityCoverPage.js';
import { buildAuthorityExecutiveSummary } from './authorityExecutiveSummary.js';
import { renderAuthorityCharts } from './authorityCharts.js';
import { renderAuthorityCorporateBlock } from './authorityCorporateBlock.js';
import { applyAuthorityReportPolicy } from './authorityReportPolicy.js';
import { isDwaVerificationRequired } from './authorityReportScope.js';
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

const EXECUTIVE_SUMMARY_TITLE = 'ZUSAMMENFASSUNG';

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
  report.text(cover.eyebrow, center, 250, {
    size: 9,
    font: 'F2',
    color: PDF_THEME.accent,
    align: 'center'
  });
  report.text(cover.title, center, 292, {
    size: 27,
    font: 'F2',
    align: 'center',
    maxWidth: width - 70,
    lineHeight: 1.1
  });
}

export function renderAuthorityExecutiveSummary(report, moduleData) {
  const summary = buildAuthorityExecutiveSummary(moduleData);
  const dwaRequired = isDwaVerificationRequired(moduleData.reportDto);
  const m = PDF_THEME.margin;
  const width = PDF_PAGE.width - m * 2;
  const heroHeight = 62;
  const metricHeight = 45;
  const totalHeight = 20 + heroHeight + 7 + metricHeight + 8;

  report.ensureSpace(totalHeight + 8, { repeatTitle: EXECUTIVE_SUMMARY_TITLE });
  const startY = report.cursorY;
  report.text(EXECUTIVE_SUMMARY_TITLE, m, startY + 7, { size: 8.6, font: 'F2', color: PDF_THEME.accent });

  const heroY = startY + 18;
  report.rect(m, heroY, width, heroHeight, { fill: PDF_THEME.soft, stroke: PDF_THEME.line, width: 0.65 });
  report.text('PLANERISCH ANZUSETZENDES SPEICHERVOLUMEN', m + 12, heroY + 17, { size: 6.4, font: 'F2', color: PDF_THEME.muted });
  report.text(formatVolume(summary.planningVolumeM3), m + 12, heroY + 45, { size: 19, font: 'F2', color: PDF_THEME.accent });
  report.text(`Maßgebend: ${summary.governingLabel}`, m + width - 12, heroY + 33, { size: 7.4, font: 'F2', align: 'right', maxWidth: 190 });

  const metricY = heroY + heroHeight + 7;
  const gap = 6;
  const metrics = [
    ['BEMESSUNGSDAUER', formatDuration(summary.governingDurationMinutes)],
    ['GESAMTFLÄCHE', formatArea(summary.totalAreaM2)],
    ['DIN-VOLUMEN', formatVolume(summary.dinVolumeM3)]
  ];
  if (dwaRequired) metrics.push(['DWA-VOLUMEN', formatVolume(summary.dwaVolumeM3)]);
  const metricWidth = (width - gap * (metrics.length - 1)) / metrics.length;
  metrics.forEach(([label, value], index) => {
    const x = m + index * (metricWidth + gap);
    report.rect(x, metricY, metricWidth, metricHeight, { fill: [255, 255, 255], stroke: PDF_THEME.line, width: 0.45 });
    report.text(label, x + 6, metricY + 13, { size: 5.6, font: 'F2', color: PDF_THEME.muted, maxWidth: metricWidth - 12 });
    report.text(value, x + 6, metricY + 31, { size: 8.2, font: 'F2', maxWidth: metricWidth - 12 });
  });

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
      const publicSection = applyAuthorityReportPolicy(section, moduleData.reportDto);
      if (!publicSection?.rows?.length) return;
      if (!renderAuthorityTable(this, publicSection, moduleData.reportDto)) {
        originalStandardSection.call(this, publicSection);
      }
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