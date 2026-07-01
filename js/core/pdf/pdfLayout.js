import { PDF_PAGE, PDF_THEME, PDF_GRID } from './reportTheme.js';
import { reportSections, lineSectionItems } from './pdfDataMapping.js';
import { parseJpegDataUrl } from './pdfChartRender.js';
import { sanitizeText, normalizeKey, pdfHexText, pdfNumber, estimateTextWidth, splitPdfText, rgb, pdfRowValue } from './pdfText.js';

function cleanRows(rows = []) {
  return rows
    .filter(row => normalizeKey(row?.[0] || '') !== 'bezeichnung')
    .filter(row => row.some(cell => sanitizeText(cell)));
}

function pairedRowsForPdf(rows = []) {
  const rowsClean = cleanRows(rows);
  const preferredOrder = [
    'leistung', 'massenstrom', 'volumenstrom', 'temperaturdifferenz', 'waermetraeger',
    'rohrdimension', 'rohrabmessung', 'werkstoff', 'geschwindigkeit', 'druckverlust'
  ];
  const rank = row => {
    const key = normalizeKey(row?.[0] || '');
    const index = preferredOrder.indexOf(key);
    return index === -1 ? preferredOrder.length + rowsClean.indexOf(row) : index;
  };
  const ordered = [...rowsClean].sort((a, b) => rank(a) - rank(b));
  return pairSequentialRows(ordered);
}

function pairSequentialRows(rows = []) {
  const leftCount = Math.ceil(rows.length / 2);
  const left = rows.slice(0, leftCount);
  const right = rows.slice(leftCount);
  const pairs = [];
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    pairs.push([left[index] || null, right[index] || null]);
  }
  return pairs;
}

function pdfValueForRow(row = []) {
  return pdfRowValue(row).replace(/ - /g, ' x ');
}

function tableColumns(x, width) {
  // RC.9: one immutable four-column grid for every module.  The even
  // columns are not computed per row; they use fixed right anchors inside
  // the two half-width cells.  This is the central reference edge requested
  // for all values, units, text, formulas and special-character fallbacks.
  const gap = PDF_THEME.table.gap;
  const available = width - gap;
  const halfW = available / 2;
  const valueW = Math.min(PDF_THEME.table.valueColumnWidth, Math.max(112, halfW * 0.48));
  const labelW = Math.max(74, halfW - valueW - PDF_THEME.table.cellGap);
  const leftValueRightX = x + halfW - PDF_THEME.table.valueRightInset;
  const rightLabelX = x + halfW + gap;
  const rightValueRightX = x + width - PDF_THEME.table.valueRightInset;
  return {
    left: {
      labelX: x,
      labelW,
      valueRightX: leftValueRightX,
      valueW
    },
    right: {
      labelX: rightLabelX,
      labelW,
      valueRightX: rightValueRightX,
      valueW
    },
    rowLineEnd: x + width
  };
}

function drawRightAlignedValue(report, value, rightX, y, { size = PDF_THEME.table.valueSize, maxWidth = 96, color = PDF_THEME.table.valueColor, font = 'F4', lineHeight = 1.15 } = {}) {
  // Values in all even columns share a fixed right-side anchor. Wrapping is
  // performed before drawing; every continuation line keeps the exact same
  // reference edge so numbers, text and units align module-wide.
  report.text(value, rightX, y, { size, font, color, align: 'right', maxWidth, lineHeight });
}

function pairRowHeight(pair, columns, { labelSize = PDF_THEME.table.labelSize, valueSize = PDF_THEME.table.valueSize } = {}) {
  let lines = 1;
  pair.forEach((row, index) => {
    if (!row) return;
    const col = index === 0 ? columns.left : columns.right;
    const labelLines = splitPdfText(row?.[0] || '-', col.labelW - 4, labelSize).length;
    const valueLines = splitPdfText(pdfValueForRow(row), col.valueW, valueSize).length;
    lines = Math.max(lines, labelLines, valueLines);
  });
  return Math.max(PDF_THEME.table.rowMinHeight, lines * Math.max(labelSize, valueSize) * 1.22 + PDF_THEME.table.rowPaddingTop + PDF_THEME.table.rowPaddingBottom);
}

function drawPairedRow(report, pair, x, y, width, rowHeight, { labelSize = PDF_THEME.table.labelSize, valueSize = PDF_THEME.table.valueSize } = {}) {
  const columns = tableColumns(x, width);
  pair.forEach((row, index) => {
    if (!row) return;
    const col = index === 0 ? columns.left : columns.right;
    const labelLineHeight = 1.15;
    const valueLineHeight = 1.15;
    const labelLines = splitPdfText(row?.[0] || '-', col.labelW - 4, labelSize).length;
    const valueLines = splitPdfText(pdfValueForRow(row), col.valueW, valueSize).length;
    const labelBlockH = Math.max(labelSize, labelLines * labelSize * labelLineHeight);
    const valueBlockH = Math.max(valueSize, valueLines * valueSize * valueLineHeight);
    const labelBaseline = y + Math.max(PDF_THEME.table.rowPaddingTop + labelSize, (rowHeight - labelBlockH) / 2 + labelSize);
    const valueBaseline = y + Math.max(PDF_THEME.table.rowPaddingTop + valueSize, (rowHeight - valueBlockH) / 2 + valueSize);
    report.text(row?.[0] || '-', col.labelX, labelBaseline, {
      size: labelSize,
      font: 'F2',
      color: PDF_THEME.table.labelColor,
      maxWidth: col.labelW - 4,
      lineHeight: labelLineHeight
    });
    drawRightAlignedValue(report, pdfValueForRow(row), col.valueRightX, valueBaseline, {
      size: valueSize,
      maxWidth: col.valueW,
      lineHeight: valueLineHeight
    });
  });
}

export class GlobalPdfReport {
  constructor(images = {}) {
    this.images = images;
    this.imageResources = [];
    if (images.appIcon) this.imageResources.push({ name: 'ImAppIcon', image: images.appIcon });
    if (images.companyLogo) this.imageResources.push({ name: 'ImCompanyLogo', image: images.companyLogo });
    if (images.chartImage) this.imageResources.push({ name: 'ImChart', image: images.chartImage });
    this.pages = [];
    this.addPage();
  }

  addPage() { this.page = []; this.pages.push(this.page); this.cursorY = PDF_THEME.margin; }
  cmd(command) { this.page.push(command); }
  y(topY) { return PDF_PAGE.height - topY; }
  color(values, stroke = false) { this.cmd(`${rgb(values)} ${stroke ? 'RG' : 'rg'}`); }

  text(value, x, y, { size = 8, font = 'F1', color = PDF_THEME.text, align = 'left', maxWidth = null, lineHeight = 1.18 } = {}) {
    const lines = maxWidth ? splitPdfText(value, maxWidth, size) : [sanitizeText(value)];
    lines.forEach((line, index) => {
      const lineY = y + index * size * lineHeight;
      let lineX = x;
      if (align === 'center') lineX = x - estimateTextWidth(line, size, font) / 2;
      if (align === 'right') lineX = x - estimateTextWidth(line, size, font);
      this.color(color);
      this.cmd(`BT /${font} ${pdfNumber(size)} Tf ${pdfNumber(lineX)} ${pdfNumber(this.y(lineY))} Td ${pdfHexText(line)} Tj ET`);
    });
    return lines.length * size * lineHeight;
  }

  line(x1, y1, x2, y2, color = PDF_THEME.line, width = 0.5) {
    this.color(color, true);
    this.cmd(`${pdfNumber(width)} w ${pdfNumber(x1)} ${pdfNumber(this.y(y1))} m ${pdfNumber(x2)} ${pdfNumber(this.y(y2))} l S`);
  }

  rect(x, y, w, h, { fill = null, stroke = PDF_THEME.line, width = 0.5 } = {}) {
    if (fill) this.color(fill);
    if (stroke) this.color(stroke, true);
    this.cmd(`${pdfNumber(width)} w ${pdfNumber(x)} ${pdfNumber(this.y(y + h))} ${pdfNumber(w)} ${pdfNumber(h)} re ${fill && stroke ? 'B' : fill ? 'f' : 'S'}`);
  }

  drawImage(resourceName, x, y, w, h) {
    if (!resourceName) return false;
    this.cmd(`q ${pdfNumber(w)} 0 0 ${pdfNumber(h)} ${pdfNumber(x)} ${pdfNumber(this.y(y + h))} cm /${resourceName} Do Q`);
    return true;
  }

  contentBottom() { return PDF_PAGE.height - PDF_THEME.margin - 18; }
  ensureSpace(requiredHeight, { repeatTitle = '' } = {}) {
    if (this.cursorY + requiredHeight <= this.contentBottom()) return false;
    this.addPage();
    if (repeatTitle) this.sectionTitle(`${repeatTitle} (Fortsetzung)`);
    return true;
  }

  header(project, moduleData, date) {
    const m = PDF_THEME.margin;
    const right = PDF_PAGE.width - m;
    const titleX = PDF_PAGE.width / 2;
    const logoW = 104;
    const logoH = 52;
    if (this.images.appIcon) this.drawImage('ImAppIcon', m, this.cursorY + 4, 26, 26);
    this.text('TechCalc Pro', m + 31, this.cursorY + 13, { size: 10.2, font: 'F2' });
    this.text('HLSK QUICK TOOLS', m + 31, this.cursorY + 24, { size: 5.8, font: 'F2', color: PDF_THEME.muted });
    this.text('Berechnungsprotokoll', titleX, this.cursorY + 10, { size: 14, font: 'F2', align: 'center' });
    this.text(`${moduleData.title || moduleData.shortTitle || 'Modul'} - ${date}`, titleX, this.cursorY + 25, { size: 7.2, font: 'F2', color: PDF_THEME.muted, align: 'center', maxWidth: 180 });
    if (this.images.companyLogo) {
      const img = this.images.companyLogo;
      const ratio = Math.min(logoW / img.width, logoH / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      this.drawImage('ImCompanyLogo', right - w, this.cursorY + 2 + (logoH - h) / 2, w, h);
    }
    this.cursorY += 62;
    this.line(m, this.cursorY, right, this.cursorY, PDF_THEME.line, 0.6);
    this.cursorY += 6;
  }

  projectData(project) {
    const m = PDF_THEME.margin;
    const w = PDF_PAGE.width - m * 2;
    const y = this.cursorY;
    const cols = [m, m + w * 0.25, m + w * 0.5, m + w * 0.75];
    const labels = ['PROJEKT', 'PROJEKTNR.', 'AUFTRAGGEBER', 'SACHBEARBEITER'];
    const values = [project.project, project.projectNo, project.client, project.engineer];
    this.rect(m, y, w, 20, { fill: PDF_THEME.soft, stroke: PDF_THEME.line, width: 0.45 });
    labels.forEach((label, i) => {
      this.text(label, cols[i] + 3, y + 6, { size: 5.6, font: 'F2', color: PDF_THEME.muted, maxWidth: w * 0.22 });
      this.text(values[i] || '-', cols[i] + 3, y + 14, { size: 6.8, font: 'F2', maxWidth: w * 0.22 });
    });
    this.cursorY += 24;
  }

  sectionTitle(title) {
    this.ensureSpace(18);
    this.text(title, PDF_THEME.margin, this.cursorY + 5, { size: 8.4, font: 'F2', color: PDF_THEME.accent, maxWidth: PDF_PAGE.width - PDF_THEME.margin * 2 });
    this.cursorY += 11;
  }

  lineBlock(item, groupTitle = '') {
    const pairs = pairedRowsForPdf(item.rows);
    const m = PDF_THEME.margin;
    const w = PDF_PAGE.width - m * 2;
    const innerX = m + 5;
    const innerW = w - 10;
    const columns = tableColumns(innerX, innerW);
    const rowHeights = pairs.map(pair => pairRowHeight(pair, columns, { labelSize: 6.2, valueSize: 6.35 }));
    const headerHeight = 18;
    const topPad = 4.5;
    const bottomPad = 5.5;
    const blockHeight = headerHeight + topPad + rowHeights.reduce((sum, h) => sum + h, 0) + bottomPad;
    this.ensureSpace(blockHeight + 2, { repeatTitle: groupTitle });
    const y0 = this.cursorY;
    const bodyTop = y0 + headerHeight + topPad;
    this.rect(m, y0, w, blockHeight, { fill: [255, 255, 255], stroke: PDF_THEME.line, width: 0.55 });
    this.rect(m, y0, w, headerHeight, { fill: PDF_THEME.soft, stroke: PDF_THEME.line, width: 0.45 });
    this.text(item.title || 'Abschnitt', m + 5, y0 + 11.2, { size: 7.8, font: 'F2', maxWidth: w - 10 });
    let rowY = bodyTop;
    pairs.forEach((pair, index) => {
      const h = rowHeights[index];
      this.line(innerX, rowY + h - 2.1, innerX + innerW, rowY + h - 2.1, PDF_THEME.rowLine, 0.32);
      drawPairedRow(this, pair, innerX, rowY, innerW, h, { labelSize: 6.2, valueSize: 6.35 });
      rowY += h;
    });
    this.cursorY += blockHeight + 6;
  }

  standardSection(section) {
    const rows = section.rows.filter(row => row.some(cell => sanitizeText(cell)));
    if (!rows.length) return;
    this.sectionTitle(section.title);
    const pairs = pairSequentialRows(rows);
    const m = PDF_THEME.margin;
    const w = PDF_PAGE.width - m * 2;
    const innerX = m + 5;
    const innerW = w - 10;
    const columns = tableColumns(innerX, innerW);
    const rowHeights = pairs.map(pair => pairRowHeight(pair, columns, { labelSize: 6.1, valueSize: 6.25 }));
    const blockHeight = 4 + rowHeights.reduce((sum, h) => sum + h, 0) + 4;
    this.ensureSpace(blockHeight + 2, { repeatTitle: section.title });
    const y0 = this.cursorY;
    this.rect(m, y0, w, blockHeight, { fill: [255, 255, 255], stroke: PDF_THEME.line, width: 0.45 });
    let rowY = y0 + 4;
    pairs.forEach((pair, index) => {
      const h = rowHeights[index];
      this.line(innerX, rowY + h - 2, innerX + innerW, rowY + h - 2, PDF_THEME.rowLine, 0.3);
      drawPairedRow(this, pair, innerX, rowY, innerW, h, { labelSize: 6.1, valueSize: 6.25 });
      rowY += h;
    });
    this.cursorY += blockHeight + 5;
  }

  chartBlock() {
    if (!this.images.chartImage) return;
    const m = PDF_THEME.margin;
    const w = PDF_PAGE.width - m * 2;
    const boxW = w;
    const pad = PDF_THEME.chart.padding;
    const desiredH = PDF_THEME.chart.fixedHeight || Math.min(PDF_THEME.chart.maxHeight, Math.max(PDF_THEME.chart.minHeight, boxW * 0.64));
    const imageW = Math.max(1, this.images.chartImage.width || boxW);
    const imageH = Math.max(1, this.images.chartImage.height || desiredH);
    const ratio = Math.min((boxW - pad * 2) / imageW, (desiredH - pad * 2) / imageH);
    const imgW = imageW * ratio;
    const imgH = imageH * ratio;
    this.ensureSpace(desiredH + 30, { repeatTitle: 'h,x-Diagramm' });
    this.sectionTitle('h,x-Diagramm');
    this.rect(m, this.cursorY, boxW, desiredH, { fill: [255, 255, 255], stroke: PDF_THEME.line, width: 0.45 });
    // Preserve aspect ratio exactly; center inside a fixed chart frame so the diagram is never vertically compressed or cropped.
    this.drawImage('ImChart', m + (boxW - imgW) / 2, this.cursorY + pad + (desiredH - pad * 2 - imgH) / 2, imgW, imgH);
    this.cursorY += desiredH + 8;
  }

  corporateBlock(project, moduleData) {
    const hasCorporate = [project.companyName, project.companyAddress, project.documentVersion, project.checkedBy, project.approvedBy].some(value => sanitizeText(value));
    if (!hasCorporate) return;
    const m = PDF_THEME.margin;
    const w = PDF_PAGE.width - m * 2;
    const blockHeight = 58;
    this.ensureSpace(blockHeight + 6);
    const y0 = this.cursorY + 4;
    this.rect(m, y0, w, blockHeight, { fill: PDF_THEME.soft, stroke: PDF_THEME.line, width: 0.45 });
    this.text('DOKUMENT / CORPORATE DESIGN', m + 5, y0 + 8.5, { size: 6.6, font: 'F2', color: PDF_THEME.accent });
    const leftX = m + 5, midX = m + w * 0.48, rightX = m + w * 0.72, baseY = y0 + 20;
    this.text('Firma', leftX, baseY, { size: 6.1, font: 'F2', color: PDF_THEME.muted });
    this.text(project.companyName || '-', leftX + 36, baseY, { size: 6.6, font: 'F2', maxWidth: w * 0.36 });
    this.text('Anschrift', leftX, baseY + 12, { size: 6.1, font: 'F2', color: PDF_THEME.muted });
    this.text(project.companyAddress || '-', leftX + 36, baseY + 12, { size: 6.4, font: 'F1', maxWidth: w * 0.36 });
    this.text('Dokumentversion', midX, baseY, { size: 6.1, font: 'F2', color: PDF_THEME.muted });
    this.text(project.documentVersion || '-', midX + 58, baseY, { size: 6.6, font: 'F2', maxWidth: 72 });
    this.text('Modul', midX, baseY + 12, { size: 6.1, font: 'F2', color: PDF_THEME.muted });
    this.text(moduleData.shortTitle || moduleData.title || '-', midX + 58, baseY + 12, { size: 6.4, font: 'F1', maxWidth: 72 });
    this.text('Geprüft', rightX, baseY, { size: 6.1, font: 'F2', color: PDF_THEME.muted });
    this.text(project.checkedBy || '-', rightX + 35, baseY, { size: 6.6, font: 'F2', maxWidth: 80 });
    this.text('Freigabe', rightX, baseY + 12, { size: 6.1, font: 'F2', color: PDF_THEME.muted });
    this.text(project.approvedBy || '-', rightX + 35, baseY + 12, { size: 6.6, font: 'F2', maxWidth: 80 });
    this.cursorY = y0 + blockHeight + 6;
  }

  footer() {
    const total = this.pages.length;
    this.pages.forEach((page, index) => {
      this.page = page;
      this.text(`Seite ${index + 1} von ${total}`, PDF_PAGE.width - PDF_THEME.margin, PDF_PAGE.height - 6, { size: 6.5, font: 'F1', color: PDF_THEME.muted, align: 'right' });
    });
  }

  build(project, moduleData) {
    const date = new Date().toLocaleDateString('de-DE');
    this.header(project, moduleData, date);
    this.projectData(project);
    const sections = reportSections(moduleData);
    const lineSections = sections.filter(section => section.isLineSection);
    const isHxDiagram = /hx|h,x/i.test(`${moduleData.id || ''} ${moduleData.title || ''}`);
    if (isHxDiagram) {
      this.chartBlock();
      sections.forEach(section => this.standardSection(section));
    } else if (lineSections.length) {
      const lineGroupTitle = 'LEITUNGSABSCHNITTE';
      this.sectionTitle(lineGroupTitle);
      lineSections.forEach(section => lineSectionItems(section.rows).forEach(item => this.lineBlock(item, lineGroupTitle)));
    } else {
      sections.forEach(section => this.standardSection(section));
    }
    if (!isHxDiagram) this.chartBlock();
    this.corporateBlock(project, moduleData);
    this.footer();
    return this.output();
  }

  output() {
    const objects = [];
    const addObject = value => { objects.push(value); return objects.length; };
    const fontRegularId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    const fontBoldId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const fontMonoId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>');
    const fontMonoBoldId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>');
    const imageObjectIds = new Map();
    this.imageResources.forEach(resource => {
      const image = parseJpegDataUrl(resource.image);
      if (!image) return;
      const hex = [...image.binary].map(char => char.charCodeAt(0).toString(16).padStart(2, '0')).join('') + '>';
      const id = addObject(`<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ${hex.length} >>\nstream\n${hex}\nendstream`);
      imageObjectIds.set(resource.name, id);
    });
    const xObjectEntries = [...imageObjectIds.entries()].map(([name, id]) => `/${name} ${id} 0 R`).join(' ');
    const xObjectResource = xObjectEntries ? `/XObject << ${xObjectEntries} >>` : '';
    const pageIds = [], contentIds = [];
    this.pages.forEach(page => {
      const stream = page.join('\n');
      contentIds.push(addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`));
    });
    const pagesIdPlaceholder = objects.length + this.pages.length + 1;
    this.pages.forEach((page, index) => pageIds.push(addObject(`<< /Type /Page /Parent ${pagesIdPlaceholder} 0 R /MediaBox [0 0 ${PDF_PAGE.width} ${PDF_PAGE.height}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R /F3 ${fontMonoId} 0 R /F4 ${fontMonoBoldId} 0 R >> ${xObjectResource} >> /Contents ${contentIds[index]} 0 R >>`)));
    const pagesId = addObject(`<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);
    const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
    const chunks = ['%PDF-1.4\n'];
    const offsets = [0];
    objects.forEach((object, index) => { offsets.push(chunks.join('').length); chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`); });
    const xrefOffset = chunks.join('').length;
    chunks.push(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
    for (let i = 1; i <= objects.length; i += 1) chunks.push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
    chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
    return new Blob(chunks, { type: 'application/pdf' });
  }
}
