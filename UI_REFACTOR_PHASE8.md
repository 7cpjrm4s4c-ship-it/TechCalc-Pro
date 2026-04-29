# TechCalc Pro UI Refactor – Phase 8

## Inhalt
- Vollständige Neu-Auslieferung auf Basis des kompletten Phase-7-Pakets.
- `body.tc-app.tc-ui-v8` als aktuelle zentrale App-Klammer.
- Finale Konsolidierungsschicht für Header-Abstand, Grid-Abstände, Cards, Inputs, Results und Mobile Bottom Navigation.
- Modul-Akzente bleiben über zentrale Custom Properties steuerbar.
- PDF-/Print-Regeln bleiben getrennt und werden nur mit minimalem Schutz gegen App-Navigation ergänzt.

## Zielzustand
Neue Module sollen künftig ausschließlich die zentralen `tcp-*` Layout-/Komponentenklassen und eine Modul-Akzentklasse verwenden. Moduldateien dürfen keine eigenen Desktop-/Mobile-Grids oder Header-Abstände definieren.
