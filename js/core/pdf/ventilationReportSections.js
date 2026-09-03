const array = value => Array.isArray(value) ? value : [];

function rowToCells(row) {
  if (Array.isArray(row)) return row.slice(0, 3);
  if (row && typeof row === 'object') {
    return [
      row.label ?? row.name ?? row.title ?? 'Eintrag',
      row.value ?? row.text ?? '',
      row.unit ?? ''
    ];
  }
  return ['Eintrag', row ?? '', ''];
}

function normalizeRows(rows = []) {
  return array(rows).map(rowToCells);
}

export function buildVentilationReportSections(reportDto = {}) {
  const lineSectionGroups = array(reportDto.resultGroups)
    .filter(group => group?.isLineSection)
    .map(group => ({
      title: 'Leitungsabschnitte',
      rows: normalizeRows(group.rows),
      isLineSection: true
    }))
    .filter(section => section.rows.length);

  if (lineSectionGroups.length) return lineSectionGroups;

  return array(reportDto.resultGroups)
    .map(group => ({
      title: group?.title || 'Ergebnis',
      rows: normalizeRows(group?.rows),
      isLineSection: Boolean(group?.isLineSection),
      singleColumn: Boolean(group?.singleColumn),
      fullWidthRows: Boolean(group?.fullWidthRows)
    }))
    .filter(section => section.rows.length);
}

export default buildVentilationReportSections;
