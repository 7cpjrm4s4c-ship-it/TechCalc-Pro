import { PDF_PAGE, PDF_THEME } from './reportTheme.js';

function normalizeTitle(value = '') {
  return String(value || '').replace(/\s*\(Fortsetzung\)\s*$/i, '').trim();
}

export function recordAuthorityTocEntry(entries = [], title = '', pageNumber = null) {
  const normalized = normalizeTitle(title);
  const match = normalized.match(/^(\d+)\.\s*(.+)$/);
  if (!match || !Number.isFinite(Number(pageNumber))) return false;
  const chapter = Number(match[1]);
  if (entries.some(entry => entry.chapter === chapter)) return false;
  entries.push(Object.freeze({ chapter, title: normalized, pageNumber: Number(pageNumber) }));
  entries.sort((a, b) => a.chapter - b.chapter);
  return true;
}

export function addAuthorityTocPrelude(entries = [], pageNumber = null) {
  if (!Number.isFinite(Number(pageNumber))) return false;
  if (entries.some(entry => entry.chapter === 0)) return false;
  entries.push(Object.freeze({ chapter: 0, title: 'Management Summary', pageNumber: Number(pageNumber) }));
  entries.sort((a, b) => a.chapter - b.chapter);
  return true;
}

export function renderAuthorityTableOfContents(report, pageIndex, entries = [], moduleData = {}) {
  if (!report?.pages?.[pageIndex]) return false;
  const previousPage = report.page;
  const previousCursorY = report.cursorY;
  report.page = report.pages[pageIndex];
  report.cursorY = PDF_THEME.margin;

  const m = PDF_THEME.margin;
  const right = PDF_PAGE.width - m;
  const width = PDF_PAGE.width - m * 2;

  if (report.images?.appIcon) report.drawImage('ImAppIcon', m, m, 38, 38);
  report.text('TechCalc Pro', m + 46, m + 15, { size: 13, font: 'F2' });
  report.text('HLSK QUICK TOOLS', m + 46, m + 29, { size: 6.4, font: 'F2', color: PDF_THEME.muted });

  if (report.images?.companyLogo) {
    const img = report.images.companyLogo;
    const ratio = Math.min(120 / img.width, 56 / img.height);
    const logoWidth = img.width * ratio;
    const logoHeight = img.height * ratio;
    report.drawImage('ImCompanyLogo', right - logoWidth, m, logoWidth, logoHeight);
  } else {
    report.text(moduleData.title || moduleData.shortTitle || 'Überflutungsnachweis', right, m + 24, {
      size: 7.2,
      font: 'F2',
      color: PDF_THEME.muted,
      align: 'right',
      maxWidth: 210
    });
  }
  report.line(m, m + 66, right, m + 66, PDF_THEME.line, 0.8);

  report.text('INHALTSVERZEICHNIS', m, m + 108, { size: 8, font: 'F2', color: PDF_THEME.accent });

  const startY = m + 149;
  const rowHeight = 31;
  entries.forEach((entry, index) => {
    const y = startY + index * rowHeight;
    const isPrelude = entry.chapter === 0;
    if (index) report.line(m, y - 11, right, y - 11, PDF_THEME.rowLine, 0.3);
    report.text(entry.title, m + (isPrelude ? 0 : 2), y + 5, {
      size: isPrelude ? 7.4 : 7.1,
      font: 'F2',
      color: isPrelude ? PDF_THEME.accent : PDF_THEME.text,
      maxWidth: width - 54
    });
    report.text(String(entry.pageNumber), right, y + 5, { size: 7.2, font: 'F2', align: 'right' });
  });

  const endY = startY + entries.length * rowHeight + 10;
  report.line(m, endY, right, endY, PDF_THEME.line, 0.55);

  report.page = previousPage;
  report.cursorY = previousCursorY;
  return true;
}

export default renderAuthorityTableOfContents;