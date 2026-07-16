# Phase 47C.9A – PDF-/Reporting-Architekturreview

## Ziel

Phase 47C.9A definiert die verbindliche Architektur für den behördenfähigen PDF- und Berechnungsnachweis des Moduls `flooding-verification`.

Die Phase enthält noch keine fachliche Report-DTO-Implementierung. Sie legt ausschließlich Grenzen, Datenflüsse, Verantwortlichkeiten und Gates für 47C.9B bis 47C.9G fest.

## Geprüfter Ist-Zustand

### Zentraler Exportpfad

Der globale Export wird in `js/core/pdfExport.js` initialisiert. Er:

- liest zentrale Projekt- und Firmenmetadaten,
- normalisiert Firmenlogo und optionale Diagramme,
- sammelt die Daten des aktuell geöffneten Moduls,
- übergibt diese an `GlobalPdfReport`,
- erzeugt und lädt die PDF-Datei lokal im Browser herunter.

Die Dateierzeugung bleibt vollständig offlinefähig und benötigt keinen externen Dienst.

### Aktuelles Datenmapping

`js/core/pdf/pdfDataMapping.js` extrahiert Eingaben und Ergebnisse derzeit generisch aus dem gerenderten DOM. Das Verfahren unterstützt bestehende einfache Module und bleibt als Legacy-Fallback erhalten.

Für den Überflutungsnachweis ist DOM-Extraktion allein nicht ausreichend, weil folgende Inhalte strukturiert und vollständig nachgewiesen werden müssen:

- vollständige Flächenliste einschließlich Herkunft und Abflussbeiwerten,
- DIN-1986-100-Nachweise nach Gleichung (20) und (21),
- DWA-A-117-Anwendungsprüfung und Dauerstufenvergleich,
- maßgebender Nachweis und planerisch anzusetzendes Volumen,
- Diagnosen, Plausibilitätsmeldungen und Empfehlungen,
- Quellen-, Versions- und Schemaangaben,
- eindeutige Beziehungen zwischen Eingabe, Zwischenergebnis und Endergebnis.

### Zentrale Layout-Engine

`js/core/pdf/pdfLayout.js` stellt bereits zentral bereit:

- Seiten- und Randgeometrie,
- Kopfbereich und Projektblock,
- App-Icon und Firmenlogo,
- wiederholbare Abschnittstitel,
- dynamische Zeilenhöhen,
- Seitenumbruch über `ensureSpace`,
- einheitliche Tabellenanker und rechtsbündige Werte,
- mehrseitige PDF-Erzeugung.

Diese Engine bleibt die einzige PDF-Layout- und Dateierzeugungsinstanz.

## Architekturentscheidung

### 1. Typed Report DTO statt Modul-DOM-Scraping

Ab 47C.9B stellt `flooding-verification` einen reinen Report-Adapter bereit. Dieser Adapter erzeugt ein serialisierbares Report-DTO aus:

```text
State Snapshot
→ Calculation Adapter
→ Calculation Model
→ Result Model
→ Flooding Report Adapter
→ Report DTO
→ Global PDF Mapping
→ GlobalPdfReport
```

Das Report-DTO wird bevorzugt verwendet. Die bestehende DOM-Extraktion bleibt ausschließlich Fallback für Module ohne Report-Adapter.

### 2. Keine Neuberechnung im Reporting

Der Report-Adapter darf:

- Werte auswählen,
- Werte gruppieren,
- zentrale Formatierungsprofile anwenden,
- Quellen und Metadaten ergänzen.

Der Report-Adapter darf nicht:

- Fachwerte neu berechnen,
- abweichende Rundungslogik definieren,
- Resultate aus sichtbaren DOM-Texten zurücklesen,
- HTML oder PDF-Zeichenbefehle erzeugen.

### 3. Klare Verantwortlichkeiten

| Schicht | Verantwortung |
|---|---|
| `calculationAdapter.js` | deterministische Fachberechnung |
| `results.js` | UI-orientiertes Result Model und zentrale Zahlenformate |
| `reportAdapter.js` ab 47C.9B | fachlich vollständiges, layoutneutrales Report-DTO |
| `pdfDataMapping.js` | Auswahl zwischen Typed DTO und Legacy-DOM-Fallback |
| `pdfLayout.js` | Seiten, Tabellen, Umbrüche, Kopf-/Fußbereiche, Bilder |
| `pdfExport.js` | Projektmetadaten, Exportauslösung und Dateidownload |

## Verbindlicher DTO-Rahmen für 47C.9B

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

Alle numerischen Einträge müssen neben dem Rohwert ein eindeutiges Formatprofil beziehungsweise eine definierte Einheit besitzen. Freitexte werden als Klartext gespeichert.

## Dokumentreihenfolge

Der spätere Behördennachweis verwendet folgende Reihenfolge:

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

Gegenmaßnahme: UI und Report verwenden dasselbe Calculation Model. 47C.9E vergleicht die maßgebenden Werte automatisiert.

### Risiko: Report-Adapter entwickelt parallele Fachlogik

Gegenmaßnahme: statisches Gate verbietet Berechnungsformeln und lokale `toFixed()`-/`toLocaleString()`-Formatierung im Adapter.

### Risiko: Legacy-Module werden durch das neue Mapping beschädigt

Gegenmaßnahme: Typed DTO ist optional. Ohne Adapter bleibt der bestehende DOM-Pfad unverändert aktiv.

### Risiko: Lange Tabellen erzeugen unvollständige Seiten

Gegenmaßnahme: 47C.9D erweitert ausschließlich die zentrale Layout-Engine um wiederholte Tabellenköpfe und zusammenhängende Zeilengruppen.

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

Die vorhandene zentrale PDF-Engine ist als technische Basis geeignet. Die Implementierung darf mit 47C.9B beginnen, sofern ein typed, layoutneutrales Report-DTO eingeführt und der bestehende DOM-Mapper nur als Legacy-Fallback beibehalten wird.

Es bestehen keine offenen Architekturentscheidungen, die 47C.9B blockieren.
