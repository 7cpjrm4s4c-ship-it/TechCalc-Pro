# Phase 32A.3 - RC Bugfix: h,x Mobile Navigation and Immediate Actions

## Ziel

Stabilisierung der noch offenen h,x-UX-Punkte aus dem RC-Backlog ohne neue Architekturarbeit.

## Änderungen

### h,x-Diagramm

- Vorzeichen-Toggle wird jetzt bereits auf `pointerdown`/`touchstart` verarbeitet.
- `Diagramm leeren` wird ebenfalls früh im Event-Lifecycle verarbeitet.
- Doppelte Mobile-Event-Folgen (`touchstart` -> `pointerdown` -> `click`) werden dedupliziert.
- `Diagramm leeren` setzt neben Eingaben und aktivem Pfad auch den Prozess deterministisch auf `heat` und schließt expandierte Prozesskarten.

### Mobile Navigation

- Die globale mobile Modul-Navigation bleibt bei Keyboard-Open/Close-Zyklen sichtbar.
- Das vorherige Ausblenden über `body.tc-keyboard-open .module-nav` wurde durch eine sichtbare, klickbare Pill-Stabilisierung ersetzt.

### Regressionstest

- `tests/hx-diagram-phase32a3-mobile-action-hardening.test.mjs` ergänzt.
- Test prüft Quellcode-Guards für frühe h,x-Aktionen, Deduplizierung, deterministisches Clear-Verhalten und sichtbare mobile Navigation.
- Quality Gate bindet den Test ein.

## Validierung

- `npm run build` OK
- `npm run audit:imports` OK
- `npm test` OK

## Release-Risiko

Niedrig. Die Änderung ist auf h,x-Aktionshandling und eine globale mobile Navigationsregel begrenzt. Keine Datenmodell- oder Architekturänderung.
