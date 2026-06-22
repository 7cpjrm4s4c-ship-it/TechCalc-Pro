import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
const icons = Array.isArray(manifest.icons) ? manifest.icons : [];

if (icons.length === 0) {
  throw new Error('manifest.json must define icons.');
}

const invalidCombined = icons.filter((icon) => /\bany\b/.test(icon.purpose || '') && /\bmaskable\b/.test(icon.purpose || ''));
if (invalidCombined.length > 0) {
  throw new Error('manifest icons must not combine purpose "any maskable". Use separate entries.');
}

const bySize = new Map();
for (const icon of icons) {
  if (!icon.src || !icon.sizes || !icon.type) {
    throw new Error(`manifest icon is missing src/sizes/type: ${JSON.stringify(icon)}`);
  }
  const purposes = (icon.purpose || '').trim().split(/\s+/).filter(Boolean);
  if (purposes.length !== 1 || !['any', 'maskable'].includes(purposes[0])) {
    throw new Error(`manifest icon must use exactly one supported purpose: ${JSON.stringify(icon)}`);
  }
  const key = `${icon.sizes}|${icon.type}`;
  const set = bySize.get(key) || new Set();
  set.add(purposes[0]);
  bySize.set(key, set);
}

for (const [key, purposes] of bySize.entries()) {
  if (!purposes.has('any') || !purposes.has('maskable')) {
    throw new Error(`manifest icon group ${key} must include separate any and maskable entries.`);
  }
}

console.log('Phase 39E manifest icon audit ok');
