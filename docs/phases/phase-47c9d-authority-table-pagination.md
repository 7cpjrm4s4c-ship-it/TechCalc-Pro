# Phase 47C.9D – Behördenfähiges Tabellen- und Seitenlayout

## Status

Abgeschlossen.

## Ziel

47C.9D ergänzt die in 47C.9C definierte Behördenstruktur um eine zentrale, deterministische Tabellen- und Pagination-Policy. Fachberechnung, Report DTO und bestehender Legacy-DOM-Fallback bleiben unverändert.

## Implementierte Komponenten

- `authorityTableLayout.js`: dreispaltiges Behördenraster mit automatischen Breiten, dynamischer Zeilenhöhe und rechtsbündigen Wert-/Einheitenspalten.
- `authorityPagination.js`: zeilenbasierte Pagination, Keep-Together-Regeln, Fortsetzungskennzeichnung und begrenzte Chunk-Größe.
- `authorityHeaderPolicy.js`: verbindliche und auf Folgeseiten wiederholte Tabellenköpfe.
- `authorityHighlightPolicy.js`: zentrale Typografie- und Hervorhebungstokens für maßgebende Werte, Dauern, DIN/DWA, Warnungen, Fehler und Empfehlungen.
- `authorityLargeDocument.js`: deterministische Vorbereitung großer Berichte, Warnschwelle ab 500 Zeilen und Schutzgrenze bei 5000 Zeilen.

## Layoutvertrag

Jede Behördentabelle verwendet die Spalten:

1. Bezeichnung – linksbündig
2. Wert – rechtsbündig
3. Einheit – rechtsbündig

Mehrzeilige Inhalte erhöhen die Zeilenhöhe. Tabellenzeilen werden nicht zwischen Seiten geteilt. Jede Folgeseite erhält Kapitelbezeichnung mit `Fortsetzung` und den vollständigen Tabellenkopf.

## Regression Gate

`tests/flooding-verification-phase47c9d-authority-table-layout.test.mjs` prüft:

- automatische Spaltenbreiten,
- konsistente Ausrichtung,
- dynamische Pagination,
- wiederholte Tabellenköpfe,
- Fortsetzungsüberschriften,
- maximale Chunk-Größe,
- normative Hervorhebung,
- große Dokumente mit mehr als 600 Tabellenzeilen,
- JSON-Serialisierbarkeit.

Der Test ist im zentralen Phase-47C-Regressionsrunner registriert. Dieser umfasst nun 38 Testdateien.

## Abgrenzung

47C.9D ändert keine Bemessungsformeln und keine fachlichen Ergebnisse. Die Wertgleichheit zwischen UI, DTO und PDF wird in 47C.9E als eigenes Gate geprüft.
