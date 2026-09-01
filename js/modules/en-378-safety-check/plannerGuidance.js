export const EN_378_PLANNER_GUIDANCE_VERSION = 1;

export const PLANNER_GUIDANCE_GROUPS = Object.freeze({
  CHARGE_LIMIT: 'chargeLimit',
  LOCATION: 'location',
  OCCUPANCY: 'occupancy',
  VENTILATION: 'ventilation',
  MACHINERY_ROOM: 'machineryRoom',
  DETECTION: 'detection',
  ALARM: 'alarm',
  EMERGENCY_CONTROL: 'emergencyControl',
  SAFETY_MEASURES: 'safetyMeasures',
  GUIDANCE: 'guidance',
  OPEN_POINTS: 'openPoints'
});

const GROUP_LABELS = Object.freeze({
  chargeLimit: 'Füllmenge und Konzentration',
  location: 'Aufstellort',
  occupancy: 'Nutzung und Zugang',
  ventilation: 'Lüftung',
  machineryRoom: 'Maschinenraum',
  detection: 'Detektion',
  alarm: 'Alarmierung',
  emergencyControl: 'Abschaltung und Notfunktionen',
  safetyMeasures: 'Schutzmaßnahmen',
  guidance: 'Übergabe und Dokumentation',
  openPoints: 'Offene Angaben'
});

const GROUP_ORDER = Object.freeze([
  PLANNER_GUIDANCE_GROUPS.CHARGE_LIMIT,
  PLANNER_GUIDANCE_GROUPS.LOCATION,
  PLANNER_GUIDANCE_GROUPS.OCCUPANCY,
  PLANNER_GUIDANCE_GROUPS.VENTILATION,
  PLANNER_GUIDANCE_GROUPS.MACHINERY_ROOM,
  PLANNER_GUIDANCE_GROUPS.DETECTION,
  PLANNER_GUIDANCE_GROUPS.ALARM,
  PLANNER_GUIDANCE_GROUPS.EMERGENCY_CONTROL,
  PLANNER_GUIDANCE_GROUPS.SAFETY_MEASURES,
  PLANNER_GUIDANCE_GROUPS.GUIDANCE,
  PLANNER_GUIDANCE_GROUPS.OPEN_POINTS
]);

const STATUS_LABELS = Object.freeze({
  acceptable: 'Anforderungen nach aktuellem Prüfstand erfüllt',
  'measures-required': 'Maßnahmen oder Anpassungen erforderlich',
  'ready-for-assessment': 'Bewertung teilweise offen',
  incomplete: 'Eingaben unvollständig',
  'import-rejected': 'Snapshot abgelehnt',
  passed: 'erfüllt',
  failed: 'nicht erfüllt',
  required: 'erforderlich',
  'not-assessed': 'offen',
  'not-applicable': 'nicht anwendbar'
});

const array = value => Array.isArray(value) ? value : [];
const text = value => String(value ?? '').trim();

function unique(values) {
  return [...new Set(array(values).map(text).filter(Boolean))];
}

function sourceLabel(source = {}) {
  const part = text(source.sourcePart);
  const section = text(source.sourceSection);
  if (part && section) return `${part} ${section}`;
  return part || section || '';
}

function statusLabel(status) {
  return STATUS_LABELS[status] || text(status) || 'offen';
}

function guidanceStatus(status) {
  if (status === 'failed') return 'action-required';
  if (status === 'not-assessed') return 'clarification-required';
  if (status === 'required') return 'planning-required';
  if (status === 'passed') return 'confirmed';
  if (status === 'not-applicable') return 'not-applicable';
  return 'information';
}

function normalizeCategory(category) {
  const normalized = text(category);
  if (GROUP_LABELS[normalized]) return normalized;
  return PLANNER_GUIDANCE_GROUPS.GUIDANCE;
}

function freezeItem(item) {
  return Object.freeze({
    id: text(item.id),
    category: normalizeCategory(item.category),
    title: text(item.title || item.id),
    status: text(item.status || 'required'),
    statusLabel: statusLabel(item.status || 'required'),
    guidanceStatus: guidanceStatus(item.status || 'required'),
    requirement: text(item.requirement),
    measure: text(item.measure),
    source: Object.freeze(item.source || {}),
    sourceLabel: sourceLabel(item.source || {}),
    priority: text(item.priority || 'required'),
    missingInputs: Object.freeze(unique(item.missingInputs)),
    details: Object.freeze(item.details || {})
  });
}

function itemFromRequirement(requirement = {}) {
  return freezeItem({
    id: requirement.id,
    category: requirement.category,
    title: requirement.title || requirement.id,
    status: requirement.status || 'required',
    requirement: requirement.requirement,
    measure: requirement.measure,
    source: requirement.source,
    priority: requirement.priority,
    missingInputs: requirement.missingInputs,
    details: requirement.details
  });
}

function titleForChargeCheck(check = {}) {
  if (check.id === 'charge-limit.toxicity') return 'Toxizitätsbezogene Füllmengengrenze prüfen';
  if (check.id === 'charge-limit.flammability') return 'Brennbarkeitsbezogene Füllmengengrenze prüfen';
  if (check.id === 'charge-limit.alternative-risk-management') return 'Alternative Vorkehrungen bewerten';
  if (check.id === 'charge-limit.refrigerant-data') return 'EN-378-Kältemitteldaten ergänzen';
  if (check.id === 'charge-limit.input') return 'Füllmenge und Raumvolumen ergänzen';
  return check.id || 'Füllmengenprüfung';
}

function itemFromChargeCheck(check = {}) {
  const requirement = array(check.requirements).join(' ')
    || check.reason
    || 'Füllmengenprüfung nach EN 378-1 Anhang C berücksichtigen.';
  const measure = array(check.measures).join(' ')
    || (check.status === 'failed' ? 'Füllmenge, Raumvolumen, Aufstellort oder Schutzmaßnahmen anpassen.' : '')
    || (check.status === 'not-assessed' ? 'Fehlende Angaben ergänzen und Füllmengenbewertung erneut durchführen.' : '')
    || 'Prüfergebnis dokumentieren.';

  return freezeItem({
    id: check.id,
    category: check.category === 'safetyMeasures' ? PLANNER_GUIDANCE_GROUPS.SAFETY_MEASURES : PLANNER_GUIDANCE_GROUPS.CHARGE_LIMIT,
    title: titleForChargeCheck(check),
    status: check.status,
    requirement,
    measure,
    source: check.source,
    missingInputs: check.missingInputs,
    details: {
      maximumChargeKg: check.maximumChargeKg ?? null,
      concentrationKgM3: check.concentrationKgM3 ?? null,
      rule: check.rule || '',
      noLimit: Boolean(check.noLimit)
    }
  });
}

function itemFromInputIssue(issue) {
  const key = text(issue).split(':')[0] || text(issue);
  return freezeItem({
    id: `input.${key}`,
    category: PLANNER_GUIDANCE_GROUPS.OPEN_POINTS,
    title: `Eingabe prüfen: ${key}`,
    status: 'not-assessed',
    requirement: 'Für eine vollständige Bewertung müssen alle Pflichtangaben plausibel vorliegen.',
    measure: `Angabe '${key}' ergänzen oder korrigieren.`,
    source: { sourcePart: 'TechCalc Pro', sourceSection: 'Eingabevalidierung' },
    missingInputs: [key]
  });
}

function itemFromMissingInput(inputKey) {
  const key = text(inputKey);
  return freezeItem({
    id: `missing.${key}`,
    category: PLANNER_GUIDANCE_GROUPS.OPEN_POINTS,
    title: `Offene Angabe: ${key}`,
    status: 'not-assessed',
    requirement: 'Der Prüfschritt benötigt eine zusätzliche Angabe.',
    measure: `Angabe '${key}' ergänzen und Bewertung erneut prüfen.`,
    source: { sourcePart: 'TechCalc Pro', sourceSection: 'Bewertungsmodell' },
    missingInputs: [key]
  });
}

function dedupeItems(items) {
  const seen = new Set();
  return array(items).filter(item => {
    const key = `${item.id}|${item.status}|${item.measure}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildGroups(items) {
  const dedupedItems = dedupeItems(items);
  return Object.freeze(GROUP_ORDER
    .map(id => {
      const groupItems = dedupedItems.filter(item => item.category === id);
      return Object.freeze({
        id,
        title: GROUP_LABELS[id] || id,
        items: Object.freeze(groupItems)
      });
    })
    .filter(group => group.items.length > 0));
}

function headlineForStatus(status, actionCount, openPointCount) {
  if (status === 'import-rejected') return 'Der importierte Snapshot kann nicht bewertet werden.';
  if (status === 'incomplete') return 'Für den Leitfaden fehlen noch Pflichtangaben.';
  if (status === 'measures-required') return 'Für den gewählten Aufstellort sind Maßnahmen oder Anpassungen erforderlich.';
  if (openPointCount > 0) return 'Der Leitfaden enthält noch offene Prüfpunkte.';
  if (actionCount > 0) return 'Die erforderlichen Planungsmaßnahmen sind ausgewiesen.';
  return 'Für den gewählten Aufstellort wurden keine zusätzlichen Maßnahmen ermittelt.';
}

function summaryForStatus(status, actionCount, failedCount, openPointCount) {
  if (status === 'import-rejected') return 'Der F-Gase-Snapshot wurde technisch abgelehnt. Die EN-378-Bewertung muss mit einem gültigen Snapshot neu gestartet werden.';
  if (status === 'incomplete') return 'Ergänze die fehlenden Angaben, damit Füllmenge, Aufstellort und Sicherheitskomponenten bewertet werden können.';
  if (failedCount > 0) return `${failedCount} Prüfpunkte sind nicht erfüllt. Die aufgeführten Maßnahmen sind vor Freigabe des Aufstellkonzepts zu klären.`;
  if (openPointCount > 0) return `${openPointCount} Angaben oder Prüfpunkte sind noch offen. Die übrigen Anforderungen können bereits als Planungsleitfaden verwendet werden.`;
  if (actionCount > 0) return `${actionCount} Anforderungen sind als Planungs- oder Dokumentationsmaßnahmen zu berücksichtigen.`;
  return 'Die vorhandenen Angaben führen aktuell zu keiner zusätzlichen Maßnahme.';
}

export function buildEN378PlannerGuidance(currentState = {}, assessment = {}) {
  const inputIssues = array(assessment.inputValidation?.issues);
  const chargeChecks = array(assessment.chargeLimitAssessment?.checks);
  const installationRequirements = array(assessment.installationSafetyAssessment?.requirements);
  const missingInputs = unique([
    ...inputIssues.map(issue => text(issue).split(':')[0]),
    ...array(assessment.chargeLimitAssessment?.missingInputs),
    ...array(assessment.installationSafetyAssessment?.missingInputs)
  ]);

  const actionItems = [
    ...chargeChecks
      .filter(check => ['failed', 'not-assessed'].includes(check.status))
      .map(itemFromChargeCheck),
    ...installationRequirements
      .filter(requirement => ['required', 'failed', 'not-assessed'].includes(requirement.status))
      .map(itemFromRequirement),
    ...inputIssues.map(itemFromInputIssue),
    ...missingInputs.map(itemFromMissingInput)
  ];

  const confirmedItems = [
    ...chargeChecks
      .filter(check => check.status === 'passed' && !check.noLimit)
      .map(itemFromChargeCheck),
    ...installationRequirements
      .filter(requirement => requirement.status === 'passed')
      .map(itemFromRequirement)
  ];

  const failedCount = actionItems.filter(item => item.status === 'failed').length;
  const openPointCount = actionItems.filter(item => item.status === 'not-assessed').length;
  const actionCount = actionItems.filter(item => item.status !== 'not-assessed').length;
  const status = text(assessment.status || currentState.status || 'not-assessed');

  return Object.freeze({
    version: EN_378_PLANNER_GUIDANCE_VERSION,
    status,
    statusLabel: statusLabel(status),
    headline: headlineForStatus(status, actionCount, openPointCount),
    summary: summaryForStatus(status, actionCount, failedCount, openPointCount),
    actionCount,
    failedCount,
    openPointCount,
    missingInputs: Object.freeze(missingInputs),
    groups: buildGroups(actionItems),
    confirmedItems: Object.freeze(dedupeItems(confirmedItems)),
    requiredMeasures: Object.freeze(unique(actionItems.map(item => item.measure)))
  });
}

export function getPlannerGuidanceGroupLabel(groupId) {
  return GROUP_LABELS[groupId] || text(groupId) || 'Leitfaden';
}

export function getPlannerGuidanceStatusLabel(status) {
  return statusLabel(status);
}

export default buildEN378PlannerGuidance;
