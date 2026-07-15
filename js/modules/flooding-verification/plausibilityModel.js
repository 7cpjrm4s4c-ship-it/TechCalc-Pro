const number = value => {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

const PRIORITY = Object.freeze({ error: 0, warning: 1, recommendation: 2, hint: 3 });

const issue = (code, severity, text, recommendation) => Object.freeze({
  code,
  severity,
  text,
  recommendation
});

function rainSeriesIssues(label, values = {}) {
  const entries = [5, 10, 15].map(duration => ({ duration, value: number(values[duration]) }));
  if (entries.some(entry => !(entry.value > 0))) return [];
  const monotonic = entries[0].value >= entries[1].value && entries[1].value >= entries[2].value;
  return monotonic ? [] : [issue(
    `RAIN_${label}_DURATION_ORDER`,
    'warning',
    `Die Regenspenden ${label} nehmen mit zunehmender Dauer nicht durchgehend ab.`,
    'KOSTRA-Datensatz, Dauerstufen und Übertragungsfehler prüfen.'
  )];
}

export function buildFloodingPlausibilityModel({ result = {}, applicability = {} } = {}) {
  const issues = [];
  const averageCs = number(result.averageCs);
  const averageCm = number(result.averageCm);

  if (averageCs != null && (averageCs < 0 || averageCs > 1)) {
    issues.push(issue('CS_OUT_OF_RANGE', 'error', 'Der flächengewichtete Spitzenabflussbeiwert Cₛ liegt außerhalb des zulässigen Wertebereichs 0 bis 1.', 'Flächenarten und Cₛ-Werte korrigieren.'));
  } else if (averageCs != null && averageCs > 0.95) {
    issues.push(issue('CS_UNUSUALLY_HIGH', 'warning', 'Der flächengewichtete Spitzenabflussbeiwert Cₛ ist mit über 0,95 ungewöhnlich hoch.', 'Prüfen, ob nahezu alle Flächen tatsächlich vollständig abflusswirksam sind.'));
  }

  if (averageCm != null && (averageCm < 0 || averageCm > 1)) {
    issues.push(issue('CM_OUT_OF_RANGE', 'error', 'Der flächengewichtete mittlere Abflussbeiwert Cₘ liegt außerhalb des zulässigen Wertebereichs 0 bis 1.', 'Flächenarten und Cₘ-Werte korrigieren.'));
  } else if (averageCm != null && averageCm > 0 && averageCm < 0.05) {
    issues.push(issue('CM_UNUSUALLY_LOW', 'warning', 'Der flächengewichtete mittlere Abflussbeiwert Cₘ ist mit unter 0,05 ungewöhnlich niedrig.', 'Flächenklassifikation und Cₘ-Werte fachlich prüfen.'));
  }

  if (averageCs != null && averageCm != null && averageCm > averageCs + 1e-9) {
    issues.push(issue('CM_EXCEEDS_CS', 'error', 'Der mittlere Abflussbeiwert Cₘ ist größer als der Spitzenabflussbeiwert Cₛ.', 'Cₛ- und Cₘ-Zuordnung der betroffenen Flächen korrigieren.'));
  }

  issues.push(...rainSeriesIssues('r(D,2)', result.rain?.r2));
  issues.push(...rainSeriesIssues('r(D,30)', result.rain?.r30));

  for (const duration of [5, 10, 15]) {
    const r2 = number(result.rain?.r2?.[duration]);
    const r30 = number(result.rain?.r30?.[duration]);
    if (r2 > 0 && r30 > 0 && r30 <= r2) {
      issues.push(issue(
        `RAIN_RETURN_PERIOD_${duration}`,
        'error',
        `Die Regenspende r(${duration},30) ist nicht größer als r(${duration},2).`,
        'Wiederkehrzeit, Dauerstufe und übernommene KOSTRA-Werte prüfen.'
      ));
    }
  }

  if (Number(result.invalidSurfaceCount || 0) > 0) {
    issues.push(issue('INVALID_SURFACES', 'error', `${result.invalidSurfaceCount} Fläche(n) sind ungültig und werden nicht vollständig berücksichtigt.`, 'Ungültige Flächen öffnen und Fläche sowie Abflussbeiwerte korrigieren.'));
  }
  if (Number(result.duplicateSourceCount || 0) > 0) {
    issues.push(issue('DUPLICATE_SOURCE_IDS', 'warning', 'Mehrfach vorhandene Quell-IDs können auf doppelt importierte Flächen hinweisen.', 'Importierte Flächen auf fachliche Doppelungen prüfen.'));
  }

  const utilization = number(result.utilizationPercent);
  if (utilization != null && utilization > 1000) {
    issues.push(issue('EXTREME_DISCHARGE_UTILIZATION', 'warning', `Die hydraulische Auslastung beträgt ${utilization.toLocaleString('de-DE', { maximumFractionDigits: 1 })} % und ist außergewöhnlich hoch.`, 'Einleitungsbegrenzung, Ableitungssystem und Speicherkonzept gemeinsam plausibilisieren.'));
  }

  const equation20Raw = number(result.flooding?.equation20?.rawValueM3);
  if (equation20Raw != null && equation20Raw < 0) {
    issues.push(issue('NEGATIVE_EQUATION_20', 'warning', 'Gleichung (20) ergibt vor der normgerechten Begrenzung ein negatives Volumen.', 'Eingabewerte und Ableitungsabfluss auf Plausibilität prüfen.'));
  }
  for (const row of result.flooding?.equation21ByDuration || []) {
    if (number(row.rawValueM3) < 0) {
      issues.push(issue(`NEGATIVE_EQUATION_21_${row.durationMinutes}`, 'warning', `Gleichung (21) ergibt für ${row.durationMinutes} min vor der Begrenzung ein negatives Volumen.`, 'Regenspende und verfügbaren Ableitungsabfluss prüfen.'));
    }
  }

  if (applicability.active && number(applicability.flowTimeMinutes) > 30) {
    issues.push(issue('FLOW_TIME_IMPLAUSIBLE', 'warning', 'Die angesetzte Fließzeit liegt über 30 Minuten und damit außerhalb des empirischen fA-Bereichs.', 'Fließweg und Fließzeit neu bestimmen oder eine Langzeitsimulation vorsehen.'));
  }

  const source = result.rain?.source || {};
  if (result.rainInputValid && (!String(source.dataset || '').trim() || !String(source.location || '').trim() || !String(source.version || '').trim())) {
    issues.push(issue('RAIN_SOURCE_INCOMPLETE', 'recommendation', 'Die Regenspenden sind vorhanden, aber die Quellenangaben sind nicht vollständig dokumentiert.', 'Datensatz, Raster beziehungsweise Ort und Datenversion ergänzen.'));
  }

  const sorted = [...issues].sort((a, b) => PRIORITY[a.severity] - PRIORITY[b.severity]);
  const counts = Object.freeze({
    errors: sorted.filter(item => item.severity === 'error').length,
    warnings: sorted.filter(item => item.severity === 'warning').length,
    recommendations: sorted.filter(item => item.severity === 'recommendation').length
  });

  return Object.freeze({
    status: counts.errors ? 'failed' : counts.warnings ? 'review-required' : 'plausible',
    statusLabel: counts.errors ? 'nicht plausibel' : counts.warnings ? 'fachliche Prüfung erforderlich' : 'plausibel',
    counts,
    issues: Object.freeze(sorted),
    messages: Object.freeze(sorted.flatMap(item => [
      Object.freeze({ severity: item.severity, text: item.text }),
      item.recommendation ? Object.freeze({ severity: 'recommendation', text: item.recommendation }) : null
    ].filter(Boolean)))
  });
}

export default buildFloodingPlausibilityModel;
