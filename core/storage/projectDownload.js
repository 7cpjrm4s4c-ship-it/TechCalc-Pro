function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function buildTcprojProjectBlob(data = {}) {
  const project = clone(data);
  project.format = 'techcalc-project';
  project.container = 'tcproj-json';
  project.version = Math.max(3, Number(project.version || 1));
  project.assets = project.assets || {};
  const logoDataUrl = project.meta?.companyLogo || '';
  const logoName = project.meta?.companyLogoName || '';
  const logoMime = project.meta?.companyLogoMime || (logoDataUrl.match(/^data:([^;,]+)/)?.[1] || '');
  if (logoDataUrl) {
    project.assets.companyLogo = {
      name: logoName || 'company-logo',
      mime: logoMime || 'image/jpeg',
      dataUrl: logoDataUrl
    };
  }
  return new Blob([JSON.stringify(project, null, 2)], { type: 'application/vnd.techcalc.project+json' });
}

export async function downloadProjectFileFromData(collectProjectData) {
  const data = collectProjectData();
  const meta = data.meta || {};
  const baseName = [meta.projectNo, meta.project, meta.client].filter(Boolean).join('-') || 'techcalc-projekt';
  const safe = baseName.toLowerCase().replace(/[^a-z0-9äöüß_-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'techcalc-projekt';
  const fileName = `${safe}.tcproj`;
  const blob = buildTcprojProjectBlob(data);
  if (typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function') {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{
          description: 'TechCalc Projektdatei',
          accept: { 'application/vnd.techcalc.project+json': ['.tcproj'], 'application/json': ['.json'] }
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      document.dispatchEvent(new CustomEvent('techcalc-project-saved', { detail: { fileName: handle.name || fileName } }));
      return true;
    } catch (error) {
      if (error?.name === 'AbortError') return false;
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  document.dispatchEvent(new CustomEvent('techcalc-project-saved', { detail: { fileName } }));
  return true;
}
