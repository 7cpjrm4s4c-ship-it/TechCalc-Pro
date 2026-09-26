const clean = value => String(value ?? '').trim();

export function buildAuthorityCoverPage({ moduleData = {} } = {}) {
  const dto = moduleData.reportDto || {};
  const metadata = dto.metadata || {};
  return Object.freeze({
    kind: 'authority-cover',
    eyebrow: 'TECHNISCHER NACHWEIS',
    title: clean(moduleData.title || metadata.moduleTitle || 'Überflutungsnachweis')
  });
}

export default buildAuthorityCoverPage;
