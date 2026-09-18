import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { detectRuntimeLayout } from './runtime-layout.mjs';

const root = new URL('..', import.meta.url).pathname;
const { coreDir, modulesDir } = detectRuntimeLayout(root);
const runtimeRoots = [join(root, coreDir), join(root, modulesDir)];

const CENTRAL_KEYBOARD_FILES = new Set([
  'core/events/eventPipeline.js',
  'core/focusManager.js',
  'core/stateBinding.js',
  'core/savedRecords.js',
  'core/ux/settingsController.js'
]);

const ALLOWED_NON_KEYBOARD_KEY_PROPERTIES = new Set([
  // Dedupe keys, not KeyboardEvent.key usage.
  'modules/hx-diagram/controller.js',
  'modules/wastewater/controller.js',
  'js/platform/moduleRuntime/index.js'
]);

const BLOCKED_LISTENER_RE = /addEventListener\s*\(\s*['"](?:keydown|keypress|keyup)['"]/;
const BLOCKED_HANDLER_PROP_RE = /\bon(?:keydown|keypress|keyup)\b/;
const EVENT_KEY_RE = /\bevent\.key\b/;
const LINE_COMMENT_RE = /(^|\n)\s*\/\/.*(?=\n|$)/g;
const HANDLE_PLATFORM_IMPORT_RE = /import\s*\{[^}]*handlePlatformFieldNavigation|handlePlatformFieldNavigation\s*\}/s;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git') continue;
    const path = join(dir, entry);
    const st = statSync(path);
    if (st.isDirectory()) out.push(...walk(path));
    else if (path.endsWith('.js')) out.push(path);
  }
  return out;
}

function rel(path) {
  return relative(root, path).replaceAll('\\', '/');
}

const failures = [];
const warnings = [];
for (const file of runtimeRoots.flatMap(walk)) {
  const fileRel = rel(file);
  const srcRaw = readFileSync(file, 'utf8');
  const src = srcRaw.replace(LINE_COMMENT_RE, '');
  const isCentral = CENTRAL_KEYBOARD_FILES.has(fileRel);
  const isAllowedDedupe = ALLOWED_NON_KEYBOARD_KEY_PROPERTIES.has(fileRel);

  if (!isCentral && (BLOCKED_LISTENER_RE.test(src) || BLOCKED_HANDLER_PROP_RE.test(src))) {
    failures.push(`${fileRel}: local keydown/keypress/keyup listener is not allowed outside the central keyboard contract.`);
  }

  if (!isCentral && EVENT_KEY_RE.test(src)) {
    failures.push(`${fileRel}: KeyboardEvent event.key usage is not allowed outside the central keyboard contract.`);
  }

  if (!isCentral && HANDLE_PLATFORM_IMPORT_RE.test(src)) {
    failures.push(`${fileRel}: handlePlatformFieldNavigation import must not be used by modules or platform runtime directly.`);
  }

  if (isAllowedDedupe && /\blast\.key\b|\bdedupeKey\b/.test(src)) {
    warnings.push(`${fileRel}: dedupe key usage retained; verified as non-KeyboardEvent state key.`);
  }
}

const eventPipeline = readFileSync(join(root, 'core/events/eventPipeline.js'), 'utf8');
const focusManager = readFileSync(join(root, 'core/focusManager.js'), 'utf8');

const requiredEventPipelineSnippets = [
  'handlePlatformFieldNavigation',
  'data-collection-input',
  "add(root, 'keydown', onKeydown, true)",
  "event.key !== 'Enter' && event.key !== 'Tab'"
];
for (const snippet of requiredEventPipelineSnippets) {
  if (!eventPipeline.includes(snippet)) {
    failures.push(`core/events/eventPipeline.js: missing required central keyboard contract snippet: ${snippet}`);
  }
}

const requiredFocusSnippets = [
  'getFocusableElements',
  'focusNext',
  'handlePlatformFieldNavigation',
  '[data-saved-record-card]',
  '[data-platform-focus]',
  'button:not([disabled]):not([data-skip-platform-focus])'
];
for (const snippet of requiredFocusSnippets) {
  if (!focusManager.includes(snippet)) {
    failures.push(`core/focusManager.js: missing required focus graph snippet: ${snippet}`);
  }
}

if (failures.length) {
  console.error('Phase 42E.3 keyboard regression audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  if (warnings.length) {
    console.error('\nWarnings:');
    for (const warning of warnings) console.error(`- ${warning}`);
  }
  process.exit(1);
}

console.log('Phase 42E.3 keyboard regression audit ok');
if (warnings.length) {
  for (const warning of warnings) console.log(`- ${warning}`);
}
