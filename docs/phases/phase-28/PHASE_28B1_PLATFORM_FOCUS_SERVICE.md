# Phase 28B.1 - Platform Focus Service Foundation

## Ziel

Phase 28B.1 fuehrt eine zentrale Fokus-Infrastruktur ein, ohne die fachliche Enter-/Tab-Navigation aus 28B.2/28B.3 vorwegzunehmen.

## Neue Infrastruktur

- `js/core/focusManager.js`
- `PlatformFocusManager`
- `safeFocus()` mit `preventScroll` als Standard
- `restoreFocus()` fuer Render-/Mount-Restore
- `focusNext()` fuer bestehende Enter-Weiterleitung
- `getPlatformFields()` fuer spaetere Tab-/Enter-Orchestrierung

## Integrierte Core-Pfade

- `domUpdate.js`: Restore-Fokus nach DOM-Replacement
- `moduleRuntime.js`: Root-Fokus nach Modul-Mount
- `eventPipeline.js`: bestehende Enter-Weiterleitung delegiert an den Service

## Bewusste Nicht-Ziele

- Keine neue Tab-Reihenfolge
- Keine Veraenderung der Enter-Semantik
- Keine Dynamic-Input-Sonderlogik

Diese Themen folgen in 28B.2 bis 28B.4.
