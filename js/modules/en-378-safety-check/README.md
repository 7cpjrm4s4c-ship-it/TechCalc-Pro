# EN 378 Sicherheitscheck

Das Modul bewertet einen importierten Anlagenstand aus dem F-Gase-Check für die sicherheitstechnische Betrachtung nach EN 378.

## Modulgrenze

Das Modul enthält ausschließlich sicherheitstechnische Bewertungen. Regulatorische Prüfungen der F-Gase-Verordnung bleiben im Modul `f-gases-check`.

Der Datenaustausch erfolgt über versionierte Snapshots. Importierte Daten werden als Kopie übernommen. Nachträgliche Änderungen am F-Gase-Anlagenstand ändern bestehende EN-378-Bewertungen nicht automatisch.

## Fachliche Abdeckung

Der aktuelle Stand deckt die Kernbewertung für Planerinnen und Planer ab:

- Import von Anlage, Kältemittel und Füllmenge aus gespeicherten F-Gase-Anlagenständen.
- Kältemittel-Sicherheitsdaten nach EN 378-1 Anhang E für den TechCalc-Pro-Kältemittelstamm.
- Füllmengenbewertung nach EN 378-1 Anhang C, Tabellen C.1 und C.2.
- Bewertung alternativer Vorkehrungen nach EN 378-1 C.3 mit Bezug auf EN 378-3 Abschnitt 6 und Abschnitt 8.
- Sicherheitsanforderungen für Aufstellort, Maschinenraum, Lüftung, Detektion, Alarmierung, Abschaltung, Warnhinweise und Sichtprüfung.
- Planer-Leitfaden mit deutschen Volltexten für erforderliche Maßnahmen und offene Angaben.
- Eigene PDF-Ausgabe für den EN-378-Sicherheitsbericht.

## Alternative Vorkehrungen nach C.3

Der C.3-Pfad wird nur bewertet, wenn alternative Vorkehrungen vorgesehen sind oder wenn eine Grenzwertüberschreitung diesen Pfad erforderlich macht.

Das Modul ermittelt:

- ob keine, eine oder zwei zusätzliche Maßnahmen erforderlich sind,
- welche Maßnahmen ausgewählt wurden,
- ob die Mindestanzahl erfüllt ist,
- die erforderliche freie Öffnungsfläche für Verdünnungsöffnungen,
- den vereinfachten mechanischen Luftstrom nach Q = 10 / RCL,
- ob ausgewählte Absperrventile, Detektion und Alarmierung vollständig abgesichert sind.

## UI- und Berichtsvorgaben

Sichtbare Oberfläche und PDF-Bericht verwenden deutsche Volltexte. Interne Schlüssel, technische Statuswerte oder Feldnamen dürfen nicht in UI oder PDF erscheinen.

Lange deutsche Texte werden wortweise beziehungsweise mit zulässiger Silbentrennung umbrochen. Eine Trennung einzelner Buchstaben ist nicht zulässig.

## Qualitätsnachweise

Relevante Tests:

```bash
npm run test:en378
node scripts/test-en-378-refrigerant-coverage.mjs
node scripts/test-en-378-alternative-risk-measures.mjs
```

Release-Gates:

```bash
npm run version:check
npm run precache:check
npm run audit:release-readiness
npm run lint
npm test
```
