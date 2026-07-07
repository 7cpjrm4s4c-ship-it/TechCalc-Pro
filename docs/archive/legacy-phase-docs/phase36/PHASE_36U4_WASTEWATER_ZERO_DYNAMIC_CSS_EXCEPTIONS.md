# Phase 36U.4 – Wastewater Zero Dynamic CSS Exceptions

## Ziel
Schmutzwasser wird auf denselben Dynamic-Wrapper-Pfad wie Regenwasser nach 36T.6 gebracht.

## Umsetzung
Entfernt aus CSS:

- `[data-ww-dynamic]`
- alle `[data-ww-dynamic="..."]`
- alle `.module-view[data-module='wastewater'] ...` Sonderregeln

## Begründung
Die `data-ww-dynamic` Wrapper besitzen im Markup bereits `class="tc-stack"`.
Damit sollen sie ihre Abstände ausschließlich über globale Plattform-Primitive erhalten, nicht über Modul- oder Dynamic-Sonderregeln.

## Nicht geändert
- Keine JavaScript-Logik
- Keine Berechnungslogik
- Keine Saved-Record-Pfade
- Keine Collection-Action-Verträge
- Dynamic-Wrapper bleiben im DOM erhalten
