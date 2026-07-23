# Phase 47C.9B – Report DTO

## Ziel

Das Modul `flooding-verification` stellt einen typisierten, layoutneutralen und vollständig JSON-serialisierbaren Report-Datensatz bereit. Die zentrale PDF-Infrastruktur verwendet diesen Datensatz bevorzugt; die bestehende DOM-Extraktion bleibt ausschließlich als Legacy-Fallback für Module ohne Report-Adapter erhalten.

## Datenfluss

```text
Module State
  -> vorhandene calculate()-Fachlogik
  -> vorhandenes results()-Result Model
  -> buildFloodingReportDto()
  -> pdfDataMapping.collectCurrentModule()
  -> GlobalPdfReport
```

Der Report-Adapter führt keine eigene hydraulische oder normative Berechnung aus. Er übernimmt Werte ausschließlich aus State, Calculation Model und Result Model.

## DTO-Vertrag

DTO-Typ: `techcalc.flooding-verification.report`

DTO-Version: `1`

Top-Level-Bereiche:

- `metadata`
- `projectReference`
- `summary`
- `surfaces`
- `rainfall`
- `hydraulics`
- `floodingVerification`
- `retentionVerification`
- `durationComparison`
- `diagnostics`
- `interpretation`
- `resultGroups`
- `sources`

## Architekturregeln

- Keine DOM-Abfragen im Report-Adapter.
- Keine HTML-Fragmente oder PDF-Zeichenbefehle im DTO.
- Keine lokale Zahlenformatierung oder Rundung.
- Keine Wiederholung von DIN-, DWA- oder Hydraulikformeln.
- Alle Daten müssen mit `JSON.stringify()` serialisierbar sein.
- Der zentrale Module Runtime Contract transportiert optionale `report`-Adapter unverändert.
- Der zentrale PDF-Mapper kennzeichnet die Quelle mit `typed-dto` beziehungsweise `legacy-dom`.

## Flächenmodell

Jede Fläche enthält eine stabile Abbildung aus Bezeichnung, Kategorie, Flächenart, Fläche, Abflussbeiwerten, gewichteten Flächen, Herkunft, Importstatus und optionalem Snapshot. Änderungen am DTO wirken nicht auf den Modulzustand zurück.

## Nachweisbereiche

Der DIN-Block übernimmt Gleichung (20), Gleichung (21), Dauerstufen, maßgebenden Nachweis und Flächenkennwerte. Der DWA-Block übernimmt Anwendungsstatus, Faktoren, Wiederkehrhäufigkeit, Dauerstufenergebnisse, maßgebendes Rückhaltevolumen und Quellen der automatisch bestimmten Faktoren.

## Tests

`tests/flooding-verification-phase47c9b-report-dto.test.mjs` prüft:

- vollständigen DTO-Vertrag,
- Übereinstimmung der maßgebenden Volumina mit dem Calculation Model,
- vollständige JSON-Serialisierbarkeit,
- DOM- und PDF-Freiheit des Adapters,
- Registrierung im Platform Module Runtime,
- Typed-DTO-Priorität und Legacy-Fallback im zentralen PDF-Mapper.

## Abgrenzung

Phase 47C.9B definiert und integriert die Datengrundlage. Die behördenfähige Abschnittsreihenfolge, Tabellenstruktur und PDF-Auszeichnung werden erst in Phase 47C.9C umgesetzt.
