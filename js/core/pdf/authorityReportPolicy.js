const clean = value => String(value ?? '').trim();
const isEmpty = value => !clean(value) || clean(value) === '-' || clean(value) === '—';
const labelOf = row => clean(row?.[0]);
const valueOf = row => clean(row?.[1]);

function compactRows(rows = []) {
  return rows.filter(row => !isEmpty(valueOf(row)));
}

function summarySection(section) {
  const allowed = new Set([
    'Planerisch anzusetzendes Speichervolumen',
    'Maßgebender Nachweis',
    'DIN 1986-100',
    'DWA-A 117'
  ]);
  return { ...section, rows: section.rows.filter(row => allowed.has(labelOf(row))) };
}

function interpretationSection(section) {
  const allowed = new Set(['Normative Aussage', 'DWA-A 117']);
  const rows = section.rows.filter(row => allowed.has(labelOf(row)) && !isEmpty(valueOf(row)));
  return rows.length ? { ...section, title: '2. Planerische Einordnung', rows } : null;
}

function projectReferenceSection(section) {
  const rows = compactRows(section.rows)
    .filter(row => labelOf(row) !== 'Projektbezeichnung')
    .filter(row => valueOf(row).toLowerCase() !== 'siehe dokumentkopf');
  return rows.length ? { ...section, rows } : null;
}

function hydraulicsSection(section, dto = {}) {
  if (dto.hydraulics?.dischargeMode !== 'authority-discharge-limit') return section;
  const allowed = new Set(['Betriebsart', 'Behördliche Einleitungsbegrenzung', 'Quelle Qab']);
  const rows = section.rows
    .filter(row => allowed.has(labelOf(row)))
    .map(row => labelOf(row) === 'Behördliche Einleitungsbegrenzung'
      ? ['Zulässiger Einleitungsabfluss', row?.[1] || '', row?.[2] || '']
      : row);
  return {
    ...section,
    title: '6. Behördliche Einleitungsrandbedingung',
    rows: compactRows(rows)
  };
}

/**
 * Final public-report policy. Internal diagnostics remain available in the app
 * and DTO, but are intentionally excluded from the authority PDF.
 */
export function applyAuthorityReportPolicy(section, dto = {}) {
  const title = clean(section?.title);
  if (!title) return null;
  if (/^11\.\s*Diagnosen/i.test(title)) return null;
  if (/^1\.\s*Ergebniszusammenfassung/i.test(title)) return summarySection(section);
  if (/^2\.\s*Planerische Interpretation/i.test(title)) return interpretationSection(section);
  if (/^3\.\s*Projekt- und Behördenreferenz/i.test(title)) return projectReferenceSection(section);
  if (/^6\.\s*Leitungs- und Abflussnachweis/i.test(title)) return hydraulicsSection(section, dto);
  if (/^12\.\s*Quellen, Versionen und Nachweisidentität/i.test(title)) {
    return { ...section, title: title.replace(/^12\./, '11.') };
  }
  return section;
}

export default applyAuthorityReportPolicy;
