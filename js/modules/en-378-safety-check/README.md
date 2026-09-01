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
- Plausibilitätsprüfung für widersprüchliche Kombinationen aus Aufstellort, Aufstellungsort-Klassifikation, Zugangsbereich und Lüftungsangaben.
- Planer-Leitfaden mit deutschen Volltexten für erforderliche Maßnahmen und offene Angaben.
- Eigene PDF-Ausgabe für den EN-378-Sicherheitsbericht.

## Eingabeführung

Die Oberfläche zeigt nur die für den aktuellen Bewertungspfad relevanten Detailfelder an.

Die Kategorie des Zugangsbereichs wird aus dem gewählten Zugangsbereich abgeleitet:

- allgemeiner Zugang → Kategorie a,
- beaufsichtigter Zugang → Kategorie b,
- Zugang nur für unterwiesene oder befugte Personen → Kategorie c.

Die Kategorie muss in der Regel nicht zusätzlich ausgewählt werden. Bei alten gespeicherten Zuständen kann das Feld noch sichtbar werden, damit vorhandene Daten nicht verloren gehen.

Für Anwendungen zum menschlichen Komfort werden Raumfläche, Montageart und die Angabe zur werkseitig dauerhaft geschlossenen Ausführung nur dann abgefragt, wenn diese Angaben für den gewählten Bewertungspfad erforderlich sind.

## Plausibilitätsprüfung

Das Modul prüft offensichtliche Widersprüche der Eingaben, bevor der Leitfaden als belastbar bewertet wird. Dazu gehören insbesondere:

- Klasse II oder Klasse III ohne Maschinenraum beziehungsweise Außenaufstellung,
- Klasse IV ohne Personen-Aufenthaltsbereich,
- Maschinenraum mit allgemeinem oder beaufsichtigtem Zugang,
- widersprüchliche Lüftungsangaben.

Diese Prüfung ersetzt keine Fachplanung, verhindert aber widersprüchliche Grundannahmen im Bericht.

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
node scripts/test-en-378-contextual-inputs.mjs
node scripts/test-en-378-state-consistency.mjs
```

Release-Gates:

```bash
npm run version:check
npm run precache:check
npm run audit:release-readiness
npm run lint
npm test
```
