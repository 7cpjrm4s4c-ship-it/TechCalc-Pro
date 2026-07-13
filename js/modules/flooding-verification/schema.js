import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';

export const floodingVerificationSchema = defineFormSchema({
  fields: [
    { key: 'projectName', label: 'Bezeichnung', type: FIELD_TYPES.TEXT, placeholder: 'z. B. Grundstück Musterstraße 1' },
    { key: 'calculationMode', label: 'Nachweisart', type: FIELD_TYPES.SEGMENT, options: [
      { value: 'flooding', label: 'Überflutung' },
      { value: 'retention', label: 'Rückhaltung' }
    ], accent: 'green', action: 'platform:segment:calculationMode' },
    { key: 'phaseNotice', label: 'Implementierungsstand', type: FIELD_TYPES.NOTICE, text: 'Phase 47C.1 stellt Modulrouting, State v2, Persistenz und Ergebnisstruktur bereit. Flächen- und Regenlogik folgen in 47C.2 und 47C.3.', tone: 'compact' }
  ],
  groups: [
    { title: 'Projekt', fields: ['projectName', 'calculationMode'], columns: 2, accent: 'green' },
    { title: 'Modulstatus', fields: ['phaseNotice'], columns: 1, accent: 'green' }
  ]
});

export default floodingVerificationSchema;
