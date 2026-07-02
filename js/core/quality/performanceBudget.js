export const performanceBudget = Object.freeze({
  version: '1.3.2-dev.1-phase5',
  maxInitialBlockingMs: 150,
  maxModuleMountMs: 80,
  maxRouteRenderMs: 120,
  maxResizeRenderMs: 32,
  maxSynchronousStorageKb: 512,
  maxDomNodesPerModule: 1200,
  maxLegacyCssSelectors: 0,
  notes: Object.freeze([
    'Module rendern nur die benoetigten UI-Bereiche neu.',
    'Teure Exporte und grosse Tabellen bleiben lazy.',
    'Scrollposition und Fokus duerfen bei Modulaktionen nicht springen.'
  ])
});

export function measureBudget(name, fn, { budgetMs = performanceBudget.maxModuleMountMs, warn = true } = {}) {
  const api = typeof performance !== 'undefined' ? performance : null;
  const start = api?.now?.() ?? Date.now();
  const value = fn();
  const end = api?.now?.() ?? Date.now();
  const durationMs = end - start;
  if (warn && durationMs > budgetMs) {
    console.warn(`[TechCalc Budget] ${name} dauerte ${durationMs.toFixed(1)} ms, Budget ${budgetMs} ms.`);
  }
  return { value, durationMs, withinBudget: durationMs <= budgetMs };
}
