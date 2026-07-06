# Phase 42E.5 – Mobile Input Contract Audit

## Ziel

Phase 42E.5 schliesst eine Trinkwasser-spezifische Eingabe-Regression, die nicht durch den KeyboardController verursacht wurde. Auf mobilen Browsern musste nach dem Verlassen eines Trinkwasser-Inputs ein zweites Mal getippt werden, bevor das naechste Input fokussiert werden konnte.

## Befund

Der Fehler lag nicht im zentralen Tab-/Enter-Vertrag, sondern in der lokalen Trinkwasser-Commit-/Render-Kette:

- `js/modules/drinking-water/controller.js` hatte eigene `input`-/`change`-Listener fuer normale `[data-field]` Felder.
- Der lokale `change`-Handler rief `refreshDrinkingWater(root)` auf.
- `refreshDrinkingWater(root)` ersetzte den gesamten Trinkwasser-Input-Island-Inhalt.
- Auf mobilen Browsern passiert `change`/`blur` waehrend der naechste Tap noch aufgeloest wird.
- Das naechste Input wurde dadurch ersetzt, bevor es Fokus erhalten konnte.

Damit war ein zweiter Tap erforderlich.

## Entscheidung

Normale `[data-field]` Eingaben gehoeren vollstaendig dem zentralen Event-/Input-Vertrag:

- `eventPipeline` committed `input`, `change`, `blur`, `Enter` und `Tab`.
- Trinkwasser darf keine parallelen Standard-Field-Listener fuer dieselben Felder besitzen.
- Trinkwasser-spezifisch bleiben nur die eigenen Draft-/Collection-Controls.

## Umsetzung

### Controller

In `js/modules/drinking-water/controller.js` wurden lokale Standard-Field-Listener entfernt:

- lokaler `input`-Listener fuer `[data-field]` entfernt
- lokaler `change`-Listener fuer `[data-field]` entfernt
- `data-dw-draft-count` bleibt als Trinkwasser-spezifischer Collection-Adapter bestehen
- Draft-Count aktualisiert nur den Ergebnisbereich, nicht den kompletten Input-Island

### Dynamic Renderer

In `js/modules/drinking-water/dynamicRenderer.js` wurde der Render-Vertrag gehaertet:

- Field-Commit-Actions (`field:*`, `input:confirm`, `binding:*`) ersetzen nicht mehr den Trinkwasser-Input-Island.
- Strukturaktionen (`dw:*`, `line:*`, `saved:*`) duerfen den Input-Island weiterhin rendern.
- Aktuelle DOM-Werte werden ueber `syncFields()` synchronisiert, ohne das gerade fokussierte Input zu ersetzen.

## Verbindliche Regel

Ein Modul darf bei mobilen Standard-Field-Commits keine ganze Input-Card oder Input-Island ersetzen. Field-Commits duerfen State und Ergebniswerte aktualisieren, aber aktive bzw. naechstangetippte Eingabeelemente nicht durch `innerHTML`, `safeReplaceContent` oder vergleichbare Rebuilds ersetzen.

## Regression

Gepruefte Gates:

- `npm test`
- `npm run test:integration`
- `npm run build`

## Status

Phase 42E.5 ist abgeschlossen, sobald der mobile Trinkwasser-Wechsel von einem Input direkt in das naechste Input ohne zweiten Tap bestaetigt ist.
