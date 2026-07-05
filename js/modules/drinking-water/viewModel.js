import { calculate, CONSUMERS, BUILDING_TYPES } from './logic.js';
import { fmt } from '../../utils/calculations.js';
import { buildDrinkingWaterResultModel } from './results.js';

export function consumerOptions() {
  return CONSUMERS.map(c => ({ value: c.id, label: `${c.label} · ${fmt(c.vr, 2)} l/s${c.hotWater ? ' · TWW/TWK' : ' · nur TWK'}` }));
}

export function waterHeatingUi(mode = 'central') {
  const decentralized = mode === 'decentral';
  return {
    mode: decentralized ? 'decentral' : 'central',
    title: decentralized ? 'Dezentrale Warmwasserbereitung' : 'Zentrale Warmwasserbereitung',
    basisTitle: decentralized ? 'Berechnungsgrundlage — dezentral' : 'Berechnungsgrundlage — zentral',
    unitCardTitle: decentralized ? 'Nutzungseinheiten — dezentrale WW-Bereitung' : 'Nutzungseinheiten — zentrale TWW-Bereitung',
    singleCardTitle: decentralized ? 'Einzelverbraucher außerhalb NE — dezentral' : 'Einzelverbraucher außerhalb NE — zentral',
    unitConsumerLabel: decentralized ? 'Verbraucher hinzufügen (TWK + WW-Zuschlag)' : 'Verbraucher hinzufügen (TWK/TWW)',
    singleConsumerLabel: decentralized ? 'Verbraucher hinzufügen (TWK + WW-Zuschlag)' : 'Verbraucher hinzufügen (TWK/TWW)',
    warmWaterText: decentralized
      ? 'Dezentral: TWW-Verbraucher werden als WW-Bereitung mit 0,05 l/s berücksichtigt.'
      : 'Zentral: TWW-Zapfstellen werden zusätzlich zur Kaltwasserseite mitgerechnet.',
    unitHelp: decentralized
      ? 'TWW-Verbraucher erzeugen einen dezentralen WW-Bereitungszuschlag in der Vorschau und nach dem Speichern.'
      : 'TWW-Verbraucher werden bei zentraler Warmwasserbereitung als Trinkwarmwasser-Zapfstellen mitgeführt.',
    singleHelp: decentralized
      ? 'Freie TWW-Verbraucher werden dezentral mit 0,05 l/s für die WW-Bereitung angesetzt.'
      : 'Freie TWW-Verbraucher werden bei zentraler Warmwasserbereitung zusätzlich angesetzt.',
    consumerSuffixHot: decentralized ? 'TWK + WW-Bereitung' : 'TWK/TWW',
    resultTitle: decentralized ? 'Ergebnis — Trinkwasser dezentral' : 'Ergebnis — Trinkwasser zentral',
    fixtureTitle: decentralized ? 'Zusammenstellung Einrichtungsgegenstände — dezentral' : 'Zusammenstellung Einrichtungsgegenstände — zentral',
    fixtureEmpty: decentralized ? 'Noch keine Einrichtungsgegenstände für die dezentrale Berechnung ausgewählt' : 'Noch keine Einrichtungsgegenstände für die zentrale Berechnung ausgewählt'
  };
}

export function createDrinkingWaterViewModel(s = {}, result = calculate(s, { includeDrafts:false })){
  const waterHeating = waterHeatingUi(s.waterHeatingMode);
  const consumerOptionsBase = consumerOptions();
  return {
    state: s,
    result,
    savedUsageUnits: (result.usageUnits || []).filter(unit => !unit.transient),
    savedSingleGroups: (result.singleGroups || []).filter(group => !group.transient),
    accent: 'green',
    buildingOptions: BUILDING_TYPES.map(t => ({ value:t.id, label:t.label })),
    consumerOptions: consumerOptionsBase,
    waterHeating,
    resultModel: buildDrinkingWaterResultModel(s, result, 'blue')
  };
}

export default createDrinkingWaterViewModel;
