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

  if (report.images?.appIcon) report.drawImage('ImAppIcon', m, m, 30, 30);
  report.text('TechCalc Pro', m + 37, m + 12, { size: 11.2, font: 'F2' });
  report.text('HLSK QUICK TOOLS', m + 37, m + 24, { size: 5.9, font: 'F2', color: PDF_THEME.muted });
  report.text(moduleData.title || moduleData.shortTitle || 'Überflutungsnachweis', right, m + 18, {
    size: 7.2,
    font: 'F2',
    color: PDF_THEME.muted,
    align: 'right',
    maxWidth: 210
  });
  report.line(m, m + 48, right, m + 48, PDF_THEME.line, 0.7);

  report.text('INHALTSVERZEICHNIS', m, m + 91, { size: 8, font: 'F2', color: PDF_THEME.accent });
  report.text('Dokumentstruktur und Kapitelübersicht', m, m + 119, { size: 19, font: 'F2', maxWidth: width });
  report.text('Die Seitenangaben werden aus den tatsächlichen Kapitelstarts des erzeugten Dokuments übernommen.', m, m + 141, {
    size: 7,
    font: 'F1',
    color: PDF_THEME.muted,
    maxWidth: width
  });

  const startY = m + 184;
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
  report.text(`${entries.filter(entry => entry.chapter > 0).length} Fachkapitel`, m, endY + 17, {
    size: 6.4,
    font: 'F2',
    color: PDF_THEME.muted
  });

  report.page = previousPage;
  report.cursorY = previousCursorY;
  return true;
}

export default renderAuthorityTableOfContents;
