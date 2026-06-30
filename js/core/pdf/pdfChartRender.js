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

export async function svgToJpeg(svgMarkup, { maxWidth = 1200, maxHeight = 760, quality = 0.9 } = {}) {
  if (!svgMarkup) return null;
  try {
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = await imageElementFromSource(url);
    URL.revokeObjectURL(url);
    const scale = Math.min(1, maxWidth / Math.max(1, img.naturalWidth || img.width), maxHeight / Math.max(1, img.naturalHeight || img.height));
    const width = Math.max(1, Math.round((img.naturalWidth || img.width || maxWidth) * scale));
    const height = Math.max(1, Math.round((img.naturalHeight || img.height || maxHeight) * scale));
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
