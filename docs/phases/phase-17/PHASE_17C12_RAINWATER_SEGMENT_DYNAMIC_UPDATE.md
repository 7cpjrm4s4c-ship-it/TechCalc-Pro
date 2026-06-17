# Phase 17C.12 - Regenwasser Segment Dynamic Update

## Ziel

Das Regenwasser-Modul nutzt nach Phase 17C.11 den korrekten Speichervertrag. Offen blieb der Wechsel des Berechnungsbereichs Dachfläche / Grundstücksfläche: Die Segment-Optik wechselte sofort, die schemaabhängigen Labels und Felder wurden auf mobilen Browsern aber erst nach der nächsten Eingabe aktualisiert.

## Ursache

Heizung/Kälte arbeitet store-first mit direkten Dynamic-Islands. Der Plattform-Segmentpfad der Referenzmodule wurde dagegen erst über den generischen Pointer-/Touch-/Click-Pfad verarbeitet. Auf mobilen Browsern konnte dadurch die visuelle Segment-Aktivierung früher sichtbar sein als der State-Commit mit anschließendem Schema-Rebuild.

## Umsetzung

- Plattform-Segmente committen konfigurierte Segmentfelder jetzt bereits auf `pointerdown` / `touchstart`.
- Der Commit läuft weiterhin über den zentralen Segmentvertrag aus `controller.segments`.
- Doppelte Folgeevents aus `touchend`, `pointerup` oder `click` werden dedupliziert.
- Nach dem State-Commit wird der RenderScheduler sofort geflusht.
- Keine Regenwasser-DOM-Sonderregel, kein `querySelector`-Patch und kein modulnaher Label-Hack.

## Regression

Neue Regression:

- `tests/rainwater-phase17c12-switch.test.mjs`

Geprüft wird:

- Dachfläche rendert `Regenspende r(5,5)` und `Vorwahl Dacheinlauf`.
- Grundstücksfläche rendert `Regenspende r(5,2)` und `Vorwahl Hoftopf`.
- Regenwasser-Controller enthält keine `domPatch`-/`querySelector`-Altlast.

## Ergebnis

Regenwasser folgt beim Switch dem gleichen Grundprinzip wie Heizung/Kälte: State zuerst, danach sofortige dynamische Aktualisierung der abhängigen UI.
