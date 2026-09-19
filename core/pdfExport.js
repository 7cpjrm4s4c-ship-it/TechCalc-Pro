import { logger } from './diagnostics/logger.js';
import { getProjectMeta, setProjectMeta, downloadProjectFile, readProjectFile, applyProjectData, getOpenedFileName, saveSessionSnapshot } from './projectStorage.js';
import { collectCurrentModule, pdfFileName } from './pdf/pdfDataMapping.js';
import { GlobalPdfReport } from './pdf/pdfLayout.js';
import { normalizeImageToJpeg, svgToJpeg, canvasToJpeg, createFallbackIconJpeg } from './pdf/pdfChartRender.js';

const MAX_COMPANY_LOGO_FILE_SIZE = 500 * 1024;
const MAX_COMPANY_LOGO_DATA_URL_SIZE = 700000;
const PDF_COMPANY_LOGO_STORAGE_KEY = 'techcalc-pdf-company-logo';

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
function brandingEnabled(value) {
  return value !== false && value !== 'false';
}

function readProject() {
  const meta = getProjectMeta();
  return {
    ...DEFAULT_PROJECT,
    ...meta,
    showTechCalcBranding: brandingEnabled(meta.showTechCalcBranding)
  };
}

function readBrandingControlValue() {
  const control = document.getElementById('pdfShowTechCalcBranding');
  if (!control) return brandingEnabled(getProjectMeta().showTechCalcBranding);
  return Boolean(control.checked);
}
function collectProjectFormValues() {
  return {
    client: document.getElementById('pdfClient')?.value || '',
    project: document.getElementById('pdfProject')?.value || '',
    projectNo: document.getElementById('pdfProjectNo')?.value || '',
    engineer: document.getElementById('pdfEngineer')?.value || '',
    showTechCalcBranding: readBrandingControlValue(),
    companyLogo: readStoredCompanyLogo(),
    companyLogoName: readStoredCompanyLogoName(),
    companyName: '',
    companyAddress: '',
    documentVersion: '',
    checkedBy: '',
    approvedBy: ''
  };
}
function saveProject(next = {}) {
  const saved = setProjectMeta({ ...collectProjectFormValues(), ...next });
  const normalized = {
    ...DEFAULT_PROJECT,
    ...saved,
    showTechCalcBranding: brandingEnabled(saved.showTechCalcBranding)
  };
  hydrateProjectForm(normalized);
  return normalized;
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
  const el = document.getElementById(id);
  if (el) el.value = value ?? '';
}
function setCheckboxValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.checked = brandingEnabled(value);
}
