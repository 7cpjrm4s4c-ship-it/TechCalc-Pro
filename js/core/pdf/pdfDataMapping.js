import { currentRoute } from '../router.js';
import { buildFloodingReportSections } from './floodingReportSections.js';
import { buildRainwaterReportSections } from './rainwaterReportSections.js';
import { buildFGasesReportSections } from './fGasesReportSections.js';
import { buildEN378ReportSections } from './en378ReportSections.js';
import { buildGenericReportSections } from './genericReportSections.js';

const value = id => document.getElementById(id)?.value || '';
const text = id => document.getElementById(id)?.textContent?.trim() || '';
const num = id => {
  const v = Number(value(id));
  return Number.isFinite(v) ? v : '';
};
const legacyRows = [
  ['Volumenstrom', () => text('flowResult'), 'm³/h'],
  ['Leistung', () => text('powerResult'), 'kW'],
  ['Temperaturdifferenz', () => text('deltaTResult'), 'K'],
  ['Geschwindigkeit', () => text('velocityResult'), 'm/s'],
  ['Druckverlust', () => text('pressureResult'), 'Pa'],
  ['Speichervolumen', () => text('bufferResult'), 'l'],
  ['Wassermenge', () => text('waterResult'), 'l/s'],
  ['Regenwasser', () => text('rainResult'), 'l/s'],
  ['Abwasser', () => text('wasteResult'), 'l/s'],
  ['Einheiten', () => text('unitResult'), '']
];

function runtimeModuleFor(registration) {
  if (!registration) return null;
  const module = registration.module || registration.loadedModule || registration;
  if (!module || typeof module !== 'object') return null;
  return module;
}

function resolveModuleRegistration(modules, moduleId) {
  if (!modules || !moduleId) return null;
  if (typeof modules.get === 'function') return modules.get(moduleId);
  if (typeof modules.find === 'function') return modules.find(module => module?.id === moduleId || module?.config?.id === moduleId) || null;
  return null;
}

function resolveReportProvider(registration) {
  const candidates = [
    registration,
    registration?.module,
    registration?.loadedModule,
    runtimeModuleFor(registration)
  ];
  return candidates.find(candidate => typeof candidate?.report === 'function') || null;
}

function legacyModuleData(modules, getRoute) {
  const routeId = typeof getRoute === 'function' ? getRoute() : currentRoute();
  const registration = resolveModuleRegistration(modules, routeId);
  const module = runtimeModuleFor(registration);
  const config = registration?.config || module?.config || {};
  return {
    id: config.id || routeId || 'module',
    title: config.title || module?.title || document.querySelector('.module h1')?.textContent?.trim() || 'Modul',
    shortTitle: config.shortTitle || config.title || module?.shortTitle || module?.title || routeId || 'Modul',
    reportSource: 'legacy-dom'
  };
}

export function collectCurrentModule(modules, getRoute = currentRoute) {
  const routeId = typeof getRoute === 'function' ? getRoute() : currentRoute();
  const registration = resolveModuleRegistration(modules, routeId);
  const module = runtimeModuleFor(registration);
  const config = registration?.config || module?.config || {};
  const reportProvider = resolveReportProvider(registration);
  if (reportProvider) {
    try {
      const snapshot = typeof reportProvider.state?.get === 'function' ? reportProvider.state.get() : undefined;
      const reportDto = reportProvider.report(snapshot);
      if (reportDto && typeof reportDto === 'object') {
        return {
          id: config.id || reportDto.metadata?.moduleId || routeId || 'module',
          title: config.title || reportDto.metadata?.moduleTitle || module?.title || routeId || 'Modul',
          shortTitle: config.shortTitle || config.title || module?.shortTitle || module?.title || routeId || 'Modul',
          reportSource: 'typed-dto',
          reportDto
        };
      }
    } catch (error) {
      console.warn('PDF report adapter failed, falling back to legacy DOM export.', error);
    }
  }
  return legacyModuleData(modules, getRoute);
}

export function collectProject() {
  return {
    client: value('pdfClient') || 'Nicht angegeben',
    project: value('pdfProject') || 'Aktuelles Projekt',
    projectNo: value('pdfProjectNo') || '',
    engineer: value('pdfEngineer') || '',
    companyName: value('pdfCompanyName') || '',
    companyAddress: value('pdfCompanyAddress') || '',
    documentVersion: value('pdfDocumentVersion') || '',
    checkedBy: value('pdfCheckedBy') || '',
    approvedBy: value('pdfApprovedBy') || '',
    logo: document.getElementById('pdfCompanyLogoPreview')?.dataset?.logo || ''
  };
}

export function pdfFileName(project, moduleData) {
  const base = [
    project.project || 'TechCalc',
    moduleData.shortTitle || moduleData.title || 'Modul',
    new Date().toISOString().slice(0, 10)
  ]
    .filter(Boolean)
    .join('_')
    .replace(/[^a-z0-9äöüß_-]+/gi, '_');
  return `${base}.pdf`;
}

function legacyResultRows() {
  return legacyRows
    .map(([label, get, unit]) => [label, get(), unit])
    .filter(row => row[1] !== '' && row[1] != null);
}

function inputRows(moduleId) {
  if (moduleId === 'heating-cooling') {
    return [
      ['Volumenstrom', num('flow'), 'm³/h'],
      ['Temperaturspreizung', num('deltaT'), 'K']
    ];
  }
  if (moduleId === 'ventilation') {
    return [
      ['Raumfläche', num('roomArea'), 'm²'],
      ['Luftwechsel', num('airChange'), '1/h'],
      ['Raumhöhe', num('roomHeight'), 'm']
    ];
  }
  if (moduleId === 'pipe-sizing') {
    return [
      ['Volumenstrom', num('pipeFlow'), 'm³/h'],
      ['Rohr DN', value('pipeDn'), ''],
      ['Rohrlänge', num('pipeLength'), 'm']
    ];
  }
  if (moduleId === 'pressure-holding') {
    return [
      ['Anlagenvolumen', num('systemVolume'), 'l'],
      ['Temperatur min.', num('minTemp'), '°C'],
      ['Temperatur max.', num('maxTemp'), '°C'],
      ['Vordruck', num('prePressure'), 'bar']
    ];
  }
  if (moduleId === 'buffer-storage') {
    return [
      ['Leistung', num('bufferPower'), 'kW'],
      ['Laufzeit', num('bufferRuntime'), 'min'],
      ['Spreizung', num('bufferDeltaT'), 'K']
    ];
  }
  return Array.from(document.querySelectorAll('[data-pdf-field]')).map(el => [
    el.getAttribute('data-pdf-label') || el.id || 'Eingabe',
    el.value || el.textContent?.trim() || '',
    el.getAttribute('data-pdf-unit') || ''
  ]);
}

function normalizePdfRows(rows = [], sectionTitle = '') {
  if (!Array.isArray(rows)) return [];
  return rows
    .map(row => {
      if (Array.isArray(row)) return row;
      if (row && typeof row === 'object') {
        return [row.label || row.name || row.title || sectionTitle || 'Eintrag', row.value ?? row.text ?? '', row.unit || ''];
      }
      return ['Eintrag', row ?? '', ''];
    })
    .filter(row => row.some(cell => cell !== '' && cell != null));
}

const typedReportSectionBuilders = Object.freeze({
  'techcalc.flooding-verification.report': buildFloodingReportSections,
  'techcalc.rainwater.report': buildRainwaterReportSections,
  'techcalc.f-gases-check.report': buildFGasesReportSections,
  'techcalc.en-378-safety-check.report': buildEN378ReportSections
});

function buildTypedDtoReportSections(reportDto = {}) {
  const dtoType = reportDto.metadata?.dtoType;
  const buildSections = typedReportSectionBuilders[dtoType] || buildGenericReportSections;
  return buildSections(reportDto);
}

export function reportSections(moduleData) {
  if (moduleData?.reportSource === 'typed-dto' && moduleData.reportDto) {
    const sections = buildTypedDtoReportSections(moduleData.reportDto);
    return sections.map(section => ({ ...section, rows: normalizePdfRows(section.rows, section.title) }));
  }
  const inputs = inputRows(moduleData.id).filter(row => row[1] !== '' && row[1] != null);
  const results = legacyResultRows();
  return [
    { title: 'Eingaben', rows: inputs.length ? inputs : [['Keine Eingaben erfasst', '', '']] },
    { title: 'Ergebnisse', rows: results.length ? results : [['Keine Ergebnisse berechnet', '', '']] }
  ];
}
