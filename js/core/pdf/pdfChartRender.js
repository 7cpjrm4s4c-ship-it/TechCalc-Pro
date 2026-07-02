
function cropCanvasToContent(sourceCanvas, { padding = 18, threshold = 246 } = {}) {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const ctx = sourceCanvas.getContext('2d');
  const data = ctx.getImageData(0, 0, width, height).data;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a > 20 && (r < threshold || g < threshold || b < threshold)) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < minX || maxY < minY) return sourceCanvas;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);
  let cropW = Math.max(1, maxX - minX + 1);
  let cropH = Math.max(1, maxY - minY + 1);
  // RC.9: h,x screenshots often contain a very wide DOM box.  Remove side
  // whitespace aggressively enough that the PDF can use vertical space without
  // distorting the chart.  The crop is centred and only activates for extreme
  // aspect ratios.
  const maxAspect = 1.9;
  if (cropW / Math.max(1, cropH) > maxAspect) {
    const targetW = Math.max(1, Math.round(cropH * maxAspect));
    const centerX = Math.round((minX + maxX) / 2);
    minX = Math.max(0, Math.min(width - targetW, centerX - Math.floor(targetW / 2)));
    maxX = Math.min(width - 1, minX + targetW - 1);
    cropW = Math.max(1, maxX - minX + 1);
  }
  const out = document.createElement('canvas');
  out.width = Math.max(1, maxX - minX + 1);
  out.height = Math.max(1, maxY - minY + 1);
  const outCtx = out.getContext('2d');
  outCtx.fillStyle = '#ffffff';
  outCtx.fillRect(0, 0, out.width, out.height);
  outCtx.drawImage(sourceCanvas, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

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
    const cropped = cropCanvasToContent(out, { padding: 22, threshold: 248 });
    return { dataUrl: cropped.toDataURL('image/jpeg', quality), width: cropped.width, height: cropped.height };
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
    const cropped = cropCanvasToContent(canvas, { padding: 24, threshold: 248 });
    return { dataUrl: cropped.toDataURL('image/jpeg', quality), width: cropped.width, height: cropped.height };
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
