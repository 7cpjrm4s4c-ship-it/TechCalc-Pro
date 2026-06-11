# Phase 17C.16 – Platform Segment Context Bridge

## Ziel

Der Regenwasser-Switch Dachfläche / Grundstücksfläche muss direkt beim ersten Tap nach dem Modulstart aktualisieren. Die Aktualisierung darf nicht erst nach einer späteren Eingabe oder einem Blur/Confirm erfolgen.

## Ursache

Der zentrale Direct Segment Bridge Listener wurde nur einmal pro Root registriert. Dabei behielt er die Closure des ersten Plattform-Mounts. Wenn später Regenwasser in denselben Root gemountet wurde, blieb der Listener zwar vorhanden, arbeitete aber nicht mit dem aktuellen `surfaceMode`-Kontext.

Folge: Der normale spätere Commit-Pfad konnte nach einer anderen Eingabe greifen, der Sofortpfad beim ersten Segment-Tap aber nicht.

## Umsetzung

- `root.__tcPlatformSegmentContext` wird bei jedem `bindSegments()` aktualisiert.
- Der einmalige Direct Listener liest den aktuellen Kontext zur Event-Zeit.
- Der Kontext wird nicht mehr nach dem Binding auf `null` gesetzt.
- Bestehende SavedRecord- und Event-Pipeline-Verträge bleiben unverändert.

## Regression

Neue Regression:

- `tests/rainwater-phase17c16-segment-context.test.mjs`

Zusätzlich wurde die ältere Phase-17C.5-Regression an den neuen, korrekten Segment-Kontext-Vertrag angepasst.
