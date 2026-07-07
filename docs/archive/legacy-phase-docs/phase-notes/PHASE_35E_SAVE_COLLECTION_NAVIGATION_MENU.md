# Phase 35E – Save/Collection/Navigation/Menu Root Cause Retest Fix

## Ziel
Offene RC-Retest-Bugs nach 35D nicht weiter symptomatisch patchen, sondern an den funktionierenden Referenzmodulen ausrichten.

## Änderungen
- Zentrale Speicher-Dialoge committen das Namensfeld nun vor Save/Update direkt über den zentralen Field-Pfad.
- Der Line-Section/Saved-Record Direct-Action-Bridge nutzt einen aktualisierten Kontext pro Modulbindung statt stale Closures.
- Collection-Handler verwenden den aktiven Modul-State aus dem aktuellen Mount-Kontext. Dadurch können Schmutzwasser-Gegenstände nach Modulwechseln wieder hinzugefügt werden.
- Collection-Add/Delete läuft mit UX-/Scroll-Preservation und commitBeforeAdd.
- Hauptmenü-/Weitere-Module-Cards dürfen inhaltlich wachsen, Text umbrechen und bei kleinen Bildschirmen scrollen.

## Retest-Fokus
- Schmutzwasser: Gegenstand hinzufügen direkt nach Eingabe und bei geöffneter Tastatur.
- Schmutzwasser/Regenwasser: Speichern ohne zusätzlichen Bestätigungsklick nach Texteingabe.
- HX/Trinkwasser: Tab-/Enter-Navigation im Browser manuell prüfen.
- Trinkwasser Mobile: Scroll beim Speichern/Markieren/Hinzufügen prüfen.
- Hauptmenü: lange Modultexte auf kleinen Screens scrollen.
