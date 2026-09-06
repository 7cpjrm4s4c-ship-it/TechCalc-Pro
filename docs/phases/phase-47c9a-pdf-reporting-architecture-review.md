# Phase 47C.9A – PDF-/Reporting-Architekturreview

## Ziel

Phase 47C.9A definiert die verbindliche Architektur für den PDF-Export und den behördenfähigen Berechnungsnachweis des Moduls `flooding-verification`.

Die nachfolgenden Regeln gelten zugleich als verbindlicher Abschluss der PDF-Engine-Vereinheitlichung: Der Export läuft über die zentrale PDF-Engine. Module liefern ausschließlich strukturierte, layoutneutrale Typed-DTO-Daten.

## Geprüfter Ist-Zustand

### Zentrale Exportstrecke

Der globale Export wird in `js/core/pdfExport.js` initialisiert. Er liest zentrale Projekt- und Logo-Metadaten, sammelt die Typed-DTO-Daten des aktuell geöffneten Moduls über `pdfDataMapping.js` und übergibt diese an `GlobalPdfReport`.

`js/core/pdf/pdfLayout.js` bleibt die einzige PDF-Layout- und Dateierzeugungsinstanz. Module erzeugen keine PDF-Zeichenbefehle, keine Seitengeometrie und keine eigenen Exportdateien.

Die Dateierzeugung bleibt vollständig offlinefähig und benötigt keinen externen Dienst.

### Typed Report DTO statt Modul-DOM-Scraping

`pdfDataMapping.js` akzeptiert ausschließlich Modulreports mit gültigem Typed-DTO. Der frühere DOM-basierte Datenpfad wird nicht mehr als Ausweichpfad verwendet.

**Legacy-DOM-Fallback entfernt:** Fehlt ein Report-Adapter oder liefert er kein gültiges DTO, bricht der Export mit einer klaren Fehlermeldung ab. Sichtbare DOM-Texte, `data-pdf-field`-Marker oder gerenderte Karten sind keine Exportquelle mehr.

### Zentrale Layout-Engine

`pdfLayout.js` stellt weiterhin zentral bereit:

- Seiten- und Randgeometrie,
- Kopfbereich und Projektblock,
- App-Icon und optionales Firmenlogo,
- wiederholbare Abschnittstitel,
- dynamische Zeilenhöhen,
- Seitenumbruch über zusammenhängende Abschnitte,
- einheitliche Tabellenanker,
- rechtsbündige Werte und tabellarische Ziffern,
- mehrseitige PDF-Erzeugung.

Diese Engine bleibt der einzige Layoutpfad für Berechnungsprotokolle, Informationsblätter, Sicherheitsdatenblätter und Behördennachweise.

## Architekturentscheidung

### 1. Typed-DTO-Pflicht

Alle Module stellen ihren PDF-Inhalt über `createTypedDtoReportAdapter` bereit. Der Adapter trennt Berechnung, Ergebnisdarstellung und Exportdaten:

```text
State Snapshot
→ Calculation Adapter
→ Calculation Model
→ Result Model
→ Typed Report DTO
→ pdfDataMapping.js
→ GlobalPdfReport
```

Das DTO ist serialisierbar, fachlich strukturiert und frei von DOM-, HTML- und PDF-Zeichenlogik.

### 2. Keine Neuberechnung im Reporting

Der Reportpfad darf keine Fachwerte neu berechnen. Er darf:

- bereits berechnete Werte auswählen,
- Werte gruppieren,
- zentrale Formatierungsprofile anwenden,
- Quellen und Metadaten ergänzen.

Er darf nicht:

- Fachformeln erneut ausführen,
- eigene Rundungslogik definieren,
- Resultate aus sichtbaren DOM-Texten zurücklesen,
- HTML oder PDF-Zeichenbefehle erzeugen.

### 3. Klare Verantwortlichkeiten

| Schicht | Verantwortung |
|---|---|
| `calculationAdapter.js` | deterministische Fachberechnung |
| `results.js` | UI-orientiertes Result Model und zentrale Zahlenformate |
| Modul-DTO-Builder | fachlich vollständiges, layoutneutrales Report-DTO |
| `createTypedDtoReportAdapter` | zentrale Cache-, DTO- und Report-Schnittstelle |
| `pdfDataMapping.js` | zentrale Auswahl des passenden Typed-DTO-Section-Builders |
| `pdfLayout.js` | Seiten, Tabellen, Umbrüche, Kopf-/Fußbereiche und Bilder |
| `pdfExport.js` | Projektmetadaten, Exportauslösung und Dateidownload |

## Verbindlicher DTO-Rahmen für `flooding-verification`

Das DTO erhält mindestens:

```text
metadata
projectReference
summary
surfaces
rainfall
hydraulics
floodingVerification
retentionVerification
comparisons
diagnostics
interpretation
sources
```

`comparisons` umfasst den fachlichen Dauerstufen- und Variantenvergleich einschließlich `durationComparison`, soweit dieser im Berechnungsmodell vorhanden ist.

Alle numerischen Einträge müssen neben dem Rohwert ein eindeutiges Formatprofil beziehungsweise eine definierte Einheit besitzen. Freitexte werden als Klartext gespeichert.

## Dokumentreihenfolge für den Behördennachweis

Der Behördennachweis verwendet folgende fachliche Reihenfolge:

1. Projekt- und Dokumentmetadaten
2. Ergebniszusammenfassung
3. Nachweisstatus
4. Planerische Interpretation
5. Flächen- und Regendaten
6. Leitungs- und Abflussnachweis
7. DIN 1986-100 – Gleichung (20)
8. DIN 1986-100 – Gleichung (21) und Dauerstufen
9. DWA-A 117 – Anwendungsprüfung und Dauerstufen
10. Plausibilitätsprüfung und Diagnosen
11. Quellen, Normen, Versionen und Schema

## Risiken und Gegenmaßnahmen

### Risiko: UI und PDF weichen voneinander ab

Gegenmaßnahme: UI und Report verwenden dasselbe Calculation Model und dasselbe Result Model. Automatisierte Gates prüfen identische maßgebende Ergebnisse in UI und Report.

### Risiko: Reporting entwickelt parallele Fachlogik

Gegenmaßnahme: Statische Gates verbieten Berechnungsformeln und lokale Zahlenformatierung im Reportpfad. Der Reportpfad liest keine DOM-Ergebnisse aus.

### Risiko: Module ohne gültigen Report-Adapter werden unbemerkt exportiert

Gegenmaßnahme: Der zentrale Export bricht ohne gültiges Typed-DTO ab. Es gibt keinen Legacy-DOM-Fallback mehr.

### Risiko: Lange Tabellen erzeugen unvollständige Seiten

Gegenmaßnahme: Die zentrale Layout-Engine übernimmt wiederholte Tabellenköpfe und zusammenhängende Abschnittsgruppen.

## Gates für die Folgephasen

47C.9B bis 47C.9G müssen mindestens prüfen:

- DTO ist vollständig serialisierbar,
- keine DOM-Abhängigkeit im Moduladapter,
- keine Neuberechnung im Reporting,
- zentrale Zahlenformate und Einheiten,
- identische maßgebende Ergebnisse in UI und Report,
- mehrseitige Flächen- und Dauerstufentabellen,
- Export mit und ohne Firmenlogo,
- vollständiger Offline-Export,
- Regression aller bestehenden Module.

## Review-Ergebnis

Die zentrale PDF-Engine ist als technische Basis verbindlich. Der Legacy-DOM-Fallback ist entfernt. Alle Modulreports müssen über Typed-DTOs laufen und durch `pdfDataMapping.js` an `pdfLayout.js` übergeben werden.

Es bestehen keine offenen Architekturentscheidungen, die die weitere Pflege der zentralen PDF-Engine blockieren.
