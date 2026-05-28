# Phase 13 — Heizung/Kälte Modulstabilisierung

Ziel: Heizung/Kälte wird modulweise stabilisiert, ohne weitere globale Scroll- oder Render-Patches einzuführen.

## Behoben

- Medium-Auswahl aktualisiert die hinterlegten Mediumdaten unmittelbar.
- Rohrmaterial-Auswahl aktualisiert die Rohrdimensionsempfehlung unmittelbar.
- Betriebsart-Switch Heizung/Kälte funktioniert wieder über einen modulnahen Adapter.
- Berechnungsziel-Switch Leistung/Massenstrom/Temperaturspreizung funktioniert wieder.
- Eingaben berechnen nach `blur`, `change` oder `Enter` ohne zusätzlichen Klick auf die freie App-Fläche.
- Leitungsabschnitte können wieder gespeichert, ausgewählt und in den Bearbeitungsmodus geladen werden.

## Technische Entscheidung

Das Modul besitzt vorübergehend `bindHeatingCoolingInteractionAdapter`. Dieser Adapter ist bewusst klein gehalten und kapselt nur die fachliche Kopplung aus:

- Stammdaten-Auswahl → abgeleitete Eigenschaften
- Segment-Auswahl → aktiver Berechnungsmodus
- Eingabebestätigung → sofortige Berechnung
- Leitungsabschnitt-Auswahl → Bearbeitungszustand

Der Adapter ist ein Kandidat für die spätere zentrale Modul-Engine, sobald weitere Module analog migriert sind.
