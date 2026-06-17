import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({
  id: 'buffer-storage',
  title: 'Pufferspeicher',
  shortTitle: 'Puffer',
  group: 'HLK-Anlagen',
  accent: 'cyan',
  order: 16,
  defaultVisible: false,

  capabilities: [MODULE_CAPABILITIES.CENTRAL_SAVED_RECORDS, MODULE_CAPABILITIES.FORM_SCHEMA, MODULE_CAPABILITIES.CENTRAL_NUMBER_SERVICE],
  description: 'Auslegung von Pufferspeichern für Kaltwassersätze, Wärmepumpen-Abtaubetrieb sowie Kälte-/Wärmevorlagen.'
});
