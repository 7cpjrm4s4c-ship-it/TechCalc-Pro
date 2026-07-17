const clean = value => String(value ?? '').trim();

function localDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return clean(value) || '—';
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'long' }).format(date);
}

export function buildAuthorityCoverPage({ project = {}, moduleData = {}, generatedAt } = {}) {
  const dto = moduleData.reportDto || {};
  const summary = dto.summary || {};
  const reference = dto.projectReference || {};
  const metadata = dto.metadata || {};
  return Object.freeze({
    kind: 'authority-cover',
    eyebrow: 'TECHNISCHER NACHWEIS',
    title: clean(moduleData.title || metadata.moduleTitle || 'Überflutungsnachweis'),
    subtitle: 'Berechnungs- und Nachweisprotokoll',
    project: clean(project.project || reference.projectName) || 'Projekt nicht bezeichnet',
    projectNo: clean(project.projectNo) || '—',
    client: clean(project.client) || '—',
    engineer: clean(project.engineer) || '—',
    authority: clean(reference.authorityName) || '—',
    authorityReference: clean(reference.authorityReference) || '—',
    governingVerification: clean(summary.governingLabel) || 'Nachweis noch nicht vollständig',
    planningVolume: Number.isFinite(Number(summary.planningVolumeM3)) ? Number(summary.planningVolumeM3) : null,
    documentVersion: clean(project.documentVersion || metadata.appVersion) || '—',
    companyName: clean(project.companyName) || '—',
    checkedBy: clean(project.checkedBy) || '—',
    approvedBy: clean(project.approvedBy) || '—',
    date: localDate(generatedAt || metadata.generatedAt || new Date())
  });
}

export default buildAuthorityCoverPage;