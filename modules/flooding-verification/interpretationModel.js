const finite = value => Number.isFinite(Number(value)) ? Number(value) : null;

const volumeText = value => finite(value) == null
  ? '—'
  : `${finite(value).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³`;

function planningSummary(combined = {}, flooding = {}, retention = {}) {
  const planning = finite(combined.planningVolumeM3);
  if (planning == null) {
    return 'Ein belastbarer Planungswert kann erst nach Vervollständigung der erforderlichen Nachweise angegeben werden.';
  }

  const source = combined.governingSource;
  const equation = flooding.governing?.source === 'equation-20' ? 'Gleichung (20)' : flooding.governing?.source === 'equation-21' ? 'Gleichung (21)' : null;
  const base = `Für das vorliegende Projekt ist ein Speichervolumen von ${volumeText(planning)} anzusetzen.`;

  if (source === 'din') {
    const detail = ` Maßgebend ist der Überflutungsnachweis nach DIN 1986-100${equation ? ` (${equation})` : ''}.`;
    const comparison = finite(combined.dwaVolumeM3) != null
      ? ` Der Rückhalteraumnachweis nach DWA-A 117 ergibt ${volumeText(combined.dwaVolumeM3)} und ist für die Speicherbemessung nicht maßgebend.`
      : '';
    return `${base}${detail}${comparison}`;
  }
  if (source === 'dwa') {
    return `${base} Maßgebend ist der Rückhalteraumnachweis nach DWA-A 117. Der DIN-Nachweis ergibt mit ${volumeText(combined.dinVolumeM3)} den geringeren Volumenbedarf.`;
  }
  if (source === 'equal') {
    return `${base} DIN 1986-100 und DWA-A 117 führen zum gleichen erforderlichen Speichervolumen.`;
  }
  if (!retention.active) {
    return `${base} Für die gewählte Betriebsart ist kein zusätzlicher Rückhalteraumnachweis nach DWA-A 117 erforderlich.`;
  }
  return `${base} Der Wert ist bis zum Abschluss aller Teilnachweise als vorläufig zu behandeln.`;
}

function dischargeInterpretation(result = {}) {
  const required = finite(result.requiredRainFlowLs);
  const available = finite(result.availableFlowLs);
  if (required == null || required <= 0) return 'Der erforderliche Regenwasserabfluss ist noch nicht vollständig bestimmt.';
  if (available == null || available <= 0) return 'Ein verfügbarer Ableitungsabfluss ist noch nicht belastbar nachgewiesen.';
  if (available >= required) return 'Der verfügbare Ableitungsabfluss deckt den erforderlichen Regenwasserabfluss vollständig ab.';
  if (result.dischargeMode === 'authority-discharge-limit') {
    return 'Der verfügbare Ableitungsabfluss unterschreitet den erforderlichen Regenwasserabfluss. Das Speichervolumen wurde unter Berücksichtigung der behördlichen Einleitungsbegrenzung bestimmt.';
  }
  return 'Der verfügbare Ableitungsabfluss unterschreitet den erforderlichen Regenwasserabfluss. Leitung, Gefälle oder Speicherkonzept sind planerisch anzupassen.';
}

function dwaInterpretation(applicability = {}, retention = {}) {
  if (!retention.active) return 'Für die gewählte Betriebsart ist kein Rückhalteraumnachweis nach DWA-A 117 erforderlich.';
  if (applicability.status === 'applicable' && retention.calculated) return 'Das einfache Verfahren nach DWA-A 117 ist uneingeschränkt anwendbar und wurde vollständig durchgeführt.';
  if (applicability.status === 'preliminary-only') return 'Das einfache Verfahren liegt außerhalb des empirischen Gültigkeitsbereichs und darf nur zur Vorbemessung verwendet werden.';
  if (applicability.status === 'long-term-simulation-required') return 'Die Anwendungsgrenzen des einfachen Verfahrens sind überschritten. Für den endgültigen Nachweis ist eine Langzeitsimulation erforderlich.';
  return 'Der Rückhalteraumnachweis nach DWA-A 117 ist noch nicht vollständig.';
}

function normativeStatement(combined = {}, retention = {}) {
  if (!retention.active) return 'Für die gewählte Betriebsart wurde ausschließlich der Überflutungsnachweis nach DIN 1986-100 angesetzt.';
  if (finite(combined.dinVolumeM3) != null && finite(combined.dwaVolumeM3) != null) {
    return 'Für einen gemeinsamen Speicher ist der größere erforderliche Volumenbedarf aus DIN 1986-100 und DWA-A 117 anzusetzen; die Volumina werden nicht addiert.';
  }
  return 'Der normative Vergleich ist erst nach vollständigem Abschluss beider erforderlichen Nachweise belastbar.';
}

function actionRecommendation(result = {}, applicability = {}, combined = {}) {
  if (combined.status === 'incomplete' || combined.status === 'pending-din' || combined.status === 'pending-dwa') {
    return 'Fehlende Eingaben und Teilnachweise vervollständigen, bevor das Speichervolumen freigegeben wird.';
  }
  if (applicability.status === 'long-term-simulation-required') return 'Eine Langzeitsimulation durchführen und das endgültige Speichervolumen darauf abstimmen.';
  if (applicability.status === 'preliminary-only') return 'Das Ergebnis nur zur Vorbemessung verwenden und mit der zuständigen Stelle abstimmen.';
  if (finite(result.criticalShare) > 0.7) return 'Zusätzlich die Notentwässerung und schadlose Überflutungswege prüfen.';
  if (!result.dischargeAdequate && result.dischargeMode !== 'authority-discharge-limit') return 'Ableitungskapazität erhöhen oder das Speicherkonzept entsprechend anpassen.';
  return 'Das planerisch anzusetzende Speichervolumen in der weiteren Entwurfs- und Ausführungsplanung berücksichtigen.';
}

export function buildFloodingInterpretationModel({ result = {}, applicability = {} } = {}) {
  const combined = result.combinedStorage || {};
  const flooding = result.flooding || {};
  const retention = result.retention || {};
  return Object.freeze({
    summary: planningSummary(combined, flooding, retention),
    discharge: dischargeInterpretation(result),
    dwa: dwaInterpretation(applicability, retention),
    normative: normativeStatement(combined, retention),
    recommendation: actionRecommendation(result, applicability, combined)
  });
}

export default buildFloodingInterpretationModel;
