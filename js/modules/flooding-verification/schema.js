import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';
import { areaTypes, dnOrder } from '../../shared/rainwaterDomainTables.js';

const KOSTRA_URL = 'https://www.openko.de';
const areaOptions = areaTypes.map(item => ({ value: item.id, label: item.name }));
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

export const floodingSurfaceSchema = defineFormSchema({
  fields: [
    { key: 'projectName', label: 'Bezeichnung', type: FIELD_TYPES.TEXT, placeholder: 'z. B. Grundstück Musterstraße 1' },
    { key: 'surfaceCategory', label: 'Flächengruppe', type: FIELD_TYPES.SEGMENT, options: categoryOptions, accent: 'green', action: 'platform:segment:surfaceCategory' },
    { key: 'surfaceAreaType', label: 'Flächenart', type: FIELD_TYPES.SELECT, options: areaOptions, commit: 'immediate', lookup: true },
    { key: 'surfaceArea', label: 'Fläche A', type: FIELD_TYPES.DECIMAL, unit: 'm²', default: '100' },
    { key: 'surfaceCs', label: 'Spitzenabflussbeiwert Cₛ', type: FIELD_TYPES.DECIMAL },
    { key: 'surfaceCm', label: 'Mittlerer Abflussbeiwert Cₘ', type: FIELD_TYPES.DECIMAL },
    { key: 'rainwaterImport', label: 'Dachflächen aus Regenwasser', type: FIELD_TYPES.ACTION, text: 'Dachflächen importieren', action: 'flooding:import-roofs', variant: 'primary' },
    { key: 'importStatus', label: 'Importstatus', type: FIELD_TYPES.NOTICE, text: state => state.importStatus || 'Der Import legt unabhängige Dachflächen im zentralen Flächenspeicher ab.', tone: 'compact' }
  ],
  groups: [
    { title: 'Projekt', fields: ['projectName'], columns: 1, accent: 'green' },
    { title: 'Flächen erfassen', fields: ['surfaceCategory', 'surfaceAreaType', 'surfaceArea', 'surfaceCs', 'surfaceCm', 'rainwaterImport', 'importStatus'], columns: 2, accent: 'green' }
  ]
});

export const floodingCalculationSchema = defineFormSchema({
  fields: [
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
    { key: 'meanSlopePercent', label: 'Mittlere Geländeneigung', type: FIELD_TYPES.DECIMAL, unit: '%', commit: 'immediate' },
    { key: 'rainDurationMode', label: 'Regendauer', type: FIELD_TYPES.SEGMENT, options: durationModeOptions, accent: 'green', action: 'platform:segment:rainDurationMode' },
    { key: 'manualRainDuration', label: 'Manuell verwendete Dauer', type: FIELD_TYPES.SELECT, options: durationOptions, commit: 'immediate', visibleWhen: state => state.rainDurationMode === 'manual' },
    { key: 'manualRainDurationReason', label: 'Begründung der Abweichung', type: FIELD_TYPES.TEXT, placeholder: 'Fachliche Begründung', visibleWhen: state => state.rainDurationMode === 'manual' },
    { key: 'durationNotice', label: 'Automatische Regendauer', type: FIELD_TYPES.NOTICE, text: 'Die Zuordnung verwendet die mittlere Geländeneigung und den Anteil aller als befestigt klassifizierten Dach- und Grundstücksflächen an der erfassten Gesamtfläche.', tone: 'compact' },
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
    { key: 'dischargeNotice', label: 'Tabellenzuordnung', type: FIELD_TYPES.NOTICE, text: 'Tabellenwerte werden nur für exakt hinterlegte Gefälle in Prozent verwendet. Es erfolgt keine stille Interpolation.', tone: 'compact', visibleWhen: tableMode },
    { key: 'retentionRecurrenceFrequencyPerYear', label: 'Überschreitungshäufigkeit n', type: FIELD_TYPES.DECIMAL, unit: '1/a', visibleWhen: authorityMode },
    { key: 'retentionFlowTimeMinutes', label: 'Fließzeit tf', type: FIELD_TYPES.DECIMAL, unit: 'min', visibleWhen: authorityMode },
    { key: 'retentionSurchargeFactorFz', label: 'Zuschlagsfaktor fz', type: FIELD_TYPES.DECIMAL, visibleWhen: authorityMode },
    { key: 'retentionReductionFactorFa', label: 'Abminderungsfaktor fA', type: FIELD_TYPES.DECIMAL, visibleWhen: authorityMode },
    { key: 'retentionDryWeatherFlowLs', label: 'Trockenwetterabfluss', type: FIELD_TYPES.DECIMAL, unit: 'l/s', visibleWhen: authorityMode },
    { key: 'retentionUpstreamThrottleFlowLs', label: 'Vorgeschalteter Drosselabfluss', type: FIELD_TYPES.DECIMAL, unit: 'l/s', visibleWhen: authorityMode },
    { key: 'retentionRainDuration5', label: 'r(5,n)', type: FIELD_TYPES.DECIMAL, unit: 'l/(s·ha)', visibleWhen: authorityMode },
    { key: 'retentionRainDuration10', label: 'r(10,n)', type: FIELD_TYPES.DECIMAL, unit: 'l/(s·ha)', visibleWhen: authorityMode },
    { key: 'retentionRainDuration15', label: 'r(15,n)', type: FIELD_TYPES.DECIMAL, unit: 'l/(s·ha)', visibleWhen: authorityMode },
    { key: 'retentionNotice', label: 'DWA-A 117', type: FIELD_TYPES.NOTICE, text: 'Bei behördlicher Einleitungsbegrenzung wird der einfache Rückhalteraumnachweis automatisch aktiviert. Die Berechnung startet, sobald alle Pflichtwerte und geprüften Regenspenden vorliegen.', tone: 'compact', visibleWhen: authorityMode }
  ],
  groups: [
    { title: 'Regenspenden', fields: ['rainR2Duration5', 'rainR2Duration10', 'rainR2Duration15', 'rainR30Duration5', 'rainR30Duration10', 'rainR30Duration15', 'rainR100Duration5'], columns: 2, accent: 'green', actions: [{ label: 'KOSTRA / OpenKo Daten öffnen', href: KOSTRA_URL, variant: 'secondary' }] },
    { title: 'Quellenangaben Regendaten', fields: ['rainSourceDataset', 'rainSourceLocation', 'rainSourceVersion'], columns: 2, accent: 'green' },
    { title: 'Gelände und Regendauer', fields: ['meanSlopePercent', 'rainDurationMode', 'manualRainDuration', 'manualRainDurationReason', 'durationNotice'], columns: 2, accent: 'green' },
    { title: 'Leitungs- und Abflussnachweis', fields: ['dischargeMode', 'pipeNominalDiameterDn', 'pipeSlopePercent', 'manualFullFlowLs', 'manualFullFlowSource', 'authorityLimitLs', 'authorityName', 'authorityReference', 'authorityDate', 'authoritySourceNote', 'dischargeNotice'], columns: 2, accent: 'green' },
    { title: 'Rückhalteraumnachweis nach DWA-A 117', fields: ['retentionRecurrenceFrequencyPerYear', 'retentionFlowTimeMinutes', 'retentionSurchargeFactorFz', 'retentionReductionFactorFa', 'retentionDryWeatherFlowLs', 'retentionUpstreamThrottleFlowLs', 'retentionRainDuration5', 'retentionRainDuration10', 'retentionRainDuration15', 'retentionNotice'], columns: 2, accent: 'green', visibleWhen: authorityMode }
  ]
});

export const floodingVerificationSchema = floodingCalculationSchema;
export default floodingVerificationSchema;
