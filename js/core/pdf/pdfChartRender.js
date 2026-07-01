export function imageElementFromSource(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden.'));
    if (/^https?:/i.test(String(source || ''))) img.crossOrigin = 'anonymous';
    img.src = source;
  });
}

export async function normalizeImageToJpeg(source, { maxWidth = 512, maxHeight = 256, quality = 0.88 } = {}) {
  if (!source) return null;
  try {
    const img = await imageElementFromSource(source);
    const scale = Math.min(1, maxWidth / Math.max(1, img.naturalWidth || img.width), maxHeight / Math.max(1, img.naturalHeight || img.height));
    const width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
    const height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return { dataUrl: canvas.toDataURL('image/jpeg', quality), width, height };
  } catch (error) {
    console.warn('PDF-Bild konnte nicht vorbereitet werden.', error);
    return null;
  }
}

export async function canvasToJpeg(canvas, { maxWidth = 1200, maxHeight = 700, quality = 0.9 } = {}) {
  if (!canvas) return null;
  try {
    const scale = Math.min(1, maxWidth / Math.max(1, canvas.width), maxHeight / Math.max(1, canvas.height));
    const width = Math.max(1, Math.round(canvas.width * scale));
    const height = Math.max(1, Math.round(canvas.height * scale));
    const out = document.createElement('canvas');
    out.width = width;
    out.height = height;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(canvas, 0, 0, width, height);
    return { dataUrl: out.toDataURL('image/jpeg', quality), width, height };
  } catch (error) {
    console.warn('PDF-Canvas konnte nicht gerendert werden.', error);
    return null;
  }
}

export async function svgToJpeg(svgMarkup, { maxWidth = 1400, maxHeight = 960, quality = 0.92 } = {}) {
  if (!svgMarkup) return null;
  try {
    let markup = String(svgMarkup || '');
    if (!/xmlns=/.test(markup)) markup = markup.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    const viewBox = markup.match(/viewBox=["']([^"']+)["']/i)?.[1]?.split(/\s+/).map(Number) || [];
    const vbW = Number.isFinite(viewBox[2]) ? viewBox[2] : maxWidth;
    const vbH = Number.isFinite(viewBox[3]) ? viewBox[3] : maxHeight;
    markup = markup.replace(/<svg([^>]*)>/i, (match, attrs) => {
      let nextAttrs = attrs;
      if (!/\swidth=/.test(nextAttrs)) nextAttrs += ` width="${vbW}"`;
      if (!/\sheight=/.test(nextAttrs)) nextAttrs += ` height="${vbH}"`;
      return `<svg${nextAttrs}>`;
    });
    const chartStyle = `
      <style>
        .hx-chart-bg{fill:#ffffff;stroke:#CBD5E1;stroke-width:1.2;}
        .hx-grid-line{stroke:#E2E8F0;stroke-width:1;}
        .hx-axis-label,.hx-title,.hx-rh-label{fill:#111827;font-family:Arial,Helvetica,sans-serif;font-size:11px;}
        .hx-title{font-size:13px;font-weight:700;}
        .hx-rh{fill:none;stroke:#94A3B8;stroke-width:1.2;opacity:.9;}
        .hx-rh-100{stroke:#111827;stroke-width:2;}
        .hx-state-path{fill:none;stroke:#F97316;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;}
        .hx-point circle{fill:#ffffff;stroke:#F97316;stroke-width:2.6;}
        .hx-point text{fill:#111827;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;}
      </style>`;
    markup = markup.replace(/<svg([^>]*)>/i, match => `${match}${chartStyle}`);
    const svgText = `<?xml version="1.0" encoding="UTF-8"?>${markup}`;
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    let img;
    try { img = await imageElementFromSource(url); } finally { URL.revokeObjectURL(url); }
    const sourceW = img.naturalWidth || img.width || vbW || maxWidth;
    const sourceH = img.naturalHeight || img.height || vbH || maxHeight;
    const scale = Math.min(1, maxWidth / Math.max(1, sourceW), maxHeight / Math.max(1, sourceH));
    const width = Math.max(1, Math.round(sourceW * scale));
    const height = Math.max(1, Math.round(sourceH * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return { dataUrl: canvas.toDataURL('image/jpeg', quality), width, height };
  } catch (error) {
    console.warn('PDF-SVG konnte nicht gerendert werden.', error);
    return null;
  }
}

export function parseJpegDataUrl(image) {
  if (!image?.dataUrl || !/^data:image\/jpeg;base64,/i.test(image.dataUrl)) return null;
  const base64 = image.dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  return { width: image.width, height: image.height, binary };
}

export function createFallbackIconJpeg() {
  const canvas = document.createElement('canvas');
  canvas.width = 192;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, 192, 192);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 54px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TCP', 96, 96);
  return { dataUrl: canvas.toDataURL('image/jpeg', 0.9), width: 192, height: 192 };
}
