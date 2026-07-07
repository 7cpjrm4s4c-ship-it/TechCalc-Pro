# Phase 36C – Controller-Erzeugung wie Heizung

## Ziel
Regenwasser und Schmutzwasser erzeugen den `createLineSectionController` jetzt wie Heizung direkt in `index.js`.

## Änderungen
- `createLineSectionController(...)` aus den Modul-Controllern entfernt.
- Controller-Konfiguration nach `index.js` verschoben.
- View, Bind und DynamicUpdate verwenden dieselbe `lineSectionController`-Instanz.
- Modul-Controller liefern nur noch Domain-Helper wie `buildRecord`, `hydrate`, `stats`, `subtitle`.

## Ergebnis
Der Saved-Record-Pfad entspricht dem Heizung-Muster wesentlich genauer:
`index.js -> createLineSectionController -> createView -> bind -> dynamicUpdate`.
