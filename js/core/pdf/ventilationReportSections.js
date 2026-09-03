const array = value => Array.isArray(value) ? value : [];

export function buildVentilationReportSections(reportDto = {}) {
  const lineSectionGroups = array(reportDto.resultGroups)
    .filter(group => group?.isLineSection)
    .map(group => ({
      title: 'Leitungsabschnitte',
      rows: array(group.rows),
      isLineSection: true
    }))
    .filter(section => section.rows.length);

  if (lineSectionGroups.length) return lineSectionGroups;

  return array(reportDto.resultGroups)
    .map(group => ({
      title: group?.title || 'Ergebnis',
      rows: array(group?.rows),
      isLineSection: Boolean(group?.isLineSection),
      singleColumn: Boolean(group?.singleColumn),
      fullWidthRows: Boolean(group?.fullWidthRows)
    }))
    .filter(section => section.rows.length);
}

export default buildVentilationReportSections;
