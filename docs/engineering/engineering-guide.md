# Engineering Guide

## Ziel

TechCalc Pro wird als versioniertes Softwareprodukt weiterentwickelt. Jede Aenderung muss nachvollziehbar, testbar und ruecksetzbar sein.

## Arbeitsablauf

1. **Analyse**
   - Relevante Dokumentation und Contracts lesen.
   - Betroffene Module und zentrale Plattformkomponenten identifizieren.
   - Bestehende Referenzmodule pruefen.

2. **Design Review**
   - Ziel, Nicht-Ziele, Risiko und Regressionen festlegen.
   - Bestaetigen, ob bestehende Contracts ausreichen.
   - Neue Regeln nur mit dokumentierter Begruendung einfuehren.

3. **Implementierung**
   - Kleine, thematisch geschlossene Commits.
   - Keine Sammelpatches mit gemischtem Scope.
   - Legacy entfernen statt ueber weitere Guards zu ueberbauen.

4. **Regression**
   - Passende Referenzmodule testen.
   - `npm test`, `npm run test:integration`, `npm run build` ausfuehren.
   - Manuelle Zielplattformen pruefen, wenn UI, Keyboard, PWA oder Mobile Input betroffen sind.

5. **Dokumentation**
   - Phasendokument aktualisieren.
   - Contracts aktualisieren, wenn sich ein Vertrag aendert.
   - ADR erfassen, wenn eine wesentliche Architekturentscheidung getroffen wird.

## Nicht erlaubt ohne dokumentierte Ausnahme

- neue CSS-Hotfixdateien fuer einzelne Bugs
- modulinterne Save-/Selection-/Keyboard-Vertraege
- lokale Scroll-Restore-Ketten neben dem zentralen Vertrag
- vollstaendige Rebuilds grosser UI-Inseln nach einfachen Field-Commits
- neue globale Event-Listener ohne Contract-Bezug
- Architekturentscheidungen nur in Release Notes oder Chatverlauf
