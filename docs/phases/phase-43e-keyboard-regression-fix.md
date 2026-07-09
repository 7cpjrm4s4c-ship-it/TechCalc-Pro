# Phase 43E – Trinkwasser Keyboard Regression Fix

## Anlass

Nach Phase 42E.5 war der mobile Input-Wechsel im Trinkwasser-Modul behoben. Die Desktop-Tab-/Enter-Navigation blieb jedoch innerhalb des Trinkwasser-Moduls inkonsistent, weil Trinkwasser zusätzliche Modul-Action-Buttons außerhalb der `.tc-save-actions` besitzt.

## Entscheidung

Der bestehende zentrale Keyboard-Vertrag bleibt gültig. Es wird kein lokaler Trinkwasser-Keyboard-Handler eingeführt.

Der zentrale Focus-Graph wird erweitert: normale Modul-Buttons innerhalb des gebundenen Modul-Roots sind Teil der zentralen Keyboard-Navigation. Globale Header-/Navigationsbuttons bleiben ausgeschlossen, weil der Event-Pipeline-Vertrag pro Modul-Root gebunden wird.

## Änderung

- `js/core/focusManager.js`
  - Focus-Graph umfasst jetzt `button:not([disabled]):not([data-skip-platform-focus])`.
  - Kommentar zur Root-gebundenen Abgrenzung ergänzt.

- `scripts/audit-keyboard-contract-phase42e3.mjs`
  - Regression-Guard erweitert, damit Modul-Buttons im zentralen Focus-Graph bleiben.

- `docs/contracts/keyboard-contract.md`
  - Modul-Action-Buttons als Bestandteil des zentralen Keyboard-Vertrags dokumentiert.
  - Ausschluss erfolgt künftig explizit mit `data-skip-platform-focus`.

## Nicht geändert

- Keine neue CSS-Datei.
- Kein lokaler Trinkwasser-Keyboard-Handler.
- Kein neuer Parallelvertrag.
- Keine Änderungen an Save-/Selection-/Render-Logik.

## Erwartetes Verhalten

- Tab und Shift+Tab traversieren alle relevanten Trinkwasser-Felder und Modul-Action-Buttons.
- Enter und Shift+Enter folgen dem zentralen Vertrag.
- Die Navigation fällt an Trinkwasser-spezifischen Action-Buttons nicht mehr aus dem zentralen Focus-Graph heraus.
