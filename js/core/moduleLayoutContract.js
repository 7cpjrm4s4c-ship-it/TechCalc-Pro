const MODULE_ROOT_SELECTOR = '.module-view > .module-content';

/**
 * Applies the explicit outer layout contract after a module has rendered.
 * This is intentionally deterministic: no DOM heuristics, recursion or
 * mutation observation. Every platform module exposes exactly one root stack.
 */
export function applyModuleRootLayout(root, moduleId) {
  if (!root?.querySelector) return () => {};

  const moduleView = root.querySelector('.module-view');
  const moduleRoot = root.querySelector(MODULE_ROOT_SELECTOR);
  if (!moduleView || !moduleRoot) return () => {};

  moduleView.classList.add('tc-module-layout');
  moduleRoot.classList.add('tc-module-root-stack');
  moduleRoot.dataset.moduleLayout = moduleId || moduleView.dataset.module || '';

  return () => {
    moduleView.classList.remove('tc-module-layout');
    moduleRoot.classList.remove('tc-module-root-stack');
    delete moduleRoot.dataset.moduleLayout;
  };
}
