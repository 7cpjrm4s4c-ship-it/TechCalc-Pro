# Save/Edit Contract

Status: verbindlich ab Phase 42D

## Ziel

Speichern, Aktualisieren und Edit-Modus folgen appweit einem zentralen Vertrag.

## Referenzmodule

- Heizung/Kälte
- Druckhaltung

## Regeln

1. Ohne Auswahl ist `Speichern` aktiv und `Aktualisieren` deaktiviert.
2. Mit Auswahl ist `Speichern` deaktiviert und `Aktualisieren` aktiv.
3. Der ausgewählte Datensatz definiert den Edit-Modus.
4. Save-/Edit-Zustand wird zentral synchronisiert, nicht modulweise nachgebaut.
5. Speichern-/Aktualisieren-Buttons sind globale UI-Controls und duerfen keine Modulfarbe erben.
6. Module duerfen keine konkurrierenden Save-/Update-Handler aufbauen.

## Regression

Nach jeder Aenderung an Saved-State, Selection oder Hydration sind Heizung/Kälte und Druckhaltung als Referenz zu pruefen.
