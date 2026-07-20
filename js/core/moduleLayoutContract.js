const MODULE_ROOT_SELECTOR = '.module-view > .module-content';

/**
 * Confirms the shell-owned root layout contract after a module has rendered.
 * The shell emits the root-stack class directly. This helper only preserves
 * compatibility for views rendered outside the standard shell and attaches
 * module metadata; it never turns the shell itself into a content grid.
 */
export function applyModuleRootLayout(root, moduleId) {
  if (!root?.querySelector) return () => {};

  const moduleView = root.querySelector('.module-view');
  const moduleRoot = root.querySelector(MODULE_ROOT_SELECTOR);
  if (!moduleView || !moduleRoot) return () => {};

  moduleRoot.classList.add('tc-module-root-stack');
  moduleRoot.dataset.moduleLayout = moduleId || moduleView.dataset.module || '';

  return () => {
    delete moduleRoot.dataset.moduleLayout;
  };
}
