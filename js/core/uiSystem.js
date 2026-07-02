import { esc, card } from './renderer.js';

export const uiSystem = Object.freeze({
  version: '1.3.2-dev.1-phase3',
  prefix: 'tc-',
  primitives: Object.freeze([
    'tc-stack',
    'tc-fields',
    'tc-list',
    'tc-item',
    'tc-accordion',
    'tc-accordion__body',
    'tc-pill-list',
    'tc-pill',
    'tc-add-row',
    'tc-warning-list',
    'tc-warning',
    'tc-help',
    'tc-note',
    'tc-formula'
  ]),
  deprecatedModulePrefixes: Object.freeze(['dw-', 'ph-', 'hx-', 'rainwater-', 'wastewater-'])
});

export function warningList(items = [], { empty = 'Keine Hinweise.', prefix = 'Hinweis' } = {}) {
  if (!items.length) return `<div class="empty-state empty-state--compact tc-note">${esc(empty)}</div>`;
  return `<div class="tc-warning-list">${items.map(item => `<div class="tc-warning"><span>${esc(prefix)}</span><strong>${esc(item)}</strong></div>`).join('')}</div>`;
}

export function helpText(content, { inline = false } = {}) {
  return `<p class="tc-help${inline ? ' tc-help--inline' : ''}">${content}</p>`;
}

export function formula(content, { small = false } = {}) {
  return `<div class="formula tc-formula${small ? ' tc-formula--small' : ''}">${esc(content)}</div>`;
}

export function accordion({ title, subtitle = '', body = '', open = false, attrs = '', variant = '' }) {
  const variantClass = variant ? ` tc-accordion--${esc(variant)}` : '';
  return `<details class="tc-accordion${variantClass}" ${attrs} ${open ? 'open' : ''}><summary><span><strong>${esc(title)}</strong>${subtitle ? `<small>${esc(subtitle)}</small>` : ''}</span></summary><div class="tc-accordion__body">${body}</div></details>`;
}

export function noteCard(title, message, accent = 'blue') {
  return card(title, `<div class="tc-note">${message}</div>`, accent, { compact: true });
}
