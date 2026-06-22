import { fmtInput } from '../../utils/calculations.js';
import { field, selectField, grid } from '../../core/renderer.js';
import { fixtureTypes, usageTypes } from './tables.js';
import { getFixture } from './logic.js';

const options = items => items.map(item => ({ value: item.value ?? item.id, label: item.label ?? item.name }));
const fixtureOptions = fixtureTypes.map(item => ({ value: item.id, label: item.name }));
const usageOptions = usageTypes.map(item => ({ value: item.value, label: item.label }));
const yesNoOptions = [{ value: 'no', label: 'automatisch / nein' }, { value: 'yes', label: 'ja' }];
const branchOptions = [{ value: 'with-radius', label: 'mit Innenradius' }, { value: 'without-radius', label: 'ohne Innenradius' }];
const fillOptions = [{ value: '0.5', label: 'h/di 0,5' }, { value: '0.7', label: 'h/di 0,7' }, { value: '1.0', label: 'h/di 1,0' }];
const lineTypeOptions = [
  { value: 'single-unvented', label: 'Einzelanschluss unbelüftet' },
  { value: 'single-vented', label: 'Einzelanschluss belüftet' },
  { value: 'branch-unvented', label: 'Anschlussleitung unbelüftet' },
  { value: 'branch-vented', label: 'Anschlussleitung belüftet' },
  { value: 'stack', label: 'Fallleitung' },
  { value: 'collector', label: 'Sammelleitung' },
  { value: 'ground-inside', label: 'Grundleitung innen' },
  { value: 'ground-outside', label: 'Grundleitung außen' }
];

export function usesFillRatio(s = {}) {
  return ['branch-vented', 'collector', 'ground-inside', 'ground-outside'].includes(s.lineType);
}

export function usesBranchType(s = {}) {
  return s.lineType === 'stack';
}

export function showLength(s = {}) {
  return ['single-unvented', 'single-vented', 'branch-unvented'].includes(s.lineType);
}

export function showBends(s = {}) {
  return ['single-unvented', 'branch-unvented', 'branch-vented'].includes(s.lineType);
}

export function isCustomFixture(s = {}) {
  return Boolean(getFixture(s.fixtureType || 'washbasin')?.custom);
}

export function usageFields(s = {}) {
  const fields = [
    selectField({ id: 'usageType', label: 'Nutzungsart', value: s.usageType, options: usageOptions }),
  ];
  if (s.usageType === 'custom') {
    fields.push(field({ id: 'kValue', label: 'Abflusskennzahl K', value: fmtInput(s.kValue, 1) }));
  }
  return grid(fields.join(''), 2);
}

export function lineFields(s = {}) {
  const fields = [
    selectField({ id: 'lineType', label: 'Leitungsart', value: s.lineType, options: lineTypeOptions }),
  ];
  if (usesBranchType(s)) fields.push(selectField({ id: 'branchType', label: 'Abzweigart Fallleitung', value: s.branchType, options: branchOptions }));
  if (usesFillRatio(s)) fields.push(selectField({ id: 'fillRatio', label: 'Füllungsgrad', value: s.fillRatio, options: fillOptions }));
  fields.push(field({ id: 'slopeCmM', label: 'Gefälle', value: fmtInput(s.slopeCmM, 1), unit: 'cm/m' }));
  if (showLength(s)) fields.push(field({ id: 'pipeLengthM', label: 'Rohrlänge', value: fmtInput(s.pipeLengthM, 1), unit: 'm' }));
  if (showBends(s)) fields.push(field({ id: 'bends90', label: '90°-Umlenkungen', value: fmtInput(s.bends90, 0), unit: 'Stk.', inputmode: 'numeric' }));
  return grid(fields.join(''), 2);
}

export function fixtureInputFields(s = {}) {
  const fields = [
    selectField({ id: 'fixtureType', label: 'Gegenstand hinzufügen', value: s.fixtureType, options: fixtureOptions }),
    field({ id: 'fixtureQuantity', label: 'Anzahl', value: fmtInput(s.fixtureQuantity, 0), unit: 'Stk.', inputmode: 'numeric' })
  ];
  if (isCustomFixture(s)) {
    fields.push(field({ id: 'fixtureCustomName', label: 'Bezeichnung', value: s.fixtureCustomName || '', placeholder: 'z. B. Laborbecken', inputmode: 'text' }));
    fields.push(field({ id: 'fixtureCustomDu', label: 'DU', value: fmtInput(s.fixtureCustomDu, 1), unit: 'l/s' }));
    fields.push(field({ id: 'fixtureCustomDn', label: 'Mindest-DN', value: s.fixtureCustomDn || '', placeholder: 'DN 50', inputmode: 'text' }));
  }
  fields.push(`<div class="field field--action"><label>&nbsp;</label><div class="control"><button type="button" class="action-button" data-tc-action="platform:collection:add" data-collection="fixtures">Gegenstand hinzufügen</button></div></div>`);
  return grid(fields.join(''), 2);
}

export function additionalFlowFields(s = {}) {
  return grid([
    field({ id: 'continuousFlow', label: 'Dauerabfluss Qc', value: fmtInput(s.continuousFlow, 2), unit: 'l/s' }),
    field({ id: 'pumpFlow', label: 'Pumpenförderstrom Qp', value: fmtInput(s.pumpFlow, 2), unit: 'l/s' }),
    field({ id: 'rainFlow', label: 'verunreinigtes Niederschlagswasser Qr,a', value: fmtInput(s.rainFlow, 2), unit: 'l/s' }),
    selectField({ id: 'hasWc', label: 'WC angeschlossen', value: s.hasWc, options: yesNoOptions })
  ].join(''), 2);
}

export function createWastewaterViewModel(s = {}, r = {}) {
  return {
    usageHtml: usageFields(s),
    lineHtml: lineFields(s),
    fixtureInputHtml: fixtureInputFields(s),
    additionalFlowsHtml: additionalFlowFields(s)
  };
}

export default createWastewaterViewModel;
