# Phase 36Q.2 – Regenwasser Anzeige ausgewählter Fläche

## Änderung
Die Regenwasser-Ergebnisanzeige leitet die angezeigte Fläche jetzt robust aus dem aktiven Datensatz ab:

1. `activeSurfaceId` aus dem State
2. `r.selectedSurfaceId`
3. `r.selectedSurface`
4. letzter vorhandener Datensatz als Fallback

## Behoben
- Quelle/Name der markierten gespeicherten Fläche wird wieder korrekt angezeigt.
- Flächenart wird explizit angezeigt.
- Cs/Cm/Fläche/Regenspenden/Ablaufwerte werden bevorzugt aus dem aktiven Surface-Datensatz gelesen.
- Saved-Record-Snapshot wurde um Anzeige-/Statistikwerte erweitert.

## Nicht geändert
- Berechnungslogik
- Saved-Record-Pfad
- CSS/Spacing
