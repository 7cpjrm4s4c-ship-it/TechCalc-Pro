import { getProjectMeta, setProjectMeta, downloadProjectFile, readProjectFile, applyProjectData, getOpenedFileName, saveSessionSnapshot } from './projectStorage.js';
import { collectCurrentModule, pdfFileName } from './pdf/pdfDataMapping.js';
import { GlobalPdfReport } from './pdf/pdfLayout.js';
import { normalizeImageToJpeg, svgToJpeg, canvasToJpeg, createFallbackIconJpeg } from './pdf/pdfChartRender.js';

const MAX_COMPANY_LOGO_FILE_SIZE = 500 * 1024;
const MAX_COMPANY_LOGO_DATA_URL_SIZE = 700000;
const PDF_COMPANY_LOGO_STORAGE_KEY = 'techcalc-pdf-company-logo';

const DEFAULT_PROJECT = {
  client: '', project: '', projectNo: '', engineer: '', companyLogo: '', companyLogoName: '',
  companyName: '', companyAddress: '', documentVersion: '', checkedBy: '', approvedBy: ''
};

function readProject() { return { ...DEFAULT_PROJECT, ...getProjectMeta() }; }

function collectProjectFormValues() {
  return {
    client: document.getElementById('pdfClient')?.value || '',
    project: document.getElementById('pdfProject')?.value || '',
    projectNo: document.getElementById('pdfProjectNo')?.value || '',
    engineer: document.getElementById('pdfEngineer')?.value || '',
    companyLogo: readStoredCompanyLogo(),
    companyLogoName: readStoredCompanyLogoName(),
    companyName: document.getElementById('pdfCompanyName')?.value || '',
    companyAddress: document.getElementById('pdfCompanyAddress')?.value || '',
    documentVersion: document.getElementById('pdfDocumentVersion')?.value || '',
    checkedBy: document.getElementById('pdfCheckedBy')?.value || '',
    approvedBy: document.getElementById('pdfApprovedBy')?.value || ''
  };
}

function saveProject(next = {}) {
  const saved = setProjectMeta({ ...collectProjectFormValues(), ...next });
  hydrateProjectForm(saved);
  return saved;
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

function setInputValue(id, value) { const el = document.getElementById(id); if (el) el.value = value ?? ''; }

function bindProjectInput(id, key) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', () => setProjectMeta({ [key]: el.value }));
  el.addEventListener('change', () => setProjectMeta({ [key]: el.value }));
}

function updateOpenedProjectLabel() {
  const label = document.getElementById('projectFileLabel');
  if (!label) return;
  const name = getOpenedFileName();
  label.textContent = name ? `Geöffnet: ${name}` : 'Kein externes Projekt geöffnet';
}

function readStoredCompanyLogo() {
  const metaLogo = getProjectMeta().companyLogo || '';
  if (metaLogo) return metaLogo;
  try { return localStorage.getItem(PDF_COMPANY_LOGO_STORAGE_KEY) || ''; } catch { return ''; }
}

function readStoredCompanyLogoName() {
  const metaName = getProjectMeta().companyLogoName || '';
  if (metaName) return metaName;
  try { return localStorage.getItem(`${PDF_COMPANY_LOGO_STORAGE_KEY}-name`) || ''; } catch { return ''; }
}

function persistCompanyLogo(dataUrl = '', fileName = '') {
  setProjectMeta({ companyLogo: dataUrl, companyLogoName: fileName });
  try {
    if (dataUrl) localStorage.setItem(PDF_COMPANY_LOGO_STORAGE_KEY, dataUrl);
    else localStorage.removeItem(PDF_COMPANY_LOGO_STORAGE_KEY);
    if (fileName) localStorage.setItem(`${PDF_COMPANY_LOGO_STORAGE_KEY}-name`, fileName);
    else if (!dataUrl) localStorage.removeItem(`${PDF_COMPANY_LOGO_STORAGE_KEY}-name`);
  } catch (error) { console.warn('Firmenlogo konnte nicht dauerhaft gespeichert werden.', error); }
}

function ensureCompanyLogoPreview() {
  let preview = document.getElementById('pdfCompanyLogoPreview');
  const input = document.getElementById('pdfCompanyLogo');
  if (!preview && input?.parentElement) {
    preview = document.createElement('div');
    preview.id = 'pdfCompanyLogoPreview';
    preview.className = 'settings-logo-preview is-empty';
    preview.setAttribute('aria-live', 'polite');
    input.parentElement.insertAdjacentElement('afterend', preview);
  }
  return preview;
}

function hydrateCompanyLogoStatus(dataUrl = '', fileName = '') {
  const status = document.getElementById('pdfCompanyLogoStatus');
  const preview = ensureCompanyLogoPreview();
  const displayName = fileName || 'gespeichertes Firmenlogo';
  if (status) status.textContent = dataUrl ? `Firmenlogo für PDF hinterlegt: ${displayName}` : 'Kein Firmenlogo hinterlegt';
  if (!preview) return;
  preview.classList.toggle('is-empty', !dataUrl);
  preview.replaceChildren();
  if (!dataUrl) {
    const empty = document.createElement('span');
    empty.textContent = 'Kein Firmenlogo hinterlegt';
    preview.appendChild(empty);
    return;
  }
  const img = document.createElement('img');
  img.src = dataUrl;
  img.alt = 'Hinterlegtes Firmenlogo';
  const text = document.createElement('span');
  text.textContent = displayName;
  preview.append(img, text);
}

async function isAllowedRasterLogoFile(file) {
  if (!file) return false;
  const name = String(file.name || '').toLowerCase();
  const extensionAllowed = /\.(png|jpe?g|webp)$/i.test(name);
  const mimeAllowed = /^image\/(png|jpeg|webp)$/i.test(String(file.type || ''));
  if (!extensionAllowed || !mimeAllowed) return false;
  try {
    const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
    const isPng = bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 && bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A;
    const isWebp = bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
    return isJpeg || isPng || isWebp;
  } catch { return false; }
}

function hydrateProjectForm(data = {}) {
  setInputValue('pdfClient', data.client);
  setInputValue('pdfProject', data.project);
  setInputValue('pdfProjectNo', data.projectNo);
  setInputValue('pdfEngineer', data.engineer);
  setInputValue('pdfCompanyName', data.companyName);
  setInputValue('pdfCompanyAddress', data.companyAddress);
  setInputValue('pdfDocumentVersion', data.documentVersion);
  setInputValue('pdfCheckedBy', data.checkedBy);
  setInputValue('pdfApprovedBy', data.approvedBy);
  setInputValue('pdfDate', data.date);
  const logo = data.companyLogo || readStoredCompanyLogo();
  const logoName = data.companyLogoName || readStoredCompanyLogoName();
  if (logo) persistCompanyLogo(logo, logoName);
  hydrateCompanyLogoStatus(logo, logoName);
}

function bindCompanyLogoInput() {
  const input = document.getElementById('pdfCompanyLogo');
  const clearButton = document.getElementById('clearPdfCompanyLogo');
  if (input && input.dataset.bound !== 'true') {
    input.dataset.bound = 'true';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (!(await isAllowedRasterLogoFile(file))) {
        alert('Bitte nur PNG, JPG/JPEG oder WebP als Firmenlogo auswählen. SVG/SVP wird aus Sicherheitsgründen nicht unterstützt.');
        input.value = '';
        return;
      }
      if (file.size > MAX_COMPANY_LOGO_FILE_SIZE) {
        alert('Das Firmenlogo ist zu groß. Bitte eine Datei bis maximal 500 KB verwenden.');
        input.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = String(reader.result || '');
        if (dataUrl.length > MAX_COMPANY_LOGO_DATA_URL_SIZE) {
          alert('Das Firmenlogo ist zu groß. Bitte eine kleinere PNG-, JPG- oder WebP-Datei verwenden.');
          input.value = '';
          return;
        }
        const fileName = file.name || 'Firmenlogo';
        persistCompanyLogo(dataUrl, fileName);
        hydrateCompanyLogoStatus(dataUrl, fileName);
        const normalizedLogo = await normalizeImageToJpeg(dataUrl, { maxWidth: 1200, maxHeight: 520, quality: 0.92 });
        const storedLogo = normalizedLogo?.dataUrl || dataUrl;
        persistCompanyLogo(storedLogo, fileName);
        setProjectMeta({ ...collectProjectFormValues(), companyLogo: storedLogo, companyLogoName: fileName });
        hydrateCompanyLogoStatus(storedLogo, fileName);
      };
      reader.onerror = () => alert('Firmenlogo konnte nicht gelesen werden.');
      reader.readAsDataURL(file);
    });
  }
  if (clearButton && clearButton.dataset.bound !== 'true') {
    clearButton.dataset.bound = 'true';
    clearButton.addEventListener('click', event => {
      event.preventDefault();
      persistCompanyLogo('', '');
      hydrateCompanyLogoStatus('', '');
      if (input) input.value = '';
    });
  }
  hydrateCompanyLogoStatus(readStoredCompanyLogo(), readStoredCompanyLogoName());
}

function initProjectSettings() {
  if (window.__techCalcProjectSettingsBound) { hydrateProjectForm(readProject()); updateOpenedProjectLabel(); return; }
  window.__techCalcProjectSettingsBound = true;
  hydrateProjectForm(readProject());
  bindProjectInput('pdfClient', 'client');
  bindProjectInput('pdfProject', 'project');
  bindProjectInput('pdfProjectNo', 'projectNo');
  bindProjectInput('pdfEngineer', 'engineer');
  bindProjectInput('pdfCompanyName', 'companyName');
  bindProjectInput('pdfCompanyAddress', 'companyAddress');
  bindProjectInput('pdfDocumentVersion', 'documentVersion');
  bindProjectInput('pdfCheckedBy', 'checkedBy');
  bindProjectInput('pdfApprovedBy', 'approvedBy');
  bindCompanyLogoInput();
  document.getElementById('saveProjectButton')?.addEventListener('click', async event => {
    event.preventDefault();
    setProjectMeta(collectProjectFormValues());
    const saved = await downloadProjectFile();
    if (saved) flashProjectSaved();
  });
  document.getElementById('openProjectButton')?.addEventListener('click', event => {
    event.preventDefault();
    document.getElementById('openProjectFile')?.click();
  });
  document.getElementById('openProjectFile')?.addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const data = await readProjectFile(file);
      applyProjectData(data, { fileName: file.name });
      hydrateProjectForm(readProject());
      updateOpenedProjectLabel();
    } catch (error) {
      console.error('Projekt konnte nicht geöffnet werden.', error);
      alert(error.message || 'Projekt konnte nicht geöffnet werden.');
    } finally { event.target.value = ''; }
  });
  document.addEventListener('techcalc-project-loaded', () => { hydrateProjectForm(readProject()); updateOpenedProjectLabel(); });
  updateOpenedProjectLabel();
}

async function downloadNativePdf(project, moduleData) {
  const appIconUrl = new URL('./assets/icons/icon-192.png', window.location.href).href;
  const appIcon = await normalizeImageToJpeg(appIconUrl, { maxWidth: 256, maxHeight: 256, quality: 0.92 }) || createFallbackIconJpeg();
  const companyLogo = await normalizeImageToJpeg(project.companyLogo, { maxWidth: 900, maxHeight: 360, quality: 0.9 });
  const chartImage = await canvasToJpeg(moduleData.chartCanvas, { maxWidth: 1300, maxHeight: 820, quality: 0.9 })
    || await svgToJpeg(moduleData.chartSvg, { maxWidth: 1300, maxHeight: 820, quality: 0.9 });
  const report = new GlobalPdfReport({ appIcon, companyLogo, chartImage });
  const blob = report.build(project, moduleData);
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
      const project = saveProject({ ...collectProjectFormValues(), companyLogo: readStoredCompanyLogo(), companyLogoName: readStoredCompanyLogoName() });
      saveSessionSnapshot();
      const moduleData = collectCurrentModule(modules, routeGetter);
      await downloadNativePdf(project, moduleData);
    } catch (error) {
      console.error('PDF-Export fehlgeschlagen.', error);
      alert('PDF-Export konnte nicht erstellt werden. Bitte Browser-Konsole prüfen.');
    }
  });
}
