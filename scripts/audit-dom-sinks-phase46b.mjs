import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const runtimeDirs = ['js'];

const allowedInnerHtmlFiles = new Set([
  'js/core/domUpdate.js',
  'js/core/moduleRuntime.js',
  'js/core/navigation.js',
  'js/modules/drinking-water/dynamicRenderer.js',
  'js/modules/heat-recovery/dynamicRenderer.js',
  'js/modules/hx-diagram/renderPipeline.js',
  'js/modules/mixed-air/dynamicRenderer.js',
  'js/platform/dynamicRenderer/index.js',
  'js/platform/lineSectionController/index.js',
  'js/platform/moduleRuntime/index.js',
  'js/platform/shell/releaseNotesController.js',
  'js/platform/shell/serviceWorkerController.js'
]);

const forbiddenSinkPatterns = [
  { label: 'insertAdjacentHTML', regex: /\.insertAdjacentHTML\s*\(/ },
  { label: 'outerHTML assignment', regex: /\.outerHTML\s*=/ },
  { label: 'document.write', regex: /document\.write\s*\(/ },
  { label: 'eval', regex: /\beval\s*\(/ },
  { label: 'new Function', regex: /new\s+Function\s*\(/ }
];

function walk(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(full));
    else if (entry.isFile() && full.endsWith('.js')) result.push(full);
  }
  return result;
}

function rel(file) {
  return path.relative(root, file).replaceAll(path.sep, '/');
}

const files = runtimeDirs.flatMap(dir => walk(path.join(root, dir)));
const failures = [];
const innerHtmlFiles = [];

for (const file of files) {
  const relative = rel(file);
  const source = fs.readFileSync(file, 'utf8');
  if (/\.innerHTML\b/.test(source)) {
    innerHtmlFiles.push(relative);
    if (!allowedInnerHtmlFiles.has(relative)) {
      failures.push(`${relative}: innerHTML usage is not allow-listed`);
    }
  }

  for (const pattern of forbiddenSinkPatterns) {
    if (pattern.regex.test(source)) failures.push(`${relative}: forbidden DOM/code sink ${pattern.label}`);
  }
}

const releaseNotes = fs.readFileSync(path.join(root, 'js/platform/shell/releaseNotesController.js'), 'utf8');
if (!releaseNotes.includes("import { esc as escapeHtml } from '../../core/renderer.js';")) {
  failures.push('releaseNotesController.js must use the shared HTML escaping helper.');
}
if (/host\.innerHTML\s*=\s*notes\.slice/.test(releaseNotes) || /notes\.slice\([^)]*\)\.map\([\s\S]{0,500}join\(''\)\s*;/.test(releaseNotes)) {
  failures.push('releaseNotesController.js must not render fetched markdown notes by direct innerHTML template mapping.');
}
if (!/replaceReleaseNotes\(host, elements\)/.test(releaseNotes)) {
  failures.push('releaseNotesController.js must render release notes through replaceReleaseNotes().');
}

const docs = fs.existsSync(path.join(root, 'docs/security/SECURITY_HARDENING_1.3.4.md'));
if (!docs) failures.push('docs/security/SECURITY_HARDENING_1.3.4.md is required.');

if (failures.length) {
  console.error('Phase 46B DOM sink audit failed:');
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log(`Phase 46B DOM sink audit passed (${innerHtmlFiles.length} allow-listed runtime files).`);
