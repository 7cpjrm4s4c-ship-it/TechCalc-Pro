# Phase 17C.2 – Referenzmodule Bugfix-Nachzug

## Ziel

Die in der mobilen Deploy-Preview weiterhin sichtbaren Fehler in den Referenzmodulen Schmutzwasser und Regenwasser werden zentral in der Plattform behoben.

## Behobene Punkte

### Schmutzwasser

- Die Collection-Zeile nutzt kompaktere Plattform-Spalten fuer Mengenfeld und Loeschen-Button.
- Lange Bezeichnungen von Entwaesserungsgegenstaenden umbrechen innerhalb der Content-Spalte und kollidieren nicht mehr mit dem Anzahl-Feld.
- Gespeicherte Eintraege erhalten eine direkte Plattform-Bindung fuer Auswahl, Toggle und Loeschen. Damit ist Markieren/Bearbeiten auf mobilen Browsern nicht mehr vom synthetischen Click nach Touch-Gesten abhaengig.

### Regenwasser

- Der Segmentwechsel des Berechnungsbereichs erzwingt nach dem State-Patch einen synchronen Plattform-Render-Flush.
- Die Regenspende-Beschriftung schaltet damit unmittelbar von `r(5,5)` auf `r(5,2)` beziehungsweise zurueck.
- Gespeicherte Eintraege verwenden denselben direkten Plattform-Saved-Record-Pfad wie Schmutzwasser.

## Plattform-Aenderungen

- `platform/moduleRuntime` nutzt `getRenderScheduler(root).flushNow()` fuer Segment-Aktionen.
- `platform/moduleRuntime` bindet Saved-Record-Karten zusaetzlich direkt auf Plattformebene.
- `css/components.css` ergaenzt einen kompakten `tc-collection-row`-Vertrag fuer Referenzmodule.

## Regression

Neue Regression:

- `tests/reference-modules-phase17c2-reference-fixes.test.mjs`

Der Quality Gate wurde erfolgreich ausgefuehrt.
