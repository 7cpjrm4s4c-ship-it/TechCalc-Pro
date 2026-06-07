import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({ id:'unit-converter', title:'Einheitenrechner', shortTitle:'Einheiten', group:'Utilities', accent:'green', order:40, defaultVisible:true, migrationStatus: 'phase-8-schema-inventory phase-22b1-platform-mount phase-22b1-render-fix phase-22b3-result-renderer phase-22c-dynamic-renderer', capabilities: [MODULE_CAPABILITIES.CENTRAL_NUMBER_SERVICE, MODULE_CAPABILITIES.FORM_SCHEMA], description:'Kategorie-basierte Umrechnung technischer Einheiten.' });
