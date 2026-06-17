# Phase 12B – Modul-Neuaufbau statt Patchbetrieb

Ab dieser Phase gilt: Module werden nicht weiter über Legacy-Patches stabilisiert. Ein Modul gilt erst als migriert, wenn fachliche Zustände über den zentralen Store laufen und UI-Aktionen über die zentrale Event-Pipeline committen.

## Referenzmodul Heizung/Kälte

Heizung/Kälte bleibt das Referenzmodul für den globalen Standard. Die aktuelle Korrektur entfernt zwei zentrale Hybrid-Ursachen:

- Select-Blur löst keinen zweiten Commit/Render mehr aus. Dadurch wird das native Mobile-Auswahlmenü nach Auswahl nicht erneut geöffnet.
- Segment-Aktionen werden mobil bereits auf pointerup/touchend committed, nicht erst nach einem verzögerten synthetischen Click oder einer Screen-Bestätigung.
- Dynamische Feldaktionen aktualisieren nur dynamische Bereiche. Saved-Record-Bindings werden nicht bei jeder Feldaktion erneut gebunden.

## Harte Migrationsregel

Jedes weitere Modul wird künftig in diese Schichten zerlegt:

- schema
- lookups/stammdaten
- reducer/state transitions
- calculation
- results mapping
- optional saved-record adapter

Nicht mehr erlaubt sind neue modulinterne Scroll-, Render-, Select-, Switch- oder Zahlenformat-Patches.
