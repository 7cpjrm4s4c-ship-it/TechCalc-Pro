import { defineFormSchema, FIELD_TYPES } from '../../core/formSchema.js';

const yesNoUnknownOptions = Object.freeze([
  Object.freeze({ value: '', label: 'Nicht angegeben' }),
  Object.freeze({ value: 'yes', label: 'Ja' }),
  Object.freeze({ value: 'no', label: 'Nein' })
]);

const applicationTypeOptions = Object.freeze([
  Object.freeze({ value: 'refrigeration', label: 'Kälteanlage' }),
  Object.freeze({ value: 'air-conditioning', label: 'Klimaanlage' }),
  Object.freeze({ value: 'heat-pump', label: 'Wärmepumpe' })
]);

const installationTypeOptions = Object.freeze([
  Object.freeze({ value: 'stationary', label: 'Ortsfest' }),
  Object.freeze({ value: 'mobile', label: 'Mobil' })
]);

const productCategoryOptions = Object.freeze([
  Object.freeze({ value: 'household-refrigerator-freezer', label: 'Haushaltskühl-/Gefriergerät' }),
  Object.freeze({ value: 'commercial-self-contained-refrigerator-freezer', label: 'Gewerbliches in sich geschlossenes Kühl-/Gefriergerät' }),
  Object.freeze({ value: 'self-contained-refrigeration-system', label: 'In sich geschlossene Kälteanlage' }),
  Object.freeze({ value: 'other-refrigeration-system', label: 'Sonstige Kälteanlage' }),
  Object.freeze({ value: 'centralized-commercial-refrigeration-system', label: 'Mehrteilige zentralisierte gewerbliche Kälteanlage' }),
  Object.freeze({ value: 'stationary-chiller', label: 'Ortsfester Kühler' }),
  Object.freeze({ value: 'self-contained-ac-heat-pump', label: 'In sich geschlossenes Klima-/Wärmepumpensystem' }),
  Object.freeze({ value: 'split-ac-heat-pump', label: 'Split-Klima-/Wärmepumpensystem' }),
  Object.freeze({ value: 'direct-evaporation-system', label: 'Nichtgeschlossenes Direktverdampfungssystem' })
]);

const constructionTypeOptions = Object.freeze([
  Object.freeze({ value: 'self-contained', label: 'In sich geschlossen' }),
  Object.freeze({ value: 'portable', label: 'Tragbar / steckerfertig' }),
  Object.freeze({ value: 'monoblock', label: 'Monoblock' }),
  Object.freeze({ value: 'split', label: 'Split' }),
  Object.freeze({ value: 'mono-split', label: 'Mono-Split' }),
  Object.freeze({ value: 'centralized', label: 'Zentralisiert' }),
  Object.freeze({ value: 'cascade', label: 'Kaskadensystem' }),
  Object.freeze({ value: 'other', label: 'Sonstige Bauform' })
]);

const splitTypeOptions = Object.freeze([
  Object.freeze({ value: '', label: 'Nicht angegeben' }),
  Object.freeze({ value: 'air-water', label: 'Luft-Wasser' }),
  Object.freeze({ value: 'air-air', label: 'Luft-Luft' }),
  Object.freeze({ value: 'other', label: 'Sonstiges Split-System' })
]);

const plannedActivityOptions = Object.freeze([
  Object.freeze({ value: 'installation', label: 'Installation' }),
  Object.freeze({ value: 'maintenance', label: 'Wartung / Instandhaltung' }),
  Object.freeze({ value: 'repair', label: 'Reparatur' }),
  Object.freeze({ value: 'leak-check', label: 'Dichtheitskontrolle' }),
  Object.freeze({ value: 'recovery', label: 'Rückgewinnung' }),
  Object.freeze({ value: 'decommissioning', label: 'Außerbetriebnahme' })
]);

const refrigerantOriginOptions = Object.freeze([
  Object.freeze({ value: '', label: 'Nicht angegeben' }),
  Object.freeze({ value: 'new', label: 'Neu' }),
  Object.freeze({ value: 'reclaimed', label: 'Aufgearbeitet' }),
  Object.freeze({ value: 'recycled', label: 'Recycelt' })
]);

const certificationStatusOptions = Object.freeze([
  Object.freeze({ value: '', label: 'Nicht geprüft' }),
  Object.freeze({ value: 'verified', label: 'Nachgewiesen' }),
  Object.freeze({ value: 'not-verified', label: 'Nicht nachgewiesen' }),
  Object.freeze({ value: 'not-applicable', label: 'Nicht anwendbar' })
]);

const schema = defineFormSchema({
  version: 3,
  fields: [
    { key: 'systemName', label: 'Anlagenbezeichnung', type: FIELD_TYPES.TEXT },
    { key: 'applicationType', label: 'Anlagenart', type: FIELD_TYPES.SELECT, options: applicationTypeOptions },
    { key: 'installationType', label: 'Aufstellung', type: FIELD_TYPES.SELECT, options: installationTypeOptions },
    { key: 'productCategory', label: 'Produkt-/Anlagenkategorie', type: FIELD_TYPES.SELECT, options: productCategoryOptions },
    { key: 'constructionType', label: 'Bauform', type: FIELD_TYPES.SELECT, options: constructionTypeOptions },
    { key: 'splitType', label: 'Split-Systemart', type: FIELD_TYPES.SELECT, options: splitTypeOptions },
    { key: 'performanceRange', label: 'Leistungsbereich', type: FIELD_TYPES.TEXT },
    { key: 'ratedCapacityKw', label: 'Nennleistung', type: FIELD_TYPES.DECIMAL, unit: 'kW' },
    { key: 'refrigerantId', label: 'Kältemittel', type: FIELD_TYPES.SELECT, options: [] },
    { key: 'chargeKg', label: 'Füllmenge', type: FIELD_TYPES.DECIMAL, unit: 'kg' },
    { key: 'assessmentDate', label: 'Bewertungsdatum', type: FIELD_TYPES.TEXT, placeholder: 'JJJJ-MM-TT' },
    { key: 'placedOnMarketDate', label: 'Erstmaliges Inverkehrbringen', type: FIELD_TYPES.TEXT, placeholder: 'JJJJ-MM-TT' },
    { key: 'plannedActivity', label: 'Zu prüfende Tätigkeit', type: FIELD_TYPES.SELECT, options: plannedActivityOptions },
    { key: 'refrigerantOrigin', label: 'Herkunft Servicekältemittel', type: FIELD_TYPES.SELECT, options: refrigerantOriginOptions },
    { key: 'preChargedStatus', label: 'Einrichtung vorbefüllt', type: FIELD_TYPES.SELECT, options: yesNoUnknownOptions },
    { key: 'leakDetectionSystemStatus', label: 'Leckage-Erkennungssystem vorhanden', type: FIELD_TYPES.SELECT, options: yesNoUnknownOptions },
    { key: 'hermeticallySealedStatus', label: 'Hermetisch geschlossen', type: FIELD_TYPES.SELECT, options: yesNoUnknownOptions },
    { key: 'hermeticallySealedLabelStatus', label: 'Als hermetisch geschlossen gekennzeichnet', type: FIELD_TYPES.SELECT, options: yesNoUnknownOptions },
    { key: 'coolingBelowMinus50Status', label: 'Kühlung von Erzeugnissen unter -50 °C', type: FIELD_TYPES.SELECT, options: yesNoUnknownOptions },
    { key: 'siteSafetyRestrictionStatus', label: 'Standort-Sicherheitsanforderung verhindert niedrigeres GWP', type: FIELD_TYPES.SELECT, options: yesNoUnknownOptions },
    { key: 'nationalSafetyStandardRestrictionStatus', label: 'Nationale Sicherheitsnorm verhindert Alternative', type: FIELD_TYPES.SELECT, options: yesNoUnknownOptions },
    { key: 'cascadePrimaryCircuitStatus', label: 'Primärer Kältemittelkreislauf eines Kaskadensystems', type: FIELD_TYPES.SELECT, options: yesNoUnknownOptions },
    { key: 'specificRefrigerantLossPercent', label: 'Spezifischer Kältemittelverlust', type: FIELD_TYPES.DECIMAL, unit: '%' },
    { key: 'personCertificationStatus', label: 'Sachkunde natürliche Person', type: FIELD_TYPES.SELECT, options: certificationStatusOptions },
    { key: 'companyCertificationStatus', label: 'Unternehmenszertifikat', type: FIELD_TYPES.SELECT, options: certificationStatusOptions }
  ],
  groups: [
    { title: 'Anlage', fields: ['systemName', 'applicationType', 'installationType', 'productCategory', 'constructionType', 'splitType', 'performanceRange', 'ratedCapacityKw'], columns: 2, accent: 'blue' },
    { title: 'Kältemittel', fields: ['refrigerantId', 'chargeKg'], columns: 2, accent: 'blue' },
    { title: 'Bewertungszeitpunkt und Tätigkeit', fields: ['assessmentDate', 'placedOnMarketDate', 'plannedActivity', 'refrigerantOrigin', 'preChargedStatus'], columns: 2, accent: 'blue' },
    { title: 'Regelrelevante Eigenschaften', fields: ['leakDetectionSystemStatus', 'hermeticallySealedStatus', 'hermeticallySealedLabelStatus', 'coolingBelowMinus50Status', 'siteSafetyRestrictionStatus', 'nationalSafetyStandardRestrictionStatus', 'cascadePrimaryCircuitStatus', 'specificRefrigerantLossPercent'], columns: 2, accent: 'blue' },
    { title: 'Zertifizierung', fields: ['personCertificationStatus', 'companyCertificationStatus'], columns: 2, accent: 'blue' }
  ]
});

export default schema;
