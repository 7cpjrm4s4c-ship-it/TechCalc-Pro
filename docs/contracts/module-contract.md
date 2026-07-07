# Module Contract

Status: verbindlich ab Phase 43C

## Ziel

Fachmodule unterscheiden sich durch Berechnung und ViewModel, nicht durch eigene Plattforminfrastruktur.

## Regeln

1. Save, Selection, Keyboard, Theme und Render folgen zentralen Verträgen.
2. Module duerfen fachliche Adapter bereitstellen, aber keine parallelen Plattform-Controller einfuehren.
3. Lokale Sonderfaelle muessen dokumentiert und durch Audits abgesichert sein.
4. Neue Module muessen gegen Referenzmodule getestet werden.
5. Dokumentation und Contract-Pruefung gehen Codeaenderungen voraus.

## Referenzen

- Save/Edit: Heizung/Kälte und Druckhaltung
- Diagramm: h,x-Diagramm
- Mobile Input: Trinkwasser nach Phase 42E.5
