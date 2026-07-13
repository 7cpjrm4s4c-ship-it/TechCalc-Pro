import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';
import { areaTypes } from '../rainwater/tables.js';

const areaOptions = areaTypes.map(item => ({ value: item.id, label: item.name }));
const categoryOptions = [
  { value: 'roof', label: 'Dachfläche' },
  { value: 'property', label: 'Grundstücksfläche' }
];

function surfaceItems(state = {}) {
  return (Array.isArray(state.surfaces) ? state.surfaces : []).map(item => ({
    id: item.id,
    title: item.name || 'Fläche',
    quantity: item.area,
    subtitle: `${item.category === 'property' ? 'Grundstück' : 'Dach'} · ${String(item.cs).replace('.', ',')} Cₛ · ${item.areaType}`
  }));
}

export const floodingVerificationSchema = defineFormSchema({
  fields: [
    { key: 'projectName', label: 'Bezeichnung', type: FIELD_TYPES.TEXT, placeholder: 'z. B. Grundstück Musterstraße 1' },
    { key: 'calculationMode', label: 'Nachweisart', type: FIELD_TYPES.SEGMENT, options: [
      { value: 'flooding', label: 'Überflutung' },
      { value: 'retention', label: 'Rückhaltung' }
    ], accent: 'green', action: 'platform:segment:calculationMode' },
    { key: 'surfaceCategory', label: 'Flächengruppe', type: FIELD_TYPES.SEGMENT, options: categoryOptions, accent: 'green', action: 'platform:segment:surfaceCategory' },
    { key: 'surfaceName', label: 'Bezeichnung', type: FIELD_TYPES.TEXT, placeholder: 'z. B. Dachfläche Nord' },
    { key: 'surfaceAreaType', label: 'Flächenart', type: FIELD_TYPES.SELECT, options: areaOptions, commit: 'immediate', lookup: true },
    { key: 'surfaceArea', label: 'Fläche A', type: FIELD_TYPES.DECIMAL, unit: 'm²', default: '100' },
    { key: 'surfaceCs', label: 'Spitzenabflussbeiwert Cₛ', type: FIELD_TYPES.DECIMAL },
    { key: 'surfaceCm', label: 'Mittlerer Abflussbeiwert Cₘ', type: FIELD_TYPES.DECIMAL },
    { key: 'surfaceAdd', label: 'Fläche hinzufügen', type: FIELD_TYPES.ACTION, text: 'Fläche hinzufügen', collection: 'surfaces', variant: 'primary' },
    { key: 'surfaces', label: 'Erfasste Flächen', type: FIELD_TYPES.COLLECTION, collection: 'surfaces', items: surfaceItems, emptyText: 'Noch keine Dach- oder Grundstücksflächen erfasst.', quantityLabel: 'Fläche', quantityUnit: 'm²' },
    { key: 'rainwaterImport', label: 'Aus Regenwasser übernehmen', type: FIELD_TYPES.ACTION, text: 'Flächen-Snapshot importieren', collection: 'rainwaterImport', variant: 'secondary' },
    { key: 'importStatus', label: 'Importstatus', type: FIELD_TYPES.NOTICE, text: state => state.importStatus || 'Der Import erzeugt unabhängige Deep-Copy-Flächen. Bestehende lokale Änderungen werden nicht überschrieben.', tone: 'compact' }
  ],
  groups: [
    { title: 'Projekt', fields: ['projectName', 'calculationMode'], columns: 2, accent: 'green' },
    { title: 'Flächen erfassen', fields: ['surfaceCategory', 'surfaceName', 'surfaceAreaType', 'surfaceArea', 'surfaceCs', 'surfaceCm', 'surfaceAdd'], columns: 2, accent: 'green' },
    { title: 'Dach- und Grundstücksflächen', fields: ['surfaces'], columns: 1, accent: 'green' },
    { title: 'Snapshot-Import Regenwasser', fields: ['rainwaterImport', 'importStatus'], columns: 1, accent: 'green' }
  ]
});

export default floodingVerificationSchema;
