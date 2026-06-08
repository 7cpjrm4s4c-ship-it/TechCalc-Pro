import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({
  id: 'heat-recovery',
  title: 'WRG / Mischluft',
  shortTitle: 'WRG',
  group: 'Lufttechnik',
  accent: 'cyan',
  order: 25,
  defaultVisible: false,

  migrationStatus: 'phase-24b2-result-renderer-dynamic-islands phase-24b3-dynamic-controller-hardening phase-24c-platform-contract-finalization phase-24d-hardening phase-24d1-global-spacing-fix',
  capabilities: [
    MODULE_CAPABILITIES.CENTRAL_NUMBER_SERVICE,
    MODULE_CAPABILITIES.FORM_SCHEMA,
    MODULE_CAPABILITIES.CENTRAL_SAVED_RECORDS
  ],
  description: 'Berechnung von Wärmerückgewinnung und Mischluftzuständen in Lüftungsanlagen.'
});
