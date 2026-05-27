# TechCalc Pro 1.3.0 Plattform-Refactor

## Ziel

TechCalc Pro wird von einer modulgetriebenen App zu einer zentral gesteuerten Berechnungsplattform. Neue Module liefern nur noch fachliche Daten und Berechnungslogik. UI, UX, Persistenz, Validierung, Scrollverhalten, Zahlenformatierung und Ergebnisdarstellung kommen zentral aus dem Core.

## Leitprinzip

Design follows Funktion. Das Interface soll ruhig, eindeutig, wartbar und vorhersehbar sein. Ein neues Modul darf keine eigene UI-Welt eröffnen.

## Modulvertrag

Ein Modul soll perspektivisch nur noch diesen Vertrag erfüllen:

```js
export default {
  config,
  initialState,
  schema,
  calculate,
  results
};
```

Erlaubt im Modul:

- fachliche Berechnungslogik
- fachliche Tabellen / Normwerte
- Schema und Defaultwerte
- Validierungsregeln als Daten

Nicht erlaubt im Modul:

- eigenes CSS
- eigene Input-Komponenten
- eigene Buttons
- eigene Scroll-Fixes
- eigene Saved-Record-Listen
- eigene Zahlenparser
- eigene Ergebnislayouts

## Core-Schichten

```txt
js/core/
  moduleContract.js     Schema-, Ergebnis- und Modulvertrag
  numberService.js      einzige Zahlenquelle fuer de-DE Eingaben
  savedRecords.js       zentrale gespeicherte Inhalte
  renderer.js           zentrale UI-Bausteine
  mount.js              Render- und Scroll-Transaktion
  platformPolicy.js     technische App-Regeln
```

## Migrationsreihenfolge

1. Number-Service zentralisieren
2. Scroll-Transaktion in mount/render stabilisieren
3. Saved Records ausschließlich zentral verwenden
4. Regenwasser auf Schema-Modell vorbereiten
5. Entwässerung/Wastewater migrieren
6. Trinkwasser migrieren
7. h,x, Heizung/Kühlung, Druckhaltung migrieren
8. Neues Modul Überflutungsnachweis direkt nach Modulvertrag bauen

## Abnahmekriterien

- Kein Modul fuehrt neue CSS-Dateien oder modulbezogene UI-Komponenten ein.
- Deutsche Eingaben wie `2.500`, `2.500,5`, `2,5`, `2500` werden identisch korrekt behandelt.
- Auswahl, Abwahl und Löschen gespeicherter Inhalte verursachen keine Scroll-Sprünge.
- Ein Modul kann ohne eigenes Layout gerendert werden.
- Ergebnisse sind zentral formatiert und PDF-kompatibel.

## Phase 2 - Module an Plattform anbinden

Dieser Stand zieht die ersten bestehenden Module auf zentrale Plattformdienste, ohne die Fachlogik fachlich zu verändern.

### Zentral neu

- `js/core/scrollManager.js`
  - zentrale Scroll-Stabilitätsprofile (`default`, `action`, `savedRecord`)
  - keine modulindividuellen Timing-Arrays mehr für neue Migrationen
- `js/core/savedCalculationController.js`
  - einheitliche Save/Update/Load/Delete-Aktionen für gespeicherte Berechnungen
  - nutzt zentralen Scroll Manager für gespeicherte Inhalte

### Migriert

- Regenwasser
  - gespeicherte Berechnungen laufen über `bindSavedCalculationActions`
  - Scroll-Verhalten nutzt `scrollManager`
  - Fachzahlen laufen über `numberService`
- Schmutzwasser / Entwässerung
  - gespeicherte Berechnungen laufen über `bindSavedCalculationActions`
  - Mengen- und Berechnungszahlen laufen über `numberService`
  - bestehender Fixture-Editor bleibt fachlich unverändert

### Neue Regel ab Phase 2

Module dürfen für gespeicherte Berechnungen keine eigenen Save/Update/Load/Delete-Handler mehr implementieren. Neue oder migrierte Module nutzen ausschließlich `bindSavedCalculationActions` oder einen daraus abgeleiteten zentralen Controller.

Module dürfen keine eigene Zahlenparser-Logik mehr definieren. Fachlogik nutzt `numberService` oder kompatible Wrapper in `core/numbers.js`.

## Phase 3 - UI-System und CSS-Konsolidierung

Dieser Stand friert modulbezogene UI-Sonderwege ein und fuehrt zentrale `tc-*` Primitives fuer wiederkehrende UI-Muster ein.

### Zentral neu

- `js/core/uiSystem.js`
  - dokumentierte zentrale UI-Primitives
  - Helper fuer Warnungen, Hilfetexte, Formeln, Accordions und Notizkarten
- zentrale CSS-Primitives in `css/components.css`
  - `tc-list`, `tc-item`, `tc-consumer-list`, `tc-consumer-row`
  - `tc-fixture-list`, `tc-fixture-row`
  - `tc-accordion`, `tc-accordion__body`
  - `tc-warning-list`, `tc-warning`
  - `tc-help`, `tc-note`, `tc-formula`
- `docs/UI_SYSTEM_1_3_0.md`
  - verbindliche UI-Regeln fuer neue Module
- `scripts/audit-ui-classes.mjs`
  - Audit fuer Legacy-Modulklassen

### Migriert / angebunden

- Trinkwasser nutzt zentrale `tc-*` Klassen zusaetzlich zu bisherigen `dw-*` Alias-Klassen.
- Regenwasser und Schmutzwasser nutzen zentrale Listen-, Warnungs- und Formelklassen.
- Druckhaltung und Pufferspeicher nutzen zentrale Warnungs-, Hilfe- und Formelklassen.

### Neue Regel ab Phase 3

Neue UI-Muster werden ausschliesslich als `tc-*` Primitive eingefuehrt. Modulbezogene Klassen duerfen nur noch als temporaere Legacy-Aliasse in bestehenden Modulen bleiben. Fachliche Eventbindung erfolgt ueber `data-*` Attribute, nicht ueber Styling-Klassen.

## Phase 4 - Modulvertrag und schema-faehige Migration

Phase 4 macht den Modulvertrag explizit und pruefbar. Die Registry validiert Modul-Metadaten beim Registrieren. Konfigurationen werden ueber `defineModuleConfig` typisiert. Neue Plattformdateien:

- `js/core/moduleDefinition.js`
- `js/core/formSchema.js`
- `js/core/schemaModuleMount.js`
- `docs/MODULE_CONTRACT_1_3_0.md`
- `scripts/audit-module-contracts.mjs`

Regenwasser und Schmutzwasser besitzen erste zentrale Schemas. Diese sind bewusst noch als Adapter-Stufe eingebunden, damit die bestehende UI nicht bricht. Der naechste Schritt ist die schrittweise Entfernung modulindividueller View-Funktionen zugunsten des generischen Schema-Renderers.


## Phase 5 - Marktreife und Quality Gates

Phase 5 fuehrt eine verbindliche Qualitaetsschicht ein. Die App besitzt jetzt Regressionstests fuer deutsche Zahleneingabe, Plattformregeln, Modulvertrag und Syntax. `npm test` ist der zentrale Gate vor jedem Merge.

Neu hinzugekommen:

- `package.json` mit zentralen Test-/Audit-Scripts
- `scripts/quality-gate.mjs`
- `scripts/check-js-imports.mjs` als Syntax-Gate
- `tests/number-service.test.mjs`
- `tests/module-contract.test.mjs`
- `tests/platform-policy.test.mjs`
- `js/core/quality/performanceBudget.js`
- `js/core/quality/appHealth.js`
- `docs/QUALITY_GATES_1_3_0.md`

Damit ist 1.3.0 nicht nur ein Architekturumbau, sondern eine belastbare Release-Basis.
