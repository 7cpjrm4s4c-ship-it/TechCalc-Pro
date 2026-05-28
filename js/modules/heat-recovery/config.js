import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({
  id: 'heat-recovery',
  title: 'WRG / Mischluft',
  shortTitle: 'WRG',
  group: 'Lufttechnik',
  accent: 'cyan',
  order: 25,
  defaultVisible: false,

  migrationStatus: 'phase-8-schema-inventory',
  capabilities: [MODULE_CAPABILITIES.CENTRAL_NUMBER_SERVICE, MODULE_CAPABILITIES.FORM_SCHEMA],
  description: 'Berechnung von Wärmerückgewinnung und Mischluftzuständen in Lüftungsanlagen.'
});
