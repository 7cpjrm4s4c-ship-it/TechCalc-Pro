# Phase 35B – RC Root-Cause Bugfixes

## Ziel

Phase 35B adressiert die nach dem RC-Retest weiter offenen Ursachen statt weiterer oberflaechlicher UI-Patches.

## Bearbeitet

- Druckhaltung: Speichern-Button bleibt auch bei aktivem Datensatz nutzbar; Aktualisieren bleibt aktiv-datensatzgebunden.
- Druckhaltung: MAG-/Druckhaltungsoptionen direkt nach Berechnungsart angeordnet; Speicherdialog bleibt nach Druckdaten.
- Schmutzwasser: Save-Button im Speicherdialog wieder nutzbar, auch wenn ein Datensatz aktiv ist.
- Schmutzwasser: Collection-Action-Kontext im Platform Runtime wird bei Modulwechsel aktualisiert, damit Gegenstand-hinzufuegen nicht auf veraltete Handler zeigt.
- Regenwasser: Save-Button im Speicherdialog wieder nutzbar, auch wenn eine Flaeche aktiv ist.
- h,x-Diagramm: Enter-/Tab-Navigation mit sichtbarkeitsrobuster Feldliste gehaertet.
- Trinkwasser: Enter-/Tab-Navigation unmittelbar statt deferred ausgefuehrt.
- Trinkwasser: Scroll-Preservation beim Speichern und Hinzufuegen verlaengert.
- Allgemein: Overflow-Menue-Card scrollbarer und hoehenflexibler gemacht.

## Quality Gate

- npm run build: OK
- npm run audit:css: OK
- npm test: OK

## Hinweis

Die Phase ersetzt keine manuelle Browser-/Device-Verifikation. Besonders mobile Scroll-Verhalten und virtuelle Tastatur muessen weiterhin auf echtem Geraet geprueft werden.
