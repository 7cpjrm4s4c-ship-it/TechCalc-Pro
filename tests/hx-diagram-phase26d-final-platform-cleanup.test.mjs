import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const mod = (...parts) => readFileSync(join(root, 'js/modules/hx-diagram', ...parts), 'utf8');

const config = mod('config.js');
const index = mod('index.js');
const view = mod('view.js');
const form = mod('formRenderer.js');
const pipeline = mod('renderPipeline.js');
const diagram = mod('diagramRenderer.js');
const dynamic = mod('dynamicRenderer.js');

assert.match(config, /migrationStatus:\s*'phase-26d-final-platform-cleanup'/, 'config must expose the final 26D migration status');

assert.match(index, /createPlatformModule/, 'h,x must remain mounted through the platform runtime');
assert.match(index, /dynamicUpdate:\s*updateHxDiagramDynamic/, 'h,x must keep the dynamic update contract');
assert.match(index, /isDynamicAction:\s*isDynamicHxDiagramAction/, 'h,x must keep the dynamic action guard');

assert.match(view, /renderModuleShell/, 'view must render only the module shell/layout');
assert.match(view, /data-hx-dynamic="\$\{HX_DYNAMIC\.results\}"/, 'view must expose a dynamic results slot');
assert.match(view, /data-hx-dynamic="\$\{HX_DYNAMIC\.diagram\}"/, 'view must expose a dynamic diagram slot');
assert.match(view, /data-hx-dynamic="\$\{HX_DYNAMIC\.savedProcesses\}"/, 'view must expose a dynamic saved-processes slot');
assert.doesNotMatch(view, /<svg|renderHxSvg|buildStateSegments|humidityRatioKgKg|chartCard/, 'view must not contain diagram/SVG logic');
assert.doesNotMatch(view, /hxProcessController|registerCentralActions|state\.set|calculate\(/, 'view must not contain controller/state/result logic');

assert.match(form, /renderHxInputCard/, 'form renderer must own input card rendering');
assert.doesNotMatch(form, /<svg|renderHxSvg|buildStateSegments|hxProcessController|state\.set|calculate\(/, 'form renderer must stay free of diagram/controller/state logic');

assert.match(diagram, /export function renderHxSvg/, 'diagram renderer must export SVG rendering');
assert.match(diagram, /export function buildStateSegments/, 'diagram renderer must export path segment rendering');
assert.match(diagram, /export function chartCard/, 'diagram renderer must export the diagram card');
assert.match(diagram, /humidityRatioKgKg/, 'diagram renderer may own psychrometric curve rendering');

assert.match(pipeline, /export function renderDynamicSections/, 'render pipeline must orchestrate dynamic sections');
assert.match(pipeline, /renderResults/, 'render pipeline must render results');
assert.match(pipeline, /renderDiagram/, 'render pipeline must render diagram');
assert.match(pipeline, /renderSavedProcesses/, 'render pipeline must render saved records');
assert.match(pipeline, /renderProcessSelection/, 'render pipeline must render the process selector island');
assert.doesNotMatch(pipeline, /import \{ calculate/, 'render pipeline must not duplicate result calculation outside the view model');

assert.match(dynamic, /renderDynamicSections/, 'dynamic renderer must delegate to the single render pipeline');
assert.doesNotMatch(dynamic, /chartCard|renderHxResultModel|hxProcessCard|innerHTML\s*=/, 'dynamic renderer must not render individual islands itself');

console.log('hx-diagram phase 26D final platform cleanup checks passed');
