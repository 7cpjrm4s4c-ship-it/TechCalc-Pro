import { branchConnectionTable, stackTable, hydraulicTables, dnOrder, fixtureTypes, usageTypes } from './tables.js';

export const toNumber = value => {
  const n = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

export function getFixture(typeId) {
  return fixtureTypes.find(item => item.id === typeId) || fixtureTypes[0];
}

export function normalizeK(state) {
  if (state.usageType !== 'custom') {
    const usage = usageTypes.find(item => item.value === state.usageType);
    if (usage?.k) return usage.k;
  }
  return Math.max(0, toNumber(state.kValue));
}

function fixtureRows(fixtures = []) {
  return fixtures.map(item => {
    const base = getFixture(item.typeId);
    const qty = Math.max(0, Math.round(toNumber(item.quantity || 1)) || 0);
    const du = base.custom ? Math.max(0, toNumber(item.customDu)) : base.du;
    const name = base.custom ? (item.customName || 'Freier Gegenstand') : base.name;
    const dn = base.custom ? (item.customDn || '—') : base.dn;
    return { ...item, base, name, dn, qty, du, totalDu: qty * du, wc: Boolean(base.wc) };
  });
}

function chooseBranchConnection(sumDu, k) {
  const key = k >= 1 ? 'k10' : k >= 0.7 ? 'k07' : 'k05';
  return branchConnectionTable.find(row => sumDu <= row[key]) || branchConnectionTable.at(-1);
}

function chooseStack(qtot, branchType, hasWc) {
  const key = branchType === 'without-radius' ? 'noRadius' : 'withRadius';
  return stackTable.find(row => {
    if (hasWc && ['DN 60', 'DN 70'].includes(row.dn)) return false;
    return qtot <= row[key];
  }) || stackTable.at(-1);
}

function chooseHydraulic(qtot, fillRatio, slopeCmM, lineType) {
  const table = hydraulicTables[String(fillRatio)] || hydraulicTables['0.5'];
  const slope = toNumber(slopeCmM);
  const row = table.find(item => item.slope >= slope) || table.at(-1);
  const minDn = lineType === 'ground-outside' ? 'DN 80' : 'DN 70';
  const minIndex = Math.max(0, dnOrder.indexOf(minDn));
  const chosenDn = dnOrder.slice(minIndex).find(name => (row?.values?.[name] || 0) >= qtot);
  return { dn: chosenDn || dnOrder.at(-1), slope: row?.slope || slope, capacity: row?.values?.[chosenDn] || null };
}

function validate(state, totals, selected) {
  const warnings = [];
  const length = toNumber(state.pipeLengthM);
  const bends = toNumber(state.bends90);
  const slope = toNumber(state.slopeCmM);
  const lineType = state.lineType;

  if (!totals.fixtures.length) warnings.push('Noch keine Entwässerungsgegenstände erfasst.');
  if (totals.qww < totals.largestDu && totals.largestDu > 0) warnings.push('Qww ist kleiner als der größte Einzelanschlusswert. Maßgebend ist der größte angeschlossene DU-Wert.');
  if (lineType === 'single-unvented') {
    if (length > 4) warnings.push('Unbelüftete Einzelanschlussleitungen dürfen höchstens 4 m lang sein.');
    if (slope < 1) warnings.push('Mindestgefälle unbelüfteter Einzelanschlussleitungen: 1 cm/m.');
    if (bends > 3) warnings.push('Innerhalb eines Fließwegs sind maximal drei 90°-Umlenkungen zulässig.');
  }
  if (lineType === 'single-vented') {
    if (length > 10) warnings.push('Belüftete Einzelanschlussleitungen dürfen höchstens 10 m lang sein.');
    if (slope < 0.5) warnings.push('Mindestgefälle belüfteter Einzelanschlussleitungen: 0,5 cm/m.');
  }
  if (lineType === 'branch-unvented') {
    if (slope < 1) warnings.push('Mindestgefälle unbelüfteter Sammelanschlussleitungen: 1 cm/m.');
    if (length > (selected?.maxLength || 0)) warnings.push(`Maximale Rohrlänge für ${selected?.dn || 'gewählte DN'} überschritten.`);
  }
  if (lineType === 'collector') {
    if (slope < 0.5) warnings.push('Sammelleitungen innerhalb des Gebäudes: Mindestgefälle 0,5 cm/m und v ≥ 0,5 m/s prüfen.');
  }
  if (lineType === 'ground-outside') {
    if (slope < 1) warnings.push('Grundleitungen außerhalb des Gebäudes: Mindestgefälle 1 cm/m, v ≥ 0,7 m/s und vmax 2,5 m/s prüfen.');
  }
  return warnings;
}

export function calculate(state) {
  const fixtures = fixtureRows(state.fixtures || []);
  const sumDu = fixtures.reduce((sum, item) => sum + item.totalDu, 0);
  const largestDu = Math.max(0, ...fixtures.map(item => item.du));
  const k = normalizeK(state);
  const qwwFormula = k * Math.sqrt(sumDu);
  const qww = Math.max(qwwFormula, largestDu);
  const qc = toNumber(state.continuousFlow);
  const qp = toNumber(state.pumpFlow);
  const qra = toNumber(state.rainFlow);
  const qtot = qww + qc + qp + qra;
  const hasWc = fixtures.some(item => item.wc) || state.hasWc === 'yes';
  let selected = null;
  let dimensionBasis = '';

  if (state.lineType === 'branch-unvented') {
    selected = chooseBranchConnection(sumDu, k);
    dimensionBasis = 'Tabelle 7 · unbelüftete Sammelanschlussleitung';
  } else if (state.lineType === 'stack') {
    selected = chooseStack(qtot, state.branchType, hasWc);
    dimensionBasis = 'Tabelle 8 · Fallleitung mit Hauptlüftung';
  } else if (['collector', 'ground-inside', 'ground-outside', 'ground-full'].includes(state.lineType)) {
    selected = chooseHydraulic(qtot, state.fillRatio, state.slopeCmM, state.lineType);
    dimensionBasis = `Tabelle A.${state.fillRatio === '0.5' ? '3' : state.fillRatio === '0.7' ? '4' : '5'} · h/di=${state.fillRatio}`;
  } else {
    const maxDn = fixtures.map(item => item.dn).filter(Boolean).at(0) || '—';
    selected = { dn: maxDn, maxLength: state.lineType === 'single-unvented' ? 4 : 10 };
    dimensionBasis = state.lineType === 'single-vented' ? 'Einzelanschlussleitung belüftet' : 'Einzelanschlussleitung unbelüftet';
  }

  const warnings = validate(state, { fixtures, qww, largestDu }, selected);
  if (qtot <= 0) warnings.push('Qtot ist 0 l/s. Eingaben prüfen.');

  return { fixtures, sumDu, largestDu, k, qwwFormula, qww, qc, qp, qra, qtot, hasWc, selected, dimensionBasis, warnings };
}
