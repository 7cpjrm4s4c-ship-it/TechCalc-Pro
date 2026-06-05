import { defineModuleConfig, MODULE_CAPABILITIES } from '../../core/moduleDefinition.js';

export default defineModuleConfig({ id:'heating-cooling', title:'Heizung / Kälte', shortTitle:'Heizung', group:'HLK-Anlagen', accent:'orange', order:10, defaultVisible:true, migrationStatus: 'phase-12h-final-globalized phase-18b1-result-model phase-18b2-line-section-controller phase-18b3-dynamic-renderer', capabilities: [MODULE_CAPABILITIES.CENTRAL_NUMBER_SERVICE, MODULE_CAPABILITIES.FORM_SCHEMA], description:'Leistung, Massenstrom und Temperaturspreizung für wassergeführte Systeme.' });
