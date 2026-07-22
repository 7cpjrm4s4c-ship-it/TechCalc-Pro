const clean = value => String(value ?? '').trim();
const finiteOrNull = value => Number.isFinite(Number(value)) ? Number(value) : null;

export function buildAuthorityCoverPage({ project = {}, moduleData = {} } = {}) {
  const dto = moduleData.reportDto || {};
  const metadata = dto.metadata || {};
  const summary = dto.summary || {};
  const projectReference = dto.projectReference || {};

  return Object.freeze({
    kind: 'authority-cover',
    eyebrow: 'TECHNISCHER NACHWEIS',
    title: clean(moduleData.title || metadata.moduleTitle || 'Überflutungsnachweis'),
    project: clean(project.project || project.name || projectReference.projectName),
    projectNumber: clean(project.projectNo || project.projectNumber || projectReference.projectNumber),
    client: clean(project.client || projectReference.client),
    engineer: clean(project.engineer || projectReference.engineer),
    planningVolume: finiteOrNull(summary.planningVolumeM3),
    governingVerification: clean(summary.governingLabel),
    authority: clean(projectReference.authorityName),
    authorityReference: clean(projectReference.authorityReference),
    appVersion: clean(metadata.appVersion),
    generatedAt: clean(metadata.generatedAt)
  });
}

export default buildAuthorityCoverPage;
