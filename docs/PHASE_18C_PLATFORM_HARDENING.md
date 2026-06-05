# Phase 18C – Plattform-Härtung nach drei Referenzmodulen

Basis: Phase 18B.4A mit wiederhergestellter Heizung/Kälte-UI-Reihenfolge.

## Ziel

Nach Regenwasser, Schmutzwasser und Heizung/Kälte sind drei fachlich unterschiedliche Module auf der Plattformstruktur stabil. Phase 18C haertet den Vertrag, entfernt reine Quelltext-Kompatibilitaetsmarker und aktualisiert alte Regressionen, sodass sie die neue Plattformverantwortung pruefen statt alte Modul-Implementierungen zu erzwingen.

## Umgesetzt

- Heizung/Kälte `migrationStatus` bereinigt und um `phase-18c-platform-hardening` erweitert.
- Doppelte Phase-Marker entfernt.
- Quelltext-Kompatibilitaetskommentare aus `modules/heating-cooling/index.js` entfernt.
- Alte Regressionen auf die neue Plattformverantwortung umgestellt:
  - Dynamic Updates: `platform/dynamicRenderer`
  - Leitungsabschnitte: `platform/lineSectionController`
  - Lifecycle: `platform/moduleRuntime`
- Neue Regression `heating-cooling-phase18c-platform-hardening` ergaenzt.

## Plattformvertrag nach 18C

- Regenwasser und Schmutzwasser nutzen die generische Plattform-Runtime.
- Heizung/Kälte nutzt die Plattform-Runtime mit Custom-View-Hooks, bis die fachlichen Eingabeinseln vollstaendig in generische Schema-/Renderer-Funktionen ueberfuehrt sind.
- Segment-Actions committen ohne Scroll-Preservation, damit Mobile-Safari-Updates sofort greifen.
- Layout-Reihenfolge wird schema-basiert ueber `layout.order` abgesichert.

## Nicht Bestandteil

Phase 18C migriert noch nicht Lüftung. Das ist der naechste sinnvolle Modul-Kandidat, nachdem drei Referenzmodule stabil sind.
