# Phase 47C.7B – Ergebnispriorisierung

## Ziel

Der DWA-A-117-Nachweis wird als vollständiges, priorisiertes Ergebnisobjekt ausgegeben. Dauerstufen, Anwendungsprüfung und Diagnose werden zentral modelliert; der Renderer enthält keine Fachentscheidungen.

## Dauerstufenvergleich

Jede Dauerstufe enthält:

- Dauer D,
- Regenspende r(D,n),
- spezifisches Speichervolumen Vs,u,
- Rückhaltevolumen V,
- Status.

Mögliche Statuswerte sind `gültig`, `maßgebend`, `ungültig` und `auf 0 m³ begrenzt`. Bei mehreren identischen Maximalwerten bleibt die kürzere Dauer deterministisch maßgebend. Genau eine gültige Dauerstufe wird als maßgebend markiert.

## Maßgebende Dauerstufe

Die kompakte Ergebnisgruppe enthält nur:

- maßgebende Dauer,
- Regenspende r(D,n),
- Vs,u,
- maßgebendes Rückhaltevolumen,
- Status.

## Anwendungsprüfung

Die Prüfung ist in drei zentrale Gruppen gegliedert:

1. Anwendungsbereich,
2. Gültigkeit fA,
3. Berechnung.

Die Einzelprüfungen tragen eine fachliche Gruppenzuordnung im Applicability Model. Die View sortiert oder interpretiert diese Prüfungen nicht selbst.

## Diagnosepriorisierung

Diagnosen werden zentral den Stufen Fehler, Warnung und Hinweis zugeordnet und in dieser Reihenfolge ausgegeben. Bestehende String-Meldungen bleiben aus Kompatibilitätsgründen erhalten; zusätzlich stehen strukturierte Diagnoseobjekte mit `severity` und `text` bereit.

## Regression

Die Tests sichern:

- genau eine maßgebende Dauerstufe,
- Status `gültig`, `maßgebend` und `ungültig`,
- vollständige Dauerstufenparameter,
- Gruppierung der Anwendungsprüfung,
- kompakte maßgebende Ergebnisgruppe,
- Priorisierung der Diagnoseausgabe,
- Kompatibilität bestehender Meldungs-Contracts.
