import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({
  id: 'wastewater',
  title: 'Schmutzwasser',
  shortTitle: 'Schmutzwasser',
  group: 'Sanitär',
  accent: 'green',
  order: 18,
  defaultVisible: false,

  migrationStatus: 'phase-2-centralized',
  capabilities: [MODULE_CAPABILITIES.CENTRAL_NUMBER_SERVICE, MODULE_CAPABILITIES.CENTRAL_SCROLL, MODULE_CAPABILITIES.CENTRAL_SAVED_RECORDS],
  description: 'Vorbemessung von Schmutzwasserleitungen nach DIN 1986-100 mit DU-Summierung, Leitungstypen, DN-Auswahl und Plausibilitätsprüfung.'
});
