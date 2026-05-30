import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({
  id: 'rainwater',
  title: 'Regenwasser',
  shortTitle: 'Regenwasser',
  group: 'Sanitär',
  accent: 'green',
  order: 19,
  defaultVisible: false,

  migrationStatus: 'phase-14e-rainwater-global-workflow',
  capabilities: [MODULE_CAPABILITIES.CENTRAL_NUMBER_SERVICE, MODULE_CAPABILITIES.CENTRAL_SCROLL, MODULE_CAPABILITIES.CENTRAL_SAVED_RECORDS, MODULE_CAPABILITIES.FORM_SCHEMA],
  description: 'Vorbemessung von Regenwasser nach DIN 1986-100 mit Dach-/Grundstücksflächen, KOSTRA-Eingabe, Ablaufanzahl, Fallleitungsdimension und Notentwässerung.'
});
