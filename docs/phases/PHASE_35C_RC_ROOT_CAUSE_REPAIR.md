# Phase 35C – RC Root-Cause Repair

## Fokus

Retest-Befund nach 35B: Speicher-Dialoge und mobile Aktionen waren weiterhin nicht verlässlich. 35C behandelt deshalb die Ursachen statt weiterer optischer Patches.

## Änderungen

- Save-Button im globalen Saved-Record-Panel optisch auf primären Button umgestellt.
- Plattform-Saved-Records bleiben im zentralen Action-Map-Vertrag; Save-Button-Optik und frühe Action-Pipeline wurden stabilisiert.
- Druckhaltung-Saved-Records bleiben im zentralen Action-Map-Vertrag; der Dialog nutzt denselben primären Save-Button wie funktionierende Module.
- Collection-Add-Aktionen committen Eingaben vor dem Hinzufügen und nutzen längere Scroll-/Focus-Preservation.
- Enter/Tab-Navigation commitet zunächst silent, bewegt dann den Fokus und rendert danach fokusbewahrend.
- Hauptmenü-/Weitere-Module-Cards können größere Inhalte scrollen und schneiden Text nicht mehr ab.

## Betroffene Retest-Punkte

- Druckhaltung Speichern
- Schmutzwasser Speichern und Gegenstand hinzufügen
- Regenwasser Speichern
- h,x Enter/Tab
- Trinkwasser Enter/Tab und mobile Scrollsprünge
- Allgemeines Menü-Overflow-Verhalten
