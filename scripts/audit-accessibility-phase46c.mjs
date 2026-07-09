import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const indexPath = path.join(root, 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

function fail(message) {
  failures.push(message);
}

function attrs(tag) {
  const result = {};
  for (const match of tag.matchAll(/\s([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/g)) {
    result[match[1].toLowerCase()] = String(match[2] || '').replace(/^['"]|['"]$/g, '');
  }
  return result;
}

function stripTags(value = '') {
  return value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

if (!/<html\s+[^>]*lang="de"/i.test(html)) fail('index.html must declare html lang="de".');
if (!/<meta\s+name="viewport"[^>]*width=device-width/i.test(html)) fail('index.html must include a mobile viewport declaration.');
if (!/<main\s+[^>]*id="app"[^>]*tabindex="-1"/i.test(html)) fail('main app region must be focusable for route changes.');
if (!/<nav\s+[^>]*aria-label="Module"/i.test(html)) fail('primary module navigation must expose aria-label="Module".');
if (!/id="settingsButton"[^>]*aria-label="Menü öffnen"[^>]*aria-expanded="false"/i.test(html)) fail('settings button must expose label and expanded state.');
if (!/id="projectFileLabel"[^>]*aria-live="polite"/i.test(html)) fail('project file status must use aria-live="polite".');
if (!/id="feedbackStatus"[^>]*aria-live="polite"/i.test(html)) fail('feedback status must use aria-live="polite".');
if (!/id="themeMode"[^>]*role="radiogroup"[^>]*aria-label="Farbschema"/i.test(html)) fail('theme switch must be announced as a labeled radiogroup.');

const imgTags = html.match(/<img\b[^>]*>/gi) || [];
for (const tag of imgTags) {
  const a = attrs(tag);
  if (!('alt' in a)) fail(`Image without alt attribute: ${tag}`);
}

const inputTags = html.match(/<input\b[^>]*>/gi) || [];
for (const tag of inputTags) {
  const a = attrs(tag);
  const type = String(a.type || 'text').toLowerCase();
  if (['hidden'].includes(type)) continue;
  if (a['aria-hidden'] === 'true' || tag.includes('visually-hidden') && type === 'text') continue;
  const id = a.id || '';
  const hasWrappedLabel = new RegExp(`<label[^>]*>[^<]*(?:<[^>]+>[^<]*)*${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(html);
  const hasForLabel = id && new RegExp(`<label\\s+[^>]*for=["']${id}["']`, 'i').test(html);
  const hasAria = Boolean(a['aria-label'] || a['aria-labelledby']);
  if (!hasWrappedLabel && !hasForLabel && !hasAria) fail(`Input requires label or aria-label: ${tag}`);
}

const buttonMatches = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)];
for (const match of buttonMatches) {
  const tag = `<button${match[1]}>`;
  const a = attrs(tag);
  const label = stripTags(match[2]);
  if (!label && !a['aria-label'] && !a['aria-labelledby']) fail(`Button requires accessible name: ${tag}`);
}

const qmPath = path.join(root, 'docs/qm/QM-011-Accessibility.md');
if (!fs.existsSync(qmPath)) fail('QM-011-Accessibility.md is required.');
else {
  const qm = fs.readFileSync(qmPath, 'utf8');
  if (!/WCAG\s+2\.1\s+AA/i.test(qm)) fail('QM-011 must define WCAG 2.1 AA as target level.');
  if (!/audit-accessibility-phase46c\.mjs/.test(qm)) fail('QM-011 must reference the automated Phase 46C accessibility audit.');
}

const phasePath = path.join(root, 'docs/phases/phase-46c-accessibility-baseline.md');
if (!fs.existsSync(phasePath)) fail('Phase 46C documentation is required.');

if (failures.length) {
  console.error('Phase 46C accessibility audit failed:');
  for (const item of failures) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`Phase 46C accessibility audit passed (${inputTags.length} inputs, ${buttonMatches.length} static buttons, ${imgTags.length} images checked).`);
