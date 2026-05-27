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
