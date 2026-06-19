# Phase 37C.2E – Surface Confirm No-Op Suppression

## Befund

Nach 37C.2D blieb der mobile Scrollsprung im Trinkwasser-Modul bestehen. Die Logs zeigten weiterhin wiederholte `surface:confirm`-Events ohne fachliche Änderung. Ursache war nicht mehr der Trinkwasser-Renderer selbst, sondern die zentrale Surface-Confirm-Pipeline: `commitAllFields()` schrieb alle sichtbaren Felder mit `notify:true`, selbst wenn kein Wert geändert wurde.

## Änderung

`commitAllFields()` vergleicht DOM-Feldwerte nun mit dem aktuellen State und erzeugt nur noch einen Patch für tatsächlich geänderte Felder. Wenn kein Feld geändert wurde, gibt die Funktion `false` zurück und löst keinen Store-Notify aus.

`confirmSurface()` reagiert darauf:

- geänderte Felder: normaler `surface:confirm`
- keine geänderten Felder, aber deferred input: `input:confirm`
- keine geänderten Felder und kein deferred input: kein Notify

## Ziel

Passive Touch-/Tap-/Scroll-End-Interaktionen dürfen keine Dynamic-Renderer-Kette auslösen, wenn sich keine Eingabewerte geändert haben.
