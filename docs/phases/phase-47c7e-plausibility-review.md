# Phase 47C.7E – Fachliche Plausibilitätsprüfung

## Ziel

47C.7E ergänzt die normativen Berechnungen um deterministische, beratende Plausibilitätsprüfungen. Die Prüfungen ersetzen keine projektspezifische Ingenieurprüfung und führen keine zusätzlichen Normanforderungen ein.

## Architektur

Die Regeln liegen zentral in `plausibilityModel.js`. Das Modell erzeugt strukturierte Findings mit Prüfcode, Schweregrad, Meldung und Handlungsempfehlung. `diagnosticModel.js` übernimmt diese Findings in den vorhandenen, priorisierten Diagnosepfad. Die View enthält keine Fachlogik.

## Prüfungen

- Wertebereich und Relation von Cₛ und Cₘ
- auffällig hohe beziehungsweise niedrige flächengewichtete Abflussbeiwerte
- fallende Regenspenden über zunehmende Dauerstufen
- Verhältnis r(D,30) zu r(D,2)
- ungültige Flächen
- mögliche doppelte Importquellen
- außergewöhnlich hohe hydraulische Auslastung
- negative Rohvolumina vor Begrenzung auf 0 m³
- DWA-A-117-Fließzeit außerhalb des empirischen fA-Bereichs
- unvollständige Quellenangaben der Regendaten

## Statuswirkung

- `error`: belastbarer Nachweis nicht möglich; Gesamtstatus wird unvollständig.
- `warning`: Berechnung kann vorliegen, fachliche Prüfung ist erforderlich.
- `recommendation`: dokumentierte Handlungsempfehlung ohne automatische Sperrwirkung.

## Abgrenzung

Advisory-Schwellen wie Cₛ > 0,95, Cₘ < 0,05 oder eine Auslastung > 1000 % sind ausdrücklich als Plausibilitätsindikatoren dokumentiert und nicht als normative Grenzwerte ausgewiesen.

## Regression

`tests/flooding-verification-phase47c7e-plausibility.test.mjs` prüft:

- plausiblen Referenzfall,
- unzulässige Cₘ/Cₛ-Relation,
- inkonsistente Regendauerreihen,
- falsches Wiederkehrzeitverhältnis,
- extreme Auslastung,
- fehlende Regenquellen,
- Integration in das zentrale Diagnosemodell.
