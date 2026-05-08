import { modules } from './registry.js';
import { currentRoute } from './router.js';

function sanitizeText(value) {
  return String(value ?? '')
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/[·×]/g, 'x')
    .replace(/[ϑθφΦρΔηṁν]/g, match => ({
      'ϑ': 'Theta',
      'θ': 'Theta',
      'φ': 'phi',
      'Φ': 'phi',
      'ρ': 'rho',
      'Δ': 'Delta',
      'η': 'eta',
      'ṁ': 'm',
      'ν': 'v'
    }[match] || ''))
    .replace(/[°³²]/g, match => ({
      '°': 'deg',
      '³': '3',
      '²': '2'
    }[match] || ''))
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapePdfText(text) {
  return sanitizeText(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function collectVisibleModuleText() {
  const active = modules.get(currentRoute());
  const root = document.getElementById('app');
  const title = active?.title || 'TechCalc Pro';
  const body = root?.innerText || '';
  return {
    title,
    lines: body.split(/\n+/).map(sanitizeText).filter(Boolean)
  };
}

function collectStorageSummary() {
  const lines = [];
  const keys = [
    ['Leitungsabschnitte', 'techcalc:line-sections'],
    ['h,x-Prozesse', 'techcalc:hx-diagram:processes']
  ];
  keys.forEach(([label, key]) => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      if (Array.isArray(data) && data.length) {
        lines.push('', label);
        data.slice(0, 40).forEach((item, index) => lines.push(`${index + 1}. ${sanitizeText(item.label || item.name || item.bezeichnung || 'Eintrag')}`));
      }
    } catch { /* ignore */ }
  });
  return lines;
}

function buildPdf({ title, lines }) {
  const marginX = 46;
  const startY = 790;
  const lineHeight = 14;
  const maxChars = 92;
  const pages = [];
  let current = [];
  let y = startY;

  const pushPage = () => { pages.push(current); current = []; y = startY; };
  const addLine = (line, size = 10) => {
    if (y < 52) pushPage();
    current.push({ text: line, y, size });
    y -= lineHeight;
  };
  const wrap = line => {
    const words = sanitizeText(line).split(' ');
    const out = [];
    let buf = '';
    words.forEach(word => {
      if ((buf + ' ' + word).trim().length > maxChars) { if (buf) out.push(buf); buf = word; }
      else buf = (buf + ' ' + word).trim();
    });
    if (buf) out.push(buf);
    return out.length ? out : [''];
  };

  addLine('TechCalc Pro - PDF Export', 16);
  addLine(title, 13);
  addLine(new Date().toLocaleString('de-DE'), 9);
  addLine('');
  [...lines, ...collectStorageSummary()].forEach(line => wrap(line).forEach(part => addLine(part, part === line && /^[A-ZÄÖÜ][A-ZÄÖÜ\s,-]+$/.test(part) ? 11 : 10)));
  if (current.length) pushPage();

  const objects = [];
  const addObject = content => { objects.push(content); return objects.length; };
  const fontObj = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pageObjs = [];
  pages.forEach((page) => {
    const content = ['BT', `/F1 10 Tf`, '1 0 0 1 0 0 Tm'];
    page.forEach(item => {
      content.push(`/F1 ${item.size} Tf`);
      content.push(`${marginX} ${item.y} Td (${escapePdfText(item.text)}) Tj`);
      content.push(`${-marginX} ${-item.y} Td`);
    });
    content.push('ET');
    const stream = content.join('\n');
    const contentObj = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    const pageObjIndex = objects.length + 1;
    pageObjs.push(pageObjIndex);
    addObject(`<< /Type /Page /Parent 0 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObj} 0 R >> >> /Contents ${contentObj} 0 R >>`);
  });
  const pagesObj = addObject(`<< /Type /Pages /Kids [${pageObjs.map(n => `${n} 0 R`).join(' ')}] /Count ${pageObjs.length} >>`);
  pageObjs.forEach(objNum => { objects[objNum - 1] = objects[objNum - 1].replace('/Parent 0 0 R', `/Parent ${pagesObj} 0 R`); });
  const catalogObj = addObject(`<< /Type /Catalog /Pages ${pagesObj} 0 R >>`);

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((obj, i) => { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => { pdf += String(offset).padStart(10, '0') + ' 00000 n \n'; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogObj} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

export function exportCurrentModulePdf() {
  const data = collectVisibleModuleText();
  const blob = buildPdf(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const slug = sanitizeText(data.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'techcalc';
  a.href = url;
  a.download = `techcalc-pro-${slug}.pdf`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
