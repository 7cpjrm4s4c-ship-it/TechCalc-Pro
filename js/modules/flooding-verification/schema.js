import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';
import { areaTypes, dnOrder } from '../../shared/rainwaterDomainTables.js';
import { hasRainwaterSurfaceSnapshot } from '../../shared/rainwaterSurfaceSnapshot.js';

const KOSTRA_URL = 'https://www.openko.de';
const areaOptions = areaTypes.map(item => ({ value: item.id, label: item.name }));
const areaTypeById = new Map(areaTypes.map(item => [item.id, item]));
const categoryOptions = [{ value: 'roof', label: 'Dachfläche' }, { value: 'property', label: 'Grundstücksfläche' }];
const durationModeOptions = [{ value: 'automatic', label: 'Automatisch' }, { value: 'manual', label: 'Manuell' }];
const durationOptions = [{ value: '5', label: '5 min' }, { value: '10', label: '10 min' }, { value: '15', label: '15 min' }];
const dischargeModeOptions = [
  { value: 'table-existing-pipe', label: 'Prüfen' },
  { value: 'table-size-pipe', label: 'Dimensionieren' },
  { value: 'manual-full-flow', label: 'Qvoll manuell' },
  { value: 'authority-discharge-limit', label: 'Begrenzung' }
];
const dnOptions = dnOrder.map(value => ({ value, label: value }));
const slopeOptions = [0.2,0.3,0.4,0.5,0.6,0.7,0.8,1.0,1.5,2.0,3.0,5.0]
  .map(value => ({ value: String(value).replace('.', ','), label: `${String(value).replace('.', ',')} %` }));
const tableMode = state => ['table-existing-pipe', 'table-size-pipe'].includes(state.dischargeMode);
const existingPipeMode = state => state.dischargeMode === 'table-existing-pipe';
const manualFlowMode = state => state.dischargeMode === 'manual-full-flow';
const authorityMode = state => state.dischargeMode === 'authority-discharge-limit';

export function surfaceCollectionItems(state = {}) {
  return (Array.isArray(state.surfaces) ? state.surfaces : []).map(item => {
    const categoryLabel = item.category === 'property' ? 'Grundstücksfläche' : 'Dachfläche';
    const areaTypeLabel = areaTypeById.get(item.areaType)?.name || 'Freie Fläche';
    return {
      id: item.id,
      title: item.name || 'Fläche',
      quantity: item.area,
      subtitle: `${categoryLabel} · Cₛ ${String(item.cs).replace('.', ',')} · ${areaTypeLabel}`
    };
  });
}

export const floodingVerificationSchema = defineFormSchema({
  fields: [
    { key: 'projectName', label: 'Bezeichnung', type: FIELD_TYPES.TEXT, placeholder: 'z. B. Grundstück Musterstraße 1' },
    { key: 'surfaceCategory', label: 'Flächengruppe', type: FIELD_TYPES.SEGMENT, options: categoryOptions, accent: 'green', action: 'platform:segment:surfaceCategory' },
    { key: 'surfaceName', label: 'Bezeichnung', type: FIELD_TYPES.TEXT, placeholder: 'z. B. Dachfläche Nord' },
    { key: 'surfaceAreaType', label: 'Flächenart', type: FIELD_TYPES.SELECT, options: areaOptions, commit: 'immediate', lookup: true },
    { key: 'surfaceArea', label: 'Fläche A', type: FIELD_TYPES.DECIMAL, unit: 'm²', default: '100' },
    { key: 'surfaceCs', label: 'Spitzenabflussbeiwert Cₛ', type: FIELD_TYPES.DECIMAL },
    { key: 'surfaceCm', label: 'Mittlerer Abflussbeiwert Cₘ', type: FIELD_TYPES.DECIMAL },
    { key: 'surfaceAdd', label: state => state.activeSurfaceId ? 'Fläche aktualisieren' : 'Fläche hinzufügen', type: FIELD_TYPES.ACTION, text: state => state.activeSurfaceId ? 'Fläche aktualisieren' : 'Fläche hinzufügen', collection: 'surfaces', variant: 'primary' },
    { key: 'surfaces', label: 'Erfasste Flächen', type: FIELD_TYPES.COLLECTION, collection: 'surfaces', editCollection: 'surfacesEdit', items: surfaceCollectionItems, emptyText: 'Noch keine Dach- oder Grundstücksflächen erfasst.', quantityLabel: 'Fläche', quantityUnit: 'm²', editable: true, editLabel: 'Fläche vollständig bearbeiten' },
    { key: 'rainwaterImport', label: 'Aus Regenwasser übernehmen', type: FIELD_TYPES.ACTION, text: 'Flächen-Snapshot importieren', collection: 'rainwaterImport', variant: 'secondary', disabled: () => !hasRainwaterSurfaceSnapshot() },
    { key: 'importStatus', label: 'Importstatus', type: FIELD_TYPES.NOTICE, text: state => state.importStatus || 'Der Import erzeugt unabhängige Deep-Copy-Flächen. Bestehende lokale Änderungen werden nicht überschrieben.', tone: 'compact' },
    { key: 'rainR2Duration5', label: 'r(5,2)', type: FIELD_TYPES.DECIMAL, unit: 'l/(s·ha)' },
    { key: 'rainR2Duration10', label: 'r(10,2)', type: FIELD_TYPES.DECIMAL, unit: 'l/(s·ha)' },
    { key: 'rainR2Duration15', label: 'r(15,2)', type: FIELD_TYPES.DECIMAL, unit: 'l/(s·ha)' },
    { key: 'rainR30Duration5', label: 'r(5,30)', type: FIELD_TYPES.DECIMAL, unit: 'l/(s·ha)' },
    { key: 'rainR30Duration10', label: 'r(10,30)', type: FIELD_TYPES.DECIMAL, unit: 'l/(s·ha)' },
    { key: 'rainR30Duration15', label: 'r(15,30)', type: FIELD_TYPES.DECIMAL, unit: 'l/(s·ha)' },
    { key: 'rainR100Duration5', label: 'r(5,100) optional', type: FIELD_TYPES.DECIMAL, unit: 'l/(s·ha)' },
    { key: 'rainSourceDataset', label: 'Datensatz', type: FIELD_TYPES.TEXT, placeholder: 'z. B. KOSTRA-DWD' },
    { key: 'rainSourceLocation', label: 'Raster / Ort', type: FIELD_TYPES.TEXT, placeholder: 'Rasterzelle oder Standort' },
    { key: 'rainSourceVersion', label: 'Datenversion', type: FIELD_TYPES.TEXT, placeholder: 'z. B. KOSTRA-DWD 2020' },
    { key: 'meanSlopePercent', label: 'Mittlere Geländeneigung', type: FIELD_TYPES.DECIMAL, unit: '%' },
    { key: 'rainDurationMode', label: 'Regendauer', type: FIELD_TYPES.SEGMENT, options: durationModeOptions, accent: 'green', action: 'platform:segment:rainDurationMode' },
    { key: 'manualRainDuration', label: 'Manuell verwendete Dauer', type: FIELD_TYPES.SELECT, options: durationOptions, commit: 'immediate', visibleWhen: state => state.rainDurationMode === 'manual' },
    { key: 'manualRainDurationReason', label: 'Begründung der Abweichung', type: FIELD_TYPES.TEXT, placeholder: 'Fachliche Begründung', visibleWhen: state => state.rainDurationMode === 'manual' },
    { key: 'durationNotice', label: 'Automatische Regendauer', type: FIELD_TYPES.NOTICE, text: 'Die automatische Zuordnung folgt ausschließlich der im Contract dokumentierten DIN-Zuordnung auf Basis von Geländeneigung und befestigtem Flächenanteil.', tone: 'compact' },
    { key: 'dischargeMode', label: 'Betriebsart', type: FIELD_TYPES.SEGMENT, options: dischargeModeOptions, accent: 'green', action: 'platform:segment:dischargeMode' },
    { key: 'pipeNominalDiameterDn', label: 'Nennweite', type: FIELD_TYPES.SELECT, options: dnOptions, visibleWhen: existingPipeMode },
    { key: 'pipeSlopePercent', label: 'Gefälle', type: FIELD_TYPES.SELECT, options: slopeOptions, commit: 'immediate', visibleWhen: tableMode },
    { key: 'manualFullFlowLs', label: 'Vollfüllungsabfluss Qvoll', type: FIELD_TYPES.DECIMAL, unit: 'l/s', visibleWhen: manualFlowMode },
    { key: 'manualFullFlowSource', label: 'Quelle / Nachweis', type: FIELD_TYPES.TEXT, visibleWhen: manualFlowMode },
    { key: 'authorityLimitLs', label: 'Maximale Einleitungsmenge', type: FIELD_TYPES.DECIMAL, unit: 'l/s', visibleWhen: authorityMode },
    { key: 'authorityName', label: 'Behörde', type: FIELD_TYPES.TEXT, visibleWhen: authorityMode },
    { key: 'authorityReference', label: 'Aktenzeichen / Referenz', type: FIELD_TYPES.TEXT, visibleWhen: authorityMode },
    { key: 'authorityDate', label: 'Datum', type: FIELD_TYPES.TEXT, placeholder: 'TT.MM.JJJJ', visibleWhen: authorityMode },
    { key: 'authoritySourceNote', label: 'Begründung / Quellenhinweis', type: FIELD_TYPES.TEXT, visibleWhen: authorityMode },
    { key: 'dischargeNotice', label: 'Tabellenzuordnung', type: FIELD_TYPES.NOTICE, text: 'Tabellenwerte werden nur für exakt hinterlegte Gefälle in Prozent verwendet. Es erfolgt keine stille Interpolation.', tone: 'compact', visibleWhen: tableMode }
  ],
  groups: [
    { title: 'Projekt', fields: ['projectName'], columns: 1, accent: 'green' },
    { title: 'Flächen erfassen', fields: ['surfaceCategory', 'surfaceName', 'surfaceAreaType', 'surfaceArea', 'surfaceCs', 'surfaceCm', 'surfaceAdd'], columns: 2, accent: 'green' },
    { title: 'Dach- und Grundstücksflächen', fields: ['surfaces'], columns: 1, accent: 'green' },
    { title: 'Snapshot-Import Regenwasser', fields: ['rainwaterImport', 'importStatus'], columns: 1, accent: 'green' },
    { title: 'Regenspenden', fields: ['rainR2Duration5', 'rainR2Duration10', 'rainR2Duration15', 'rainR30Duration5', 'rainR30Duration10', 'rainR30Duration15', 'rainR100Duration5'], columns: 2, accent: 'green', actions: [{ label: 'KOSTRA / OpenKo Daten öffnen', href: KOSTRA_URL, variant: 'secondary' }] },
    { title: 'Quellenangaben Regendaten', fields: ['rainSourceDataset', 'rainSourceLocation', 'rainSourceVersion'], columns: 2, accent: 'green' },
    { title: 'Gelände und Regendauer', fields: ['meanSlopePercent', 'rainDurationMode', 'manualRainDuration', 'manualRainDurationReason', 'durationNotice'], columns: 2, accent: 'green' },
    { title: 'Leitungs- und Abflussnachweis', fields: ['dischargeMode', 'pipeNominalDiameterDn', 'pipeSlopePercent', 'manualFullFlowLs', 'manualFullFlowSource', 'authorityLimitLs', 'authorityName', 'authorityReference', 'authorityDate', 'authoritySourceNote', 'dischargeNotice'], columns: 2, accent: 'green' }
  ]
});

export default floodingVerificationSchema;
