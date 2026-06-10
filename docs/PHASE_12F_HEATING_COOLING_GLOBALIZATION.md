# Phase 12F – Heizung/Kälte Globalisierung fortgeführt

## Ziel
Heizung/Kälte bleibt auf dem store-first Modulpfad und darf nach dem Initial-Render keine statischen Cards mehr durch Speicher-/Listenaktionen neu aufbauen.

## Änderungen
- Fehlerhaften dynamischen Save-Control-Aufruf im statischen `view()` entfernt.
- Line-/Saved-Aktionen von App-Strukturaktionen getrennt.
- Speichern, Aktualisieren und Auswahl gespeicherter Leitungsabschnitte aktualisieren nur noch Save Controls und Saved-Record-Liste.
- Eingabefelder werden nur noch bei Betriebsart-, Ziel-, Einheitenwechsel oder App-Strukturänderung neu aufgebaut.
- Regressionstest erweitert, damit Line-/Saved-Aktionen keine Input-Card-Rebuilds mehr erzwingen.

## Akzeptanzkriterien
- `npm test` erfolgreich.
- Heizung/Kälte rendert das Shell-Layout initial genau einmal.
- Saved-Record-Aktionen laufen store-first.
- Dynamische Inseln bleiben die einzige Update-Zone nach dem Initial-Render.
