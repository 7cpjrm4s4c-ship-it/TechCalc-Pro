const DEFAULT_BUFFER_LIMIT = 120;
let performanceControllerInitialized = false;
let bufferLimit = DEFAULT_BUFFER_LIMIT;
const entries = [];

function now() {
  const perf = globalThis.performance;
  return perf && typeof perf.now === 'function' ? perf.now() : Date.now();
}

function supportsPerformanceMarks() {
  const perf = globalThis.performance;
  return Boolean(perf && typeof perf.mark === 'function' && typeof perf.measure === 'function');
}

function normalizeName(name = '') {
  return String(name || 'performance').replace(/[^a-z0-9:_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'performance';
}

function pushEntry(entry) {
  entries.push({ at: Date.now(), ...entry });
  if (entries.length > bufferLimit) entries.splice(0, entries.length - bufferLimit);
  return entry;
}

export function markPerformance(name, detail = {}) {
  const label = `tc:${normalizeName(name)}`;
  const entry = { type: 'mark', name: label, detail, time: now() };
  if (supportsPerformanceMarks()) {
    try { performance.mark(label, { detail }); } catch { performance.mark(label); }
  }
  pushEntry(entry);
  return label;
}

export function measurePerformance(name, startMark, endMark, detail = {}) {
  const label = `tc:${normalizeName(name)}`;
  const entry = { type: 'measure', name: label, startMark, endMark, detail, time: now(), duration: null };
  if (supportsPerformanceMarks()) {
    try {
      performance.measure(label, { start: startMark, end: endMark, detail });
    } catch {
      try { performance.measure(label, startMark, endMark); } catch { /* no-op */ }
    }
    const measures = typeof performance.getEntriesByName === 'function' ? performance.getEntriesByName(label, 'measure') : [];
    const latest = measures?.[measures.length - 1];
    if (latest && Number.isFinite(latest.duration)) entry.duration = latest.duration;
  }
  pushEntry(entry);
  return label;
}

export function startPerformanceSpan(name, detail = {}) {
  const base = normalizeName(name);
  const id = `${base}:${Math.random().toString(16).slice(2)}`;
  const startedAt = now();
  const startMark = markPerformance(`${id}:start`, detail);
  let finished = false;
  return (endDetail = {}) => {
    if (finished) return null;
    finished = true;
    const mergedDetail = { ...detail, ...endDetail };
    const endMark = markPerformance(`${id}:end`, mergedDetail);
    const measureName = measurePerformance(base, startMark, endMark, mergedDetail);
    const latest = entries[entries.length - 1];
    if (latest && latest.name === measureName && latest.duration == null) latest.duration = now() - startedAt;
    return measureName;
  };
}

export function withPerformanceSpan(name, callback, detail = {}) {
  const finish = startPerformanceSpan(name, detail);
  try {
    const result = callback?.();
    if (result && typeof result.then === 'function') {
      return result.finally(() => finish());
    }
    finish();
    return result;
  } catch (error) {
    finish({ error: error?.message || String(error) });
    throw error;
  }
}

export function getPerformanceSnapshot() {
  return entries.slice();
}

export function initializePerformanceController({ appVersion = '', limit = DEFAULT_BUFFER_LIMIT, windowRef = typeof window !== 'undefined' ? window : null } = {}) {
  if (performanceControllerInitialized) return false;
  performanceControllerInitialized = true;
  bufferLimit = Math.max(20, Number(limit) || DEFAULT_BUFFER_LIMIT);
  markPerformance('performance:init', { appVersion });
  if (windowRef) {
    windowRef.__tcPerformance = {
      mark: markPerformance,
      measure: measurePerformance,
      startSpan: startPerformanceSpan,
      snapshot: getPerformanceSnapshot
    };
  }
  return true;
}

export default initializePerformanceController;
