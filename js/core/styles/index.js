export const coreStylesheetManifest = Object.freeze([
  'css/tokens.css',
  'css/theme-light.css',
  'css/theme-light-final.css',
  'css/theme-light-contrast.css',
  'css/theme-light-surfaces.css',
  'css/theme-light-rollout.css',
  'css/theme-light-guards.css',
  'css/layout.css',
  'css/layout-navigation-theme.css',
  'css/components.css',
  'css/components-core.css',
  'css/components-controls.css',
  'css/components-collections.css',
  'css/components-save-manager.css',
  'css/components-settings-release.css',
  'css/components-app-status.css',
  'css/components-system.css',
  'css/components-polish.css',
  'css/components-legacy-contracts.css',
  'css/modules.css',
  'css/modules-base.css',
  'css/modules-responsive.css',
  'css/modules-light-overrides.css',
  'css/module-accent-tokens.css',
  'css/module-spacing-contract.css'
]);

export const moduleStylesheetManifest = Object.freeze([
  'css/modules-hx.css',
  'css/modules-pipe.css',
  'css/modules-pressure-buffer.css',
  'css/modules-unit.css',
  'css/modules-wrg.css'
]);

export function listCoreStylesheets() {
  return coreStylesheetManifest;
}

export function listModuleStylesheets() {
  return moduleStylesheetManifest;
}
