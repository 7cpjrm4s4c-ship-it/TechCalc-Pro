import { logger } from './logger.js';
import { getProjectMeta, setProjectMeta, downloadProjectFile, readProjectFile, applyProjectData, getOpenedFileName, saveSessionSnapshot } from './projectStorage.js';
import { collectCurrentModule, pdfFileName } from './pdf/pdfDataMapping.js';
import { GlobalPdfReport } from './pdf/pdfLayout.js';
import { normalizeImageToJpeg, svgToJpeg, canvasToJpeg, createFallbackIconJpeg } from './pdf/pdfChartRender.js';

const DEFAULT_PROJECT = {
  client: '',
  project: '',
  projectNo: '',
  engineer: '',
  showTechCalcBranding: true,
  companyLogo: '',
  companyLogoName: '',
  companyName: '',
  companyAddress: '',
  documentVersion: '',
  checkedBy: '',
  approvedBy: '',
  companyLogoMime: '',
  companyLogoAsset: ''
};

const PROJECT_INPUT_BINDINGS = [
  ['pdfClient', 'client'],
  ['pdfProject', 'project'],
  ['pdfProjectNo', 'projectNo'],
  ['pdfEngineer', 'engineer']
];

const CORPORATE_META_DEFAULTS = {
  companyLogo: '',
  companyLogoName: '',
  companyName: '',
  companyAddress: '',
  documentVersion: '',
  checkedBy: '',
  approvedBy: '',
  companyLogoMime: '',
  companyLogoAsset: ''
};

function sanitizeProjectForReport(project = {}) {
  return {
    ...DEFAULT_PROJECT,
    ...project,
    ...CORPORATE_META_DEFAULTS,
    showTechCalcBranding: true
  };
}

function readProject() {
  return sanitizeProjectForReport(getProjectMeta());
}

function collectProjectFormValues() {
  const values = {};
  PROJECT_INPUT_BINDINGS.forEach(([id, key]) => {
    const element = document.getElementById(id);
    if (element) values[key] = element.value || '';
  });
  return values;
}

function saveProject(next = {}) {
  const saved = setProjectMeta({ ...collectProjectFormValues(), ...CORPORATE_META_DEFAULTS, showTechCalcBranding: true, ...next });
  const sanitized = sanitizeProjectForReport(saved);
  hydrateProjectForm(sanitized);
  return sanitized;
}

function flashProjectSaved(text = 'Projektdatei erstellt') {
  const button = document.getElementById('saveProjectButton');
  if (!button) return;
  const original = button.textContent;
  button.textContent = text;
  button.classList.add('is-saved');
  window.setTimeout(() => {
    button.textContent = original || 'Projekt speichern';
    button.classList.remove('is-saved');
  }, 1400);
}

function setInputValue(id, value) {
  const element = document.getElementById(id);
  if (element) element.value = value ?? '';
}

function bindProjectInput(id, key) {
  const element = document.getElementById(id);
  if (!element) return;
  element.addEventListener('input', () => setProjectMeta({ [key]: element.value }));
  element.addEventListener('change', () => setProjectMeta({ [key]: element.value }));
}

function updateOpenedProjectLabel() {
  const label = document.getElementById('projectFileLabel');
  if (!label) return;
  const name = getOpenedFileName();
  label.textContent = name ? `Geöffnet: ${name}` : 'Kein externes Projekt geöffnet';
}

async function applySelectedProjectFile(file) {
  if (!file) return false;
  const data = await readProjectFile(file);
  applyProjectData(data, { fileName: file.name || 'TechCalc Projektdatei' });
  hydrateProjectForm(readProject());
  updateOpenedProjectLabel();
  return true;
}

async function openProjectWithNativePicker() {
  if (typeof window === 'undefined' || typeof window.showOpenFilePicker !== 'function') return false;
  try {
    const [handle] = await window.showOpenFilePicker({
      multiple: false,
      excludeAcceptAllOption: false,
      types: [{
        description: 'TechCalc Projektdateien',
        accept: {
          'application/json': ['.tcproj', '.json'],
          'application/vnd.techcalc.project+json': ['.tcproj'],
          'application/vnd.techcalc.project': ['.tcp']
        }
      }]
    });
    const file = await handle.getFile();
    await applySelectedProjectFile(file);
    return true;
  } catch (error) {
    if (error?.name === 'AbortError') return true;
    logger.warn('Native Projekt-Dateiauswahl nicht verfügbar, verwende Input-Fallback.', error, { module: 'project-file' });
    return false;
  }
}

function hydrateProjectForm(data = {}) {
  PROJECT_INPUT_BINDINGS.forEach(([id, key]) => setInputValue(id, data[key]));
}

function initProjectSettings() {
  if (window.__techCalcProjectSettingsBound) {
    hydrateProjectForm(readProject());
    updateOpenedProjectLabel();
    return;
  }
  window.__techCalcProjectSettingsBound = true;
  hydrateProjectForm(readProject());
  PROJECT_INPUT_BINDINGS.forEach(([id, key]) => bindProjectInput(id, key));
  document.getElementById('saveProjectButton')?.addEventListener('click', async event => {
    event.preventDefault();
    setProjectMeta({ ...collectProjectFormValues(), ...CORPORATE_META_DEFAULTS, showTechCalcBranding: true });
    const saved = await downloadProjectFile();
    if (saved) flashProjectSaved();
  });
  document.getElementById('openProjectButton')?.addEventListener('click', async event => {
    event.preventDefault();
    try {
      const openedNative = await openProjectWithNativePicker();
      if (!openedNative) document.getElementById('openProjectFile')?.click();
    } catch (error) {
      logger.error('Projekt konnte nicht geöffnet werden.', error, { module: 'project-file' });
      alert(error.message || 'Projekt konnte nicht geöffnet werden.');
    }
  });
  document.getElementById('openProjectFile')?.addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await applySelectedProjectFile(file);
    } catch (error) {
      logger.error('Projekt konnte nicht geöffnet werden.', error, { module: 'project-file' });
      alert(error.message || 'Projekt konnte nicht geöffnet werden.');
    } finally {
      event.target.value = '';
    }
  });
  document.addEventListener('techcalc-project-loaded', () => {
    hydrateProjectForm(readProject());
    updateOpenedProjectLabel();
  });
  updateOpenedProjectLabel();
}

async function downloadNativePdf(project, moduleData) {
  const projectForReport = sanitizeProjectForReport(project);
  const appIconUrl = new URL('./assets/icons/icon-192.png', window.location.href).href;
  const appIcon = await normalizeImageToJpeg(appIconUrl, { maxWidth: 256, maxHeight: 256, quality: 0.92 }) || createFallbackIconJpeg();
  const chartImage = await canvasToJpeg(moduleData.chartCanvas, { maxWidth: 1300, maxHeight: 820, quality: 0.9 })
    || await svgToJpeg(moduleData.chartSvg, { maxWidth: 1300, maxHeight: 820, quality: 0.9 });
  const report = new GlobalPdfReport({ appIcon, chartImage });
  const blob = report.build(projectForReport, moduleData);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = pdfFileName(moduleData);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

export function initPdfExport({ modules, currentRoute: routeGetter } = {}) {
  initProjectSettings();
  const exportButton = document.getElementById('exportPdfButton');
  if (!exportButton || exportButton.dataset.bound === 'true') return;
  exportButton.dataset.bound = 'true';
  exportButton.addEventListener('click', async event => {
    event.preventDefault();
    try {
      const project = saveProject();
      saveSessionSnapshot();
      const moduleData = collectCurrentModule(modules, routeGetter);
      await downloadNativePdf(project, moduleData);
    } catch (error) {
      logger.error('PDF-Export fehlgeschlagen.', error, { module: 'pdf-export' });
      alert('PDF-Export konnte nicht erstellt werden. Bitte Browser-Konsole prüfen.');
    }
  });
}
