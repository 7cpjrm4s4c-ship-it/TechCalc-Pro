# Phase 36Q.3 – Linker Speicherpfad + h,x Final-Fix

## Regenwasser
Zielstruktur gemäß Festlegung:
- linke Spalte: Eingaben + gespeicherte Flächen
- rechte Spalte: Ergebnisse

## Schmutzwasser
Zielstruktur gemäß Festlegung:
- linke Spalte: Eingaben + gespeicherte Berechnungen
- rechte Spalte: Ergebnis / Dimensionierung

Zusätzlich wurde `renderWastewaterFixtures()` auf die globale `tc-consumer-row` / `tc-collection-row`-Darstellung umgestellt, der bestehende Collection-Action-Vertrag bleibt erhalten.

## h,x
Der finale `renderDynamicSections()`-Stand wurde wieder in die Projekt-ZIP übernommen:
- Saved-Aktionen aktualisieren nur Saved-Controls und Saved-Rows
- Prozessauswahl, Ergebnis und Diagramm werden bei Saved-Aktionen nicht neu gerendert
