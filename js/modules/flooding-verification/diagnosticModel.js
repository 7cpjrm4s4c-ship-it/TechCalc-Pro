const PRIORITY = Object.freeze({ error: 0, warning: 1, recommendation: 2, hint: 3 });

const textOf = item => String(item?.text || item?.message || item || '').trim();

function inferSeverity(item) {
  if (item && typeof item === 'object' && PRIORITY[item.severity] != null) return item.severity;
  const text = textOf(item);
  if (/(muss|fehlt|ungültig|unvollständig|nicht erfüllt)/i.test(text)) return 'error';
  if (/(außerhalb|überschritten|kleiner|größer|begrenzt|Vorbemessung)/i.test(text)) return 'warning';
  return 'hint';
}

function normalize(items = []) {
  const seen = new Set();
  return (Array.isArray(items) ? items : [items])
    .map(item => ({ severity: inferSeverity(item), text: textOf(item) }))
    .filter(item => item.text && !seen.has(item.text) && seen.add(item.text))
    .sort((a, b) => PRIORITY[a.severity] - PRIORITY[b.severity]);
}

export function buildFloodingDiagnosticModel({ result = {}, applicability = {}, retentionComparison = {} } = {}) {
  const combined = result.combinedStorage || {};
  const sourceMessages = [
    ...(Array.isArray(result.warnings) ? result.warnings : []),
    ...(applicability.diagnostics || applicability.messages || []),
    ...(retentionComparison.diagnostics || retentionComparison.messages || [])
  ];
  const messages = normalize(sourceMessages);

  if (combined.status === 'pending-dwa') messages.push({ severity: 'recommendation', text: 'Den Rückhalteraumnachweis nach DWA-A 117 vervollständigen, bevor der Planungswert freigegeben wird.' });
  if (combined.status === 'pending-din') messages.push({ severity: 'recommendation', text: 'Den Überflutungsnachweis nach DIN 1986-100 vervollständigen, bevor der Planungswert freigegeben wird.' });
  if (combined.status === 'incomplete') messages.push({ severity: 'recommendation', text: 'Fehlende Flächen-, Regen- oder Abflussdaten ergänzen und den Nachweis erneut prüfen.' });
  if (applicability.status === 'preliminary-only') messages.push({ severity: 'recommendation', text: 'Das Ergebnis nur zur Vorbemessung verwenden und die weitere Planung mit der zuständigen Stelle abstimmen.' });
  if (applicability.status === 'long-term-simulation-required') messages.push({ severity: 'recommendation', text: 'Eine Langzeitsimulation durchführen; das einfache Verfahren ist für den endgültigen Nachweis nicht ausreichend.' });
  if (Number(result.criticalShare || 0) > 0.7) messages.push({ severity: 'recommendation', text: 'Die Notentwässerung wegen des kritischen Flächenanteils über 70 % zusätzlich prüfen.' });

  const deduplicated = normalize(messages);
  const errors = deduplicated.filter(item => item.severity === 'error');
  const warnings = deduplicated.filter(item => item.severity === 'warning');
  const recommendations = deduplicated.filter(item => item.severity === 'recommendation');
  const hints = deduplicated.filter(item => item.severity === 'hint');

  const outsideDomain = ['preliminary-only', 'long-term-simulation-required'].includes(applicability.status);
  const incomplete = ['incomplete', 'pending-dwa', 'pending-din'].includes(combined.status) || errors.length > 0;
  const status = incomplete ? 'incomplete' : outsideDomain ? 'outside-domain' : warnings.length ? 'complete-with-warnings' : 'complete';
  const statusLabel = ({
    incomplete: 'Berechnung unvollständig',
    'outside-domain': 'Normbereich verlassen',
    'complete-with-warnings': 'Berechnung vollständig mit Warnungen',
    complete: 'Berechnung erfolgreich'
  })[status];
  const statusReason = status === 'complete'
    ? 'Alle erforderlichen Nachweise sind vollständig und innerhalb der dokumentierten Anwendungsgrenzen.'
    : status === 'outside-domain'
      ? 'Mindestens eine Anwendungsgrenze des einfachen Verfahrens ist überschritten.'
      : status === 'complete-with-warnings'
        ? 'Ein Planungswert liegt vor; ergänzende Hinweise oder Prüfungen sind zu beachten.'
        : 'Mindestens ein erforderlicher Nachweis oder Eingabeblock ist noch nicht vollständig.';

  const notices = [
    ['error', 'Fehler', 'Fehler', errors],
    ['warning', 'Warnungen', 'Warnung', warnings],
    ['recommendation', 'Empfehlungen', 'Empfehlung', recommendations],
    ['hint', 'Hinweise', 'Hinweis', hints]
  ].filter(([, , , entries]) => entries.length).map(([, title, prefix, entries]) => Object.freeze({
    title,
    prefix,
    accent: 'green',
    messages: Object.freeze(entries.map(item => Object.freeze({ prefix, text: item.text })))
  }));

  return Object.freeze({
    status,
    statusLabel,
    statusReason,
    counts: Object.freeze({ errors: errors.length, warnings: warnings.length, recommendations: recommendations.length, hints: hints.length }),
    messages: Object.freeze({ errors: Object.freeze(errors), warnings: Object.freeze(warnings), recommendations: Object.freeze(recommendations), hints: Object.freeze(hints) }),
    notices: Object.freeze(notices)
  });
}

export default buildFloodingDiagnosticModel;
