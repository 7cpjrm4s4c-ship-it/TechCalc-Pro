import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';

const option = (value, label) => Object.freeze({ value, label });
const yesNoUnknownOptions = Object.freeze([option('', 'Nicht angegeben'), option('yes', 'Ja'), option('no', 'Nein')]);
const applicationTypeOptions = Object.freeze([option('refrigeration', 'Kälteanlage'), option('air-conditioning', 'Klimaanlage'), option('heat-pump', 'Wärmepumpe')]);
const installationTypeOptions = Object.freeze([option('stationary', 'Ortsfest'), option('mobile', 'Mobil')]);
const mobileEquipmentTypeOptions = Object.freeze([
  option('', 'Nicht angegeben'), option('refrigerated-truck-trailer', 'Kühllastkraftfahrzeug / Kühlanhänger'),
  option('light-refrigerated-intermodal-rail', 'Leichtes Kühlfahrzeug / intermodaler Container / Eisenbahnkühlwaggon'),
  option('mobile-ac-heat-pump-heavy-etc', 'Mobile Klima-/Wärmepumpe in schwerem Nutzfahrzeug, Lieferwagen, mobiler Maschine, Zug oder Luftfahrzeug')
]);
const productCategoryOptions = Object.freeze([
  option('household-refrigerator-freezer', 'Haushaltskühl-/Gefriergerät'), option('commercial-self-contained-refrigerator-freezer', 'Gewerbliches in sich geschlossenes Kühl-/Gefriergerät'),
  option('self-contained-refrigeration-system', 'In sich geschlossene Kälteanlage'), option('other-refrigeration-system', 'Sonstige Kälteanlage'),
  option('centralized-commercial-refrigeration-system', 'Mehrteilige zentralisierte gewerbliche Kälteanlage'), option('stationary-chiller', 'Ortsfester Kühler'),
  option('self-contained-ac-heat-pump', 'In sich geschlossenes Klima-/Wärmepumpensystem'), option('split-ac-heat-pump', 'Split-Klima-/Wärmepumpensystem'),
  option('direct-evaporation-system', 'Nichtgeschlossenes Direktverdampfungssystem')
]);
const constructionTypeOptions = Object.freeze([
  option('self-contained', 'In sich geschlossen'), option('portable', 'Tragbar / steckerfertig'), option('monoblock', 'Monoblock'), option('split', 'Split'),
  option('mono-split', 'Mono-Split'), option('centralized', 'Zentralisiert'), option('cascade', 'Kaskadensystem'), option('other', 'Sonstige Bauform')
]);
const splitTypeOptions = Object.freeze([option('', 'Nicht angegeben'), option('air-water', 'Luft-Wasser'), option('air-air', 'Luft-Luft'), option('other', 'Sonstiges Split-System')]);
const plannedActivityOptions = Object.freeze([
  option('installation', 'Installation'), option('maintenance', 'Wartung / Instandhaltung'), option('repair', 'Reparatur'),
  option('leak-check', 'Dichtheitskontrolle'), option('recovery', 'Rückgewinnung'), option('decommissioning', 'Außerbetriebnahme')
]);
const refrigerantOriginOptions = Object.freeze([option('', 'Nicht angegeben'), option('new', 'Neu'), option('reclaimed', 'Aufgearbeitet'), option('recycled', 'Recycelt')]);
const certificationStatusOptions = Object.freeze([option('', 'Nicht geprüft'), option('verified', 'Nachgewiesen'), option('not-verified', 'Nicht nachgewiesen'), option('not-applicable', 'Nicht anwendbar')]);
const isSplitSystem = state => ['split', 'mono-split'].includes(state?.constructionType) || state?.productCategory === 'split-ac-heat-pump';
const isStockAssessment = state => state?.plannedActivity !== 'installation';

function formatGermanDateInput(value) {
  const raw = String(value ?? '').trim();
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return iso ? `${iso[3]}.${iso[2]}.${iso[1]}` : raw;
}

const schema = defineFormSchema({
  version: 5,
  fields: [
    { key: 'systemName', label: 'Anlagenbezeichnung', type: FIELD_TYPES.TEXT },
    { key: 'applicationType', label: 'Anlagenart', type: FIELD_TYPES.SELECT, options: applicationTypeOptions },
    { key: 'installationType', label: 'Aufstellung', type: FIELD_TYPES.SELECT, options: installationTypeOptions },
    { key: 'mobileEquipmentType', label: 'Art der mobilen Einrichtung', type: FIELD_TYPES.SELECT, options: mobileEquipmentTypeOptions, visibleWhen: { installationType: 'mobile' } },
    { key: 'productCategory', label: 'Produkt-/Anlagenkategorie', type: FIELD_TYPES.SELECT, options: productCategoryOptions },
    { key: 'constructionType', label: 'Bauform', type: FIELD_TYPES.SELECT, options: constructionTypeOptions },
    { key: 'splitType', label: 'Split-Systemart', type: FIELD_TYPES.SELECT, options: splitTypeOptions, visibleWhen: isSplitSystem },
    { key: 'performanceRange', label: 'Leistungsbereich (optional)', type: FIELD_TYPES.TEXT, placeholder: 'z. B. 12–50 kW; nur zur Dokumentation' },
    { key: 'performanceRangeInfo', label: 'Hinweis zum Leistungsbereich', type: FIELD_TYPES.NOTICE, text: 'Der Leistungsbereich ist eine optionale Dokumentationsangabe. Für die regulatorische Prüfung der Leistungsgrenzen wird ausschließlich die Nennleistung in kW verwendet.', tone: 'compact' },
    { key: 'ratedCapacityKw', label: 'Nennleistung', type: FIELD_TYPES.DECIMAL, unit: 'kW' },
    { key: 'refrigerantId', label: 'Kältemittel', type: FIELD_TYPES.SELECT, options: [] },
    { key: 'chargeKg', label: 'Füllmenge', type: FIELD_TYPES.DECIMAL, unit: 'kg' },
    { key: 'placedOnMarketDate', label: 'Erstmaliges Inverkehrbringen', type: FIELD_TYPES.TEXT, placeholder: 'TT.MM.JJJJ', format: formatGermanDateInput },
    { key: 'commissioningDate', label: 'Erstmalige Inbetriebnahme', type: FIELD_TYPES.TEXT, placeholder: 'TT.MM.JJJJ', format: formatGermanDateInput },
    { key: 'stockAssessmentDate', label: 'Prüfdatum der Bestandsanlage', type: FIELD_TYPES.TEXT, placeholder: 'TT.MM.JJJJ', format: formatGermanDateInput, visibleWhen: isStockAssessment },
    { key: 'plannedActivity', label: 'Aktuell zu prüfende Tätigkeit', type: FIELD_TYPES.SELECT, options: plannedActivityOptions },
    { key: 'refrigerantOrigin', label: 'Herkunft des Servicekältemittels', type: FIELD_TYPES.SELECT, options: refrigerantOriginOptions },
    { key: 'preChargedStatus', label: 'Einrichtung vorbefüllt', type: FIELD_TYPES.SELECT, options: yesNoUnknownOptions },
    { key: 'leakDetectionSystemStatus', label: 'Leckage-Erkennungssystem vorhanden', type: FIELD_TYPES.SELECT, options: yesNoUnknownOptions },
    { key: 'hermeticallySealedStatus', label: 'Hermetisch geschlossen', type: FIELD_TYPES.SELECT, options: yesNoUnknownOptions },
    { key: 'hermeticallySealedLabelStatus', label: 'Als hermetisch geschlossen gekennzeichnet', type: FIELD_TYPES.SELECT, options: yesNoUnknownOptions },
    { key: 'coolingBelowMinus50Status', label: 'Kühlung von Erzeugnissen unter −50 °C', type: FIELD_TYPES.SELECT, options: yesNoUnknownOptions },
    { key: 'siteSafetyRestrictionStatus', label: 'Standortbezogene Sicherheitsanforderung verhindert niedrigeres GWP', type: FIELD_TYPES.SELECT, options: yesNoUnknownOptions },
    { key: 'nationalSafetyStandardRestrictionStatus', label: 'Nationale Sicherheitsnorm verhindert Alternative', type: FIELD_TYPES.SELECT, options: yesNoUnknownOptions },
    { key: 'cascadePrimaryCircuitStatus', label: 'Primärer Kältemittelkreislauf eines Kaskadensystems', type: FIELD_TYPES.SELECT, options: yesNoUnknownOptions },
    { key: 'specificRefrigerantLossPercent', label: 'Spezifischer Kältemittelverlust', type: FIELD_TYPES.DECIMAL, unit: '%' },
    { key: 'personCertificationStatus', label: 'Sachkunde der natürlichen Person', type: FIELD_TYPES.SELECT, options: certificationStatusOptions },
    { key: 'companyCertificationStatus', label: 'Unternehmenszertifikat', type: FIELD_TYPES.SELECT, options: certificationStatusOptions }
  ],
  groups: [
    { title: 'Anlage', fields: ['systemName', 'applicationType', 'installationType', 'mobileEquipmentType', 'productCategory', 'constructionType', 'splitType', 'performanceRange', 'performanceRangeInfo', 'ratedCapacityKw'], columns: 2, accent: 'blue' },
    { title: 'Kältemittel', fields: ['refrigerantId', 'chargeKg'], columns: 2, accent: 'blue' },
    { title: 'Zeitliche Bewertungsgrundlage und Tätigkeit', fields: ['placedOnMarketDate', 'commissioningDate', 'stockAssessmentDate', 'plannedActivity', 'refrigerantOrigin', 'preChargedStatus'], columns: 2, accent: 'blue' },
    { title: 'Regelrelevante Eigenschaften', fields: ['leakDetectionSystemStatus', 'hermeticallySealedStatus', 'hermeticallySealedLabelStatus', 'coolingBelowMinus50Status', 'siteSafetyRestrictionStatus', 'nationalSafetyStandardRestrictionStatus', 'cascadePrimaryCircuitStatus', 'specificRefrigerantLossPercent'], columns: 2, accent: 'blue' },
    { title: 'Zertifizierung', fields: ['personCertificationStatus', 'companyCertificationStatus'], columns: 2, accent: 'blue' }
  ]
});

export default schema;
