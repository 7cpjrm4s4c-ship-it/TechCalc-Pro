import { isDwaVerificationRequired } from './authorityReportScope.js';

const clean = value => String(value ?? '').trim();
const isEmpty = value => !clean(value) || clean(value) === '-' || clean(value) === '—';
const labelOf = row => clean(row?.[0]);
const valueOf = row => clean(row?.[1]);

const PUBLIC_CHAPTERS = Object.freeze([
  [/Ergebniszusammenfassung/i, '1. Ergebniszusammenfassung'],
  [/Planerische (?:Interpretation|Einordnung)/i, '2. Planerische Einordnung'],
  [/Flächenübersicht/i, '3. Flächenübersicht'],
  [/Regendaten und Berechnungsgrundlagen/i, '4. Regendaten und Berechnungsgrundlagen'],
  [/(?:Leitungs- und Abflussnachweis|Behördliche Einleitungsrandbedingung)/i, '5. Behördliche Einleitungsrandbedingung'],
  [/DIN 1986-100\s*-\s*Gleichung \(20\)/i, '6. DIN 1986-100 - Gleichung (20)'],
  [/DIN 1986-100\s*-\s*Gleichung \(21\), Dauerstufenvergleich/i, '7. DIN 1986-100 - Gleichung (21), Dauerstufenvergleich'],
  [/DWA-A 117\s*-\s*Anwendungs- und Parameterprüfung/i, '8. DWA-A 117 - Anwendungs- und Parameterprüfung'],
  [/DWA-A 117\s*-\s*Dauerstufenvergleich/i, '9. DWA-A 117 - Dauerstufenvergleich'],
  [/(?:Quellen, Versionen und Nachweisidentität|Verwendete Regelwerke und Datengrundlagen)/i, '10. Verwendete Regelwerke und Datengrundlagen']
]);

function compactRows(rows = []) {
  return rows.filter(row => !isEmpty(valueOf(row)));
}

export function authorityPublicChapterTitle(title = '') {
  const source = clean(title);
  const continuation = /\s*\(Fortsetzung\)\s*$/i.test(source);
  const base = source.replace(/^\d+\.\s*/, '').replace(/\s*\(Fortsetzung\)\s*$/i, '');
  const match = PUBLIC_CHAPTERS.find(([pattern]) => pattern.test(base));
  if (!match) return source;
  return `${match[1]}${continuation ? ' (Fortsetzung)' : ''}`;
}

function withPublicTitle(section) {
  return section ? { ...section, title: authorityPublicChapterTitle(section.title) } : null;
}

function summarySection(section, dto = {}) {
  const allowed = new Set([
    'Planerisch anzusetzendes Speichervolumen',
    'Maßgebender Nachweis',
    'DIN 1986-100'
  ]);
  if (isDwaVerificationRequired(dto)) allowed.add('DWA-A 117');
  return withPublicTitle({ ...section, rows: section.rows.filter(row => allowed.has(labelOf(row))) });
}

function interpretationSection(section, dto = {}) {
  if (!isDwaVerificationRequired(dto)) return null;
  const allowed = new Set(['Normative Aussage', 'DWA-A 117']);
  const rows = section.rows.filter(row => allowed.has(labelOf(row)) && !isEmpty(valueOf(row)));
  return rows.length ? { ...section, title: '2. Planerische Einordnung', rows } : null;
}

function projectReferenceSection(section) {
  const rows = compactRows(section.rows)
    .filter(row => labelOf(row) !== 'Projektbezeichnung')
    .filter(row => valueOf(row).toLowerCase() !== 'siehe dokumentkopf');
  return rows.length ? withPublicTitle({ ...section, rows }) : null;
}

function hydraulicsSection(section, dto = {}) {
  if (!isDwaVerificationRequired(dto)) return null;
  const allowed = new Set(['Betriebsart', 'Behördliche Einleitungsbegrenzung', 'Quelle Qab']);
  const rows = section.rows
    .filter(row => allowed.has(labelOf(row)))
    .map(row => labelOf(row) === 'Behördliche Einleitungsbegrenzung'
      ? ['Zulässiger Einleitungsabfluss', row?.[1] || '', row?.[2] || '']
      : row);
  return {
    ...section,
    title: '5. Behördliche Einleitungsrandbedingung',
    rows: compactRows(rows)
  };
}

function sourcesSection(section, dto = {}) {
  const dwaRequired = isDwaVerificationRequired(dto);
  const rows = compactRows(section.rows)
    .filter(row => /\b(?:DIN|DWA|KOSTRA(?:-DWD)?)\b/i.test(labelOf(row)))
    .filter(row => dwaRequired || !/\bDWA(?:-A)?\s*117\b/i.test(labelOf(row)));
  return rows.length
    ? { ...section, title: '10. Verwendete Regelwerke und Datengrundlagen', rows }
    : null;
}

/**
 * Final public-report policy. Internal diagnostics and implementation metadata
 * remain available in the app and DTO, but are intentionally excluded from the
 * authority PDF.
 */
export function applyAuthorityReportPolicy(section, dto = {}) {
  const title = clean(section?.title);
  if (!title) return null;
  if (/^11\.\s*Diagnosen/i.test(title)) return null;
  if (!isDwaVerificationRequired(dto) && /DWA-A\s*117/i.test(title)) return null;
  if (/^1\.\s*Ergebniszusammenfassung/i.test(title)) return summarySection(section, dto);
  if (/^2\.\s*Planerische Interpretation/i.test(title)) return interpretationSection(section, dto);
  if (/^3\.\s*Projekt- und Behördenreferenz/i.test(title)) return projectReferenceSection(section);
  if (/^6\.\s*Leitungs- und Abflussnachweis/i.test(title)) return hydraulicsSection(section, dto);
  if (/^12\.\s*Quellen, Versionen und Nachweisidentität/i.test(title)) return sourcesSection(section, dto);
  return withPublicTitle(section);
}

export default applyAuthorityReportPolicy;
