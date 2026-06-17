# Phase 14J – Regenwasser Final Stabilization

Ziel: Regenwasser weiter an den globalen Standard der Referenzmodule Heizung/Kälte und Lüftung anbinden.

Umgesetzt:

- Navigation nach Regenwasser robuster gemacht: Router rendert idempotent nach Hash-Navigation nach.
- Select-Commit-Pipeline korrigiert: `data-render="defer"` verhindert nur den Full-Render, nicht mehr den Immediate-Commit.
- Dachfläche/Grundstücksfläche-Switch löst einen strukturellen Modul-Render aus, damit Labels und fachliche Texte sofort wechseln.
- Dacheinlauf-Hydration aktualisiert Stammdaten ohne erneutes Öffnen der Select-Card.
- Normhinweise hinter den globalen Speicher-Dialog verschoben.
- Gespeicherte Dachflächen zeigen Notentwässerungswerte im Accordion.
- Ergebnis/Speicher/Normhinweise verwenden globale Stack-Abstände.

Nicht geändert:

- Flächen werden weiterhin nur durch aktiven Speichern-Befehl angelegt.
- Auswahl und Accordion bleiben getrennte UI-Zustände.
