# Phase 34C – Module CSS Isolation

## Ziel

Nach dem Rebuild aus Phase 34B wird die Trennung zwischen globalem Design-System und modulbezogenen Sonderfällen technisch abgesichert.

## Entscheidung

`components.css` bleibt der einzige Ort für globale Geometrie:

- Cards
- Controls
- Inputs und Selects
- Buttons
- Result Rows
- Inline Stats
- Saved Record Cards
- globale Abstände und Radien

`modules.css` darf nur noch enthalten:

- Modul-Layouts, die fachlich notwendig sind
- Diagramm-/SVG-spezifische Regeln
- responsive Sonderfälle für fachliche Widgets
- reine Darstellungsdetails ohne globale Komponenten-Geometrie

## Umsetzung

- `modules.css` explizit als Exception-Layer dokumentiert
- verbliebene `!important`-Overrides entfernt
- Audit `scripts/audit-modules-css-isolation-phase34c.mjs` ergänzt
- Test `tests/phase34c-modules-css-isolation.test.mjs` ergänzt
- Audit-Ausgabe nach `docs/audits/css/phase34c-modules-css-isolation.json`

## Release-Regel

Neue UI-Geometrie darf nicht mehr in Moduldateien gepatcht werden. Falls eine Card, ein Input, ein Button, ein Toggle oder ein Saved Record anders aussieht, muss zuerst das globale Primitive angepasst werden.
