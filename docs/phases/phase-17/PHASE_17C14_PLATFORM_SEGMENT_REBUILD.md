# Phase 17C.14 – Platform Segment Rebuild

## Ziel

Regenwasser darf fuer den Wechsel Dachflaeche / Grundstuecksflaeche keinen eigenen DOM-Patch besitzen. Der Wechsel ist schema-strukturell und muss zentral in der Plattform verarbeitet werden.

## Umsetzung

- Segment-Actions in `platform/moduleRuntime` werden als strukturelle Updates behandelt.
- Bei `platform:segment:*` erfolgt ein synchroner kompletter Plattform-View-Rebuild.
- Danach wird die Plattform-Action-Map neu gebunden.
- Nicht-Segment-Updates nutzen weiter die leichteren Dynamic-Islands.

## Wirkung

Der Regenwasser-Switch rendert `Regenspende r(5,5)` / `Regenspende r(5,2)`, Dacheinlauf / Hoftopf, Notentwaesserung und Flaechenarten sofort aus dem aktuellen State neu.
