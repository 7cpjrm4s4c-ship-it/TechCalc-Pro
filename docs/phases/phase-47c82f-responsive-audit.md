# Phase 47C.8.2F – Responsive Audit

## Ziel

Die Ergebnisdarstellung des Überflutungsnachweises bleibt auf Desktop, Tablet und Smartphone vollständig lesbar, überlagerungsfrei und ohne horizontale Scrollartefakte.

## Viewport-Verträge

- Desktop ab 1024 px: Bemessungsdetails in fünf Spalten; Interpretation und Nachweisstatus mit fester 200-px-Labelspalte.
- Tablet 768–1023 px: Bemessungsdetails in zwei Spalten; die Begründung belegt die vollständige Zeile.
- Smartphone bis 767 px: einspaltige Ergebnisdarstellung; Werte linksbündig unter dem Label.

## Schutzregeln

- Result-Gruppen, Result-Listen, Zeilen, Cards und Card-Inhalte dürfen auf Tablet und Smartphone auf `min-width: 0` schrumpfen.
- Lange Diagnose- und Interpretationstexte umbrechen ausschließlich innerhalb ihres Containers.
- Verschachtelte DWA-A-117-Cards bleiben innerhalb der verfügbaren Viewportbreite.
- Die feste 200-px-Labelspalte gilt ausschließlich für Desktop.

## Regression

`tests/flooding-verification-phase47c82f-responsive-audit.test.mjs` prüft die drei Viewportstufen, das Verhalten der breiten Begründung, den mobilen Rückfall der festen Result-Spalten und den Schutz vor horizontalem Überlauf.
