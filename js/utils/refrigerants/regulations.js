const rules = [
  { id: 'FG-010', legalSource: 'EU-FGAS:Art.5(1)', version: '1.0.1', validFrom: '2024-03-11', categories: ['leak-check'], conditions: [{ field: 'leakCheckRequired', operator: 'eq', value: true }], effect: 'leak-check-required', messageKey: 'fGases.leakCheck.required' },
  { id: 'FG-011', legalSource: 'EU-FGAS:Art.5(1)', version: '1.0.1', validFrom: '2024-03-11', categories: ['leak-check', 'exception'], conditions: [{ field: 'leakCheckStatus', operator: 'eq', value: 'exception-applies' }], effect: 'hermetic-threshold-exception', messageKey: 'fGases.leakCheck.hermeticException' },
  { id: 'FG-012', legalSource: 'EU-FGAS:Art.5(6)', version: '1.0.1', validFrom: '2024-03-11', categories: ['leak-check', 'interval'], conditions: [{ field: 'leakCheckIntervalMonths', operator: 'eq', value: 12 }], effect: { months: 12 }, messageKey: 'fGases.leakCheck.interval.12' },
  { id: 'FG-013', legalSource: 'EU-FGAS:Art.5(6)', version: '1.0.1', validFrom: '2024-03-11', categories: ['leak-check', 'interval'], conditions: [{ field: 'leakCheckIntervalMonths', operator: 'eq', value: 6 }], effect: { months: 6 }, messageKey: 'fGases.leakCheck.interval.6' },
  { id: 'FG-014', legalSource: 'EU-FGAS:Art.5(6)', version: '1.0.1', validFrom: '2024-03-11', categories: ['leak-check', 'interval'], conditions: [{ field: 'leakCheckIntervalMonths', operator: 'in', value: [3, 24] }], effect: 'interval-derived', messageKey: 'fGases.leakCheck.interval.derived' },
  { id: 'FG-016', legalSource: 'EU-FGAS:Art.6(1)', version: '1.0.1', validFrom: '2024-03-11', categories: ['leak-detection'], conditions: [{ field: 'leakDetectionRequired', operator: 'eq', value: true }], effect: 'leak-detection-required', messageKey: 'fGases.leakDetection.required' },
  { id: 'FG-017', legalSource: 'EU-FGAS:Art.6(3)', version: '1.0.1', validFrom: '2024-03-11', categories: ['leak-detection', 'interval'], conditions: [{ field: 'leakDetectionRequired', operator: 'eq', value: true }], effect: { months: 12 }, messageKey: 'fGases.leakDetection.interval' },
  { id: 'FG-020', legalSource: 'EU-FGAS:Art.7', version: '1.0.1', validFrom: '2024-03-11', categories: ['documentation'], conditions: [{ field: 'leakCheckRequired', operator: 'eq', value: true }], effect: { retentionYears: 5 }, messageKey: 'fGases.documentation.records' },
  { id: 'FG-030', legalSource: 'EU-FGAS:Art.13(3)', version: '1.0.1', validFrom: '2025-01-01', categories: ['service'], conditions: [{ field: 'applicationType', operator: 'eq', value: 'refrigeration' }, { field: 'gwp', operator: 'gte', value: 2500 }], effect: 'service-prohibited', messageKey: 'fGases.service.refrigeration.prohibited' },
  { id: 'FG-031', legalSource: 'EU-FGAS:Art.13(3)', version: '1.0.1', validFrom: '2025-01-01', validUntil: '2029-12-31', categories: ['service'], conditions: [{ field: 'applicationType', operator: 'eq', value: 'refrigeration' }, { field: 'gwp', operator: 'gte', value: 2500 }, { field: 'refrigerantOrigin', operator: 'in', value: ['reclaimed', 'recycled'] }], effect: 'service-exception', messageKey: 'fGases.service.refrigeration.reclaimedOrRecycled' },
  { id: 'FG-032', legalSource: 'EU-FGAS:Art.13(4)', version: '1.0.1', validFrom: '2026-01-01', categories: ['service'], conditions: [{ field: 'applicationType', operator: 'in', value: ['air-conditioning', 'heat-pump'] }, { field: 'gwp', operator: 'gte', value: 2500 }], effect: 'service-prohibited', messageKey: 'fGases.service.acHeatPump.prohibited' },
  { id: 'FG-033', legalSource: 'EU-FGAS:Art.13(4)', version: '1.0.1', validFrom: '2026-01-01', validUntil: '2031-12-31', categories: ['service'], conditions: [{ field: 'applicationType', operator: 'in', value: ['air-conditioning', 'heat-pump'] }, { field: 'gwp', operator: 'gte', value: 2500 }, { field: 'refrigerantOrigin', operator: 'in', value: ['reclaimed', 'recycled'] }], effect: 'service-exception', messageKey: 'fGases.service.acHeatPump.reclaimedOrRecycled' },
  { id: 'FG-045', legalSource: 'EU-FGAS:Art.11(1)', version: '1.0.1', validFrom: '2024-03-11', categories: ['placing-on-market', 'documentation'], conditions: [{ field: 'placedOnMarketDate', operator: 'before-applicable-ban-date', value: true }, { field: 'assessmentDate', operator: 'on-or-after-one-year-after-applicable-ban-date', value: true }], effect: 'pre-ban-proof-required', messageKey: 'fGases.placingOnMarket.preBanProof' },
  { id: 'FG-046', legalSource: 'DE-CHEMG:§12i(2)', version: '1.0.1', validFrom: '2026-04-02', categories: ['placing-on-market', 'documentation', 'germany'], conditions: [{ field: 'placedOnMarketDate', operator: 'before-applicable-ban-date', value: true }], effect: 'seller-declaration-required', messageKey: 'fGases.germany.preBanDeclaration' },
  { id: 'FG-047', legalSource: 'DE-CHEMG:§12i(1)', version: '1.0.1', validFrom: '2026-04-02', categories: ['placing-on-market', 'germany'], conditions: [{ field: 'annexIvCompliance', operator: 'eq', value: 'non-compliant' }], effect: 'acquisition-prohibited', messageKey: 'fGases.germany.nonCompliantAcquisition' },
  { id: 'FG-050', legalSource: 'EU-FGAS:Art.10+DE-CHEMKLIMA:§5', version: '1.0.1', validFrom: '2026-04-17', categories: ['certification'], conditions: [{ field: 'plannedActivity', operator: 'in', value: ['installation', 'maintenance', 'repair', 'leak-check', 'recovery', 'decommissioning'] }], effect: 'person-certification-check', messageKey: 'fGases.certification.person' },
  { id: 'FG-051', legalSource: 'EU-FGAS:Art.10+DE-CHEMKLIMA:§10', version: '1.0.1', validFrom: '2026-04-17', categories: ['certification'], conditions: [{ field: 'plannedActivity', operator: 'in', value: ['installation', 'maintenance', 'repair', 'decommissioning'] }], effect: 'company-certification-check', messageKey: 'fGases.certification.company' },
  { id: 'FG-052', legalSource: 'DE-CHEMKLIMA:§14(1)', version: '1.0.1', validFrom: '2026-04-17', categories: ['operator-duty', 'certification'], conditions: [{ field: 'plannedActivity', operator: 'present', value: true }], effect: 'contractor-certification-check', messageKey: 'fGases.operator.contractorCertification' },
  { id: 'FG-053', legalSource: 'DE-CHEMKLIMA:§14(2)', version: '1.0.1', validFrom: '2026-04-17', categories: ['operator-duty', 'certification'], conditions: [{ field: 'plannedActivity', operator: 'eq', value: 'leak-check' }], effect: 'person-certification-required', messageKey: 'fGases.operator.leakCheckCertification' },
  { id: 'FG-054', legalSource: 'DE-CHEMKLIMA:§14(3)', version: '1.0.1', validFrom: '2026-04-17', categories: ['operator-duty', 'certification'], conditions: [{ field: 'plannedActivity', operator: 'eq', value: 'recovery' }], effect: 'person-certification-required', messageKey: 'fGases.operator.recoveryCertification' },
  { id: 'FG-060', legalSource: 'DE-CHEMKLIMA:§2(1)', version: '1.0.1', validFrom: '2026-04-17', categories: ['operator-duty', 'refrigerant-loss', 'germany'], conditions: [{ field: 'installationType', operator: 'eq', value: 'stationary' }], effect: 'specific-refrigerant-loss-limit', messageKey: 'fGases.germany.refrigerantLoss.limit' },
  { id: 'FG-063', legalSource: 'DE-CHEMKLIMA:§2(2)', version: '1.0.1', validFrom: '2026-04-17', categories: ['operator-duty', 'germany'], conditions: [{ field: 'installationType', operator: 'eq', value: 'stationary' }], effect: 'access-to-detachable-connections', messageKey: 'fGases.germany.detachableConnections' }
];

const annexRules = [
  ['AIV-002A','2015-01-01','household-refrigerator-freezer',[['gasType','eq','hfc'],['gwp','gte',150]],[]],
  ['AIV-002B','2026-01-01','household-refrigerator-freezer',[['gasScope','eq','fluorinated-greenhouse-gas']],['site-safety']],
  ['AIV-003A','2020-01-01','commercial-self-contained-refrigerator-freezer',[['gasType','eq','hfc'],['gwp','gte',2500]],[]],
  ['AIV-003B','2022-01-01','commercial-self-contained-refrigerator-freezer',[['gasType','eq','hfc'],['gwp','gte',150]],[]],
  ['AIV-003C','2025-01-01','commercial-self-contained-refrigerator-freezer',[['gasScope','eq','other-fluorinated-greenhouse-gas'],['gwp','gte',150]],[]],
  ['AIV-004','2025-01-01','self-contained-refrigeration-system',[['gwp','gte',150]],['site-safety']],
  ['AIV-005A','2020-01-01','other-refrigeration-system',[['gasType','eq','hfc'],['gwp','gte',2500]],['cooling-below-minus-50']],
  ['AIV-005B','2025-01-01','other-refrigeration-system',[['gasScope','eq','fluorinated-greenhouse-gas'],['gwp','gte',2500]],['cooling-below-minus-50']],
  ['AIV-005C','2030-01-01','other-refrigeration-system',[['gwp','gte',150]],['site-safety']],
  ['AIV-006','2022-01-01','centralized-commercial-refrigeration-system',[['ratedCapacityKw','gte',40],['gasScope','eq','annex-i'],['gwp','gte',150]],['cascade-primary-circuit-below-1500']],
  ['AIV-007A','2020-01-01','stationary-chiller',[['gasType','eq','hfc'],['gwp','gte',2500]],['cooling-below-minus-50']],
  ['AIV-007B','2027-01-01','stationary-chiller',[['ratedCapacityKw','lte',12],['gwp','gte',150]],['site-safety']],
  ['AIV-007C','2032-01-01','stationary-chiller',[['ratedCapacityKw','lte',12],['gasScope','eq','fluorinated-greenhouse-gas']],['site-safety']],
  ['AIV-008A','2020-01-01','self-contained-ac-heat-pump',[['constructionType','eq','portable'],['gasType','eq','hfc'],['gwp','gte',150]],[]],
  ['AIV-008B','2027-01-01','self-contained-ac-heat-pump',[['ratedCapacityKw','lte',12],['gwp','gte',150]],['site-safety-max-gwp-750']],
  ['AIV-008C','2032-01-01','self-contained-ac-heat-pump',[['ratedCapacityKw','lte',12],['gasScope','eq','fluorinated-greenhouse-gas']],['site-safety-max-gwp-750']],
  ['AIV-008D','2027-01-01','self-contained-ac-heat-pump',[['ratedCapacityKw','gt',12],['ratedCapacityKw','lte',50],['gwp','gte',150]],['site-safety-max-gwp-750']],
  ['AIV-008E','2030-01-01','self-contained-ac-heat-pump',[['gwp','gte',150]],['site-safety-max-gwp-750']],
  ['AIV-009A','2025-01-01','split-ac-heat-pump',[['constructionType','eq','mono-split'],['gasScope','eq','annex-i'],['gwp','gte',750],['chargeKg','lt',3]],[]],
  ['AIV-009B','2027-01-01','split-ac-heat-pump',[['splitType','eq','air-water'],['ratedCapacityKw','lte',12],['gwp','gte',150]],['site-safety']],
  ['AIV-009C','2029-01-01','split-ac-heat-pump',[['splitType','eq','air-air'],['ratedCapacityKw','lte',12],['gwp','gte',150]],['national-safety-standard']],
  ['AIV-009D','2035-01-01','split-ac-heat-pump',[['ratedCapacityKw','lte',12],['gasScope','eq','fluorinated-greenhouse-gas']],['site-safety']],
  ['AIV-009E','2029-01-01','split-ac-heat-pump',[['ratedCapacityKw','gt',12],['gwp','gte',750]],['site-safety']],
  ['AIV-009F','2033-01-01','split-ac-heat-pump',[['ratedCapacityKw','gt',12],['gwp','gte',150]],['site-safety']],
  ['AIV-010','2007-07-04','direct-evaporation-system',[['gasType','in',['hfc','pfc']]],[]]
].map(([id,validFrom,productCategory,extra,exceptions]) => Object.freeze({
  id, legalSource: `EU-FGAS:AnnexIV(${id.slice(4).replace(/[A-Z]$/, '')})`, version: '1.0.1', validFrom,
  categories: ['annex-iv'], conditions: [{ field:'productCategory', operator:'eq', value:productCategory }, ...extra.map(([field,operator,value]) => ({field,operator,value}))],
  effect:'placing-on-market-prohibited', exceptions, messageKey:`fGases.annexIV.${id.slice(4).toLowerCase()}`
}));
annexRules.push(Object.freeze({ id:'AIV-007D', legalSource:'EU-FGAS:AnnexIV(7)(d)', version:'1.0.1', validFrom:'2027-01-01', categories:['annex-iv'], conditions:[{field:'productCategory',operator:'eq',value:'stationary-chiller'},{field:'ratedCapacityKw',operator:'gt',value:12},{field:'gwp',operator:'source-wording-only',value:750}], effect:'manual-legal-review-required', exceptions:['site-safety'], automationStatus:'manual-review', messageKey:'fGases.annexIV.007d.unresolvedComparator' }));

export const REGULATION_DATASET = Object.freeze({
  version:'1.0.1', updatedAt:'2026-08-27', status:'specified',
  sources:Object.freeze([
    Object.freeze({ id:'EU-FGAS', title:'Verordnung (EU) 2024/573', legalDate:'2024-02-07', publicationDate:'2024-02-20', defaultValidFrom:'2024-03-11' }),
    Object.freeze({ id:'DE-CHEMG', title:'Fünftes Gesetz zur Änderung des Chemikaliengesetzes', legalDate:'2026-03-29', publicationDate:'2026-04-01' }),
    Object.freeze({ id:'DE-CHEMKLIMA', title:'Chemikalien-Klimaschutzverordnung', legalDate:'2026-04-14', publicationDate:'2026-04-16', defaultValidFrom:'2026-04-17' })
  ]),
  rules:Object.freeze([...rules.map(Object.freeze), ...annexRules])
});

export default REGULATION_DATASET;
