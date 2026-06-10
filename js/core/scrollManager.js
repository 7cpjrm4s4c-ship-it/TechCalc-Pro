import { preserveViewport as preserveRendererViewport } from './renderer.js';

export const SCROLL_STABILITY_PRESETS = Object.freeze({
  default: Object.freeze({ frames: 6, blurActive: false, delays: [0, 40, 120] }),
  action: Object.freeze({ frames: 6, blurActive: false, delays: [0, 40, 100, 220] }),
  savedRecord: Object.freeze({ frames: 8, blurActive: false, delays: [0, 40, 100, 220] })
});

export function preserveScroll(action, preset = 'default', overrides = {}) {
  const base = SCROLL_STABILITY_PRESETS[preset] || SCROLL_STABILITY_PRESETS.default;
  return preserveRendererViewport(action, { ...base, ...overrides });
}

export function preserveActionScroll(action, overrides = {}) {
  return preserveScroll(action, 'action', overrides);
}

export function preserveSavedRecordScroll(action, overrides = {}) {
  return preserveScroll(action, 'savedRecord', overrides);
}
