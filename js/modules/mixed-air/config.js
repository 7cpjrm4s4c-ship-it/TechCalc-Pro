import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({
  id: 'mixed-air',
  title: 'Mischluft',
  shortTitle: 'Mischluft',
  group: 'Lufttechnik',
  accent: 'cyan',
  order: 26,
  defaultVisible: false,
  capabilities: [
    MODULE_CAPABILITIES.CENTRAL_NUMBER_SERVICE,
    MODULE_CAPABILITIES.FORM_SCHEMA
  ],
  description: 'Berechnung von Mischluftzuständen aus Außenluft und Umluft.'
});
