import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({ id:'unit-converter', title:'Einheitenrechner', shortTitle:'Einheiten', group:'Utilities', accent:'blue', order:40, defaultVisible:true, capabilities: [MODULE_CAPABILITIES.CENTRAL_NUMBER_SERVICE, MODULE_CAPABILITIES.FORM_SCHEMA], description:'Kategorie-basierte Umrechnung technischer Einheiten.' });
