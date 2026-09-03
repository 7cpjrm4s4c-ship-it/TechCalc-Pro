import { logger } from './logger.js';
import { modules } from './registry.js';
import { initRouter, currentRoute, navigate } from './router.js';
import { renderNavigation, renderQuickAccessSettings } from './navigation.js';
import heatingCoolingConfig from '../modules/heating-cooling/config.js';
import ventilationConfig from '../modules/ventilation/config.js';
import pipeSizingConfig from '../modules/pipe-sizing/config.js';
import unitConverterConfig from '../modules/unit-converter/config.js';
import heatRecoveryConfig from '../modules/heat-recovery/config.js';
import mixedAirConfig from '../modules/mixed-air/config.js';
import hxDiagramConfig from '../modules/hx-diagram/config.js';
import drinkingWaterConfig from '../modules/drinking-water/config.js';
import pressureHoldingConfig from '../modules/pressure-holding/config.js';
import bufferStorageConfig from '../modules/buffer-storage/config.js';
import wastewaterConfig from '../modules/wastewater/config.js';
import rainwaterConfig from '../modules/rainwater/config.js';
import floodingVerificationConfig from '../modules/flooding-verification/config.js';
import fGasesCheckConfig from '../modules/f-gases-check/config.js';
import en378SafetyCheckConfig from '../modules/en-378-safety-check/config.js';
import { restoreSessionSnapshot, saveSessionSnapshot } from './projectStorage.js';
import { createModuleLifecycleAdapter } from './moduleLifecycleAdapter.js';
import { createModuleRuntime } from './moduleRuntime.js';
import { trackGlobalEventListener } from './eventManager.js';
import { initializeThemeController } from '../platform/shell/themeController.js';
import { initializeSettingsController } from '../platform/shell/settingsController.js';
import { initializeReleaseNotesController } from '../platform/shell/releaseNotesController.js';
import { initializeFeedbackController } from '../platform/shell/feedbackController.js';
import { initializeServiceWorkerController } from '../platform/shell/serviceWorkerController.js';
import { initializePerformanceController, markPerformance, measurePerformance, startPerformanceSpan } from '../platform/shell/performanceController.js';
import { initializeSaveEditModeSync } from './saveEditModeSync.js';
import { initializeLayoutStabilityController } from '../platform/shell/layoutStabilityController.js';
const APP_VERSION = '1.6.1'; // generated from package.json
initializeLayoutStabilityController();
initializePerformanceController({ appVersion: APP_VERSION });
const appInitStartMark = markPerformance('app:init:start', { appVersion: APP_VERSION });
const lazyModules = [
  { config: heatingCoolingConfig, path: '../modules/heating-cooling/index.js' },
  { config: ventilationConfig, path: '../modules/ventilation/index.js' },
  { config: pressureHoldingConfig, path: '../modules/pressure-holding/index.js' },
  { config: bufferStorageConfig, path: '../modules/buffer-storage/index.js' },
  { config: heatRecoveryConfig, path: '../modules/heat-recovery/index.js' },
  { config: mixedAirConfig, path: '../modules/mixed-air/index.js' },
  { config: hxDiagramConfig, path: '../modules/hx-diagram/index.js' },
  { config: pipeSizingConfig, path: '../modules/pipe-sizing/index.js' },
  { config: unitConverterConfig, path: '../modules/unit-converter/index.js' },
  { config: drinkingWaterConfig, path: '../modules/drinking-water/index.js' },
  { config: wastewaterConfig, path: '../modules/wastewater/index.js' },
  { config: rainwaterConfig, path: '../modules/rainwater/index.js' },
  { config: floodingVerificationConfig, path: '../modules/flooding-verification/index.js' },
  { config: fGasesCheckConfig, path: '../modules/f-gases-check/index.js' },
  { config: en378SafetyCheckConfig, path: '../modules/en-378-safety-check/index.js' }
];
const moduleCache = new Map();
const preloadedModuleIds = new Set();
function loadLazyModule(config, path) {
  let loaded = moduleCache.get(config.id);
  if (!loaded) {
    const finishLoad = startPerformanceSpan('module:lazy-load', { moduleId: config.id });
    loaded = import(path)
      .then(mod => { finishLoad({ status: 'ok' }); return mod.default || mod; })
      .catch(error => {
        moduleCache.delete(config.id);
        preloadedModuleIds.delete(config.id);
        finishLoad({ status: 'error', error: error?.message || String(error) });
        throw error;
      });
    moduleCache.set(config.id, loaded);
  }
  return loaded;
}
function preloadLazyModule(config, path) {
  if (!config?.id || preloadedModuleIds.has(config.id)) return;
  preloadedModuleIds.add(config.id);
  loadLazyModule(config, path).catch(error => {
    logger.warn(`Modul konnte nicht vorgeladen werden: ${config.id}`, error, { module: 'app' });
  });
}
function scheduleLazyModulePreload() {
  const preload = () => lazyModules.forEach(({ config, path }) => preloadLazyModule(config, path));
  if ('requestIdleCallback' in window) window.requestIdleCallback(preload, { timeout: 1500 });
  else window.setTimeout(preload, 250);
}
const currentRouteConfig = lazyModules.find(({ config }) => config.id === currentRoute());
if (currentRouteConfig) preloadLazyModule(currentRouteConfig.config, currentRouteConfig.path);
function registerLazyModule({ config, path, module: eagerModule }) {
  if (eagerModule) {
    modules.register({ config, ...eagerModule, mount: createModuleLifecycleAdapter(config.id, eagerModule.mount) });
    return;
  }
  // The registry stores a frozen normalized wrapper but intentionally retains
  // this mutable source object under `module`. Once lazy loading completes we
  // publish the real module contract here so cross-cutting services such as
  // typed PDF reporting can access state/report after the active module mounts.
  const registration = {
    config,
    loadedModule: null,
    async mount(root) {
      const renderToken = root?.dataset?.renderToken || '';
      const loadedModule = await loadLazyModule(config, path);
      registration.loadedModule = loadedModule;
      registration.state = loadedModule?.state;
      registration.report = loadedModule?.report;
      registration.calculate = loadedModule?.calculate;
      registry.results = loadedModule??results;
