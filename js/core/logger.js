const LEVELS = Object.freeze({ debug: 10, info: 20, warn: 30, error: 40, silent: 99 });
const DEFAULT_RELEASE_LEVEL = 'error';
const DEFAULT_DEVELOPMENT_LEVEL = 'info';

function isDevelopmentRuntime() {
  const host = globalThis.location?.hostname || '';
  return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local') || globalThis.__TECHCALC_DEV__ === true;
}

function configuredLevel() {
  const explicit = globalThis.__TECHCALC_LOG_LEVEL__;
  if (explicit && Object.prototype.hasOwnProperty.call(LEVELS, explicit)) return explicit;
  return isDevelopmentRuntime() ? DEFAULT_DEVELOPMENT_LEVEL : DEFAULT_RELEASE_LEVEL;
}

function shouldLog(level) {
  return LEVELS[level] >= LEVELS[configuredLevel()];
}

function normalizeMeta(meta = {}) {
  return {
    module: meta.module || 'app',
    time: new Date().toISOString(),
    ...meta
  };
}

function emit(level, message, details, meta) {
  if (!shouldLog(level)) return;
  const payload = normalizeMeta(meta);
  const line = `[TechCalc:${payload.module}] ${message}`;
  const sink = console[level] || console.log;
  if (details !== undefined) sink.call(console, line, payload, details);
  else sink.call(console, line, payload);
}

export const logger = Object.freeze({
  debug(message, details, meta) { emit('debug', message, details, meta); },
  info(message, details, meta) { emit('info', message, details, meta); },
  warn(message, details, meta) { emit('warn', message, details, meta); },
  error(message, details, meta) { emit('error', message, details, meta); },
  setLevel(level) {
    if (!Object.prototype.hasOwnProperty.call(LEVELS, level)) throw new Error(`Unknown log level: ${level}`);
    globalThis.__TECHCALC_LOG_LEVEL__ = level;
  }
});
