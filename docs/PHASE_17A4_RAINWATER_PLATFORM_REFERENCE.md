# Phase 17A.4 - Rainwater Platform Reference Module

## Ziel

Regenwasser ist weiter entkernt und dient als Referenz fuer die naechsten Modulmigrationen. Das Modul liefert nur noch Fachlogik, State-Mapping, Schema und Ergebnisdaten. Die Plattform uebernimmt Formularlayout, Shell, Result-Renderer und Saved-Record-Darstellung.

## Plattform-Erweiterungen

### `js/platform/moduleRenderer/`

Neue zentrale Komponente:

- `renderPlatformModuleView()`
- kombiniert `renderModuleShell()`
- rendert Eingaben ueber `renderFormSchema()`
- rendert Ergebnisse ueber `renderResultModel()`
- rendert gespeicherte Datensaetze ueber `renderSavedRecordPanel()` und `renderSavedRecordList()`

Damit werden Layout, Spalten, Card-Struktur und Save-Panel nicht mehr im Regenwasser-Modul gebaut.

### Schema-Renderer

Der globale Schema-Renderer kann jetzt dynamische Moduldefinitionen abbilden:

- dynamische Labels
- dynamische Select-Optionen
- dynamische Units
- dynamische Placeholder
- `visibleWhen` mit Funktionsprädikaten
- `CUSTOM` Schemafelder fuer kleine fachliche Spezialanzeigen
- `beforeHtml` / `afterHtml` je Schema-Gruppe

## Regenwasser nach der Entkernung

### `index.js`

Bleibt verantwortlich fuer:

- Store-Mount
- zentrale Action-Registrierung
- Snapshot/Hydration der Regenflächen
- Lookup-Normalisierung
- Scroll-stabile Saved-Record-Aktionen

Nicht mehr verantwortlich fuer:

- Eingabe-Cards
- Result-Cards
- Notice-Cards
- Saved-Record-Listenmarkup
- Modul-Shell-Layout

### `schema.js`

Beschreibt die komplette Eingabeoberfläche datengetrieben:

- Berechnungsbereich
- Regenspende
- Dacheinläufe / Hoftöpfe
- Notentwässerung
- Regenfläche

### `results.js`

Liefert reine Datenmodelle:

- `results(state, result)` fuer Ergebnisgruppen, Hinweise und Primärergebnis
- `savedRecords(state, result)` fuer gespeicherte Regenflächen als Record-Datenmodell

## Referenz fuer weitere Module

Die naechsten Module sollen demselben Muster folgen:

1. Eingaben nach `schema.js`
2. Ergebnisdaten nach `results.js`
3. Saved-Record-Datenmodell nach `results.js` oder eigenem Model-File
4. UI-Ausgabe nur noch ueber `renderPlatformModuleView()`
5. Modul-Index nur noch Mount, Actions, Snapshot/Hydration und fachliche Store-Patches

## Qualität

`npm test` laeuft vollstaendig durch.

Audit Regenwasser:

```bash
grep -RIn "renderResult\|resultCard\|noticeCard" js/modules/rainwater
```

liefert nur noch einen Legacy-Regressionsanker fuer bestehende Tests, keine produktive Renderlogik.
