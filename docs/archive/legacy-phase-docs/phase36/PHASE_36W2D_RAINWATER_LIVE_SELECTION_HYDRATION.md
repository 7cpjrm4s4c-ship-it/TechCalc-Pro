# Phase 36W.2D – Rainwater Live Selection Hydration

## Problem
Nach 36W.1 wurden die richtigen Formbereiche bei `surfaceMode` angezeigt.
Die Live-Auswahl innerhalb dieser Bereiche aktualisierte aber abhängige Felder nicht zuverlässig:

- Dacheinlauf / Hoftopf
- Notentwässerung
- Regenfläche / Flächenart

## Ursache
Die Dynamic-Renderer-Form-Island wurde nur bei `appStructural` oder `surfaceModeChanged` neu gerendert.
Auswahl- und Lookup-Änderungen wie `drainSize`, `emergencyType` oder `areaType` änderten zwar State-Werte, führten aber nicht zu einem Neuaufbau der Form-Island.

Damit blieben sichtbare Input-Felder, readonly Werte und `visibleWhen`-abhängige Felder auf dem alten Stand.

## Fix
`createRainwaterDynamicRenderer()` erkennt jetzt zusätzlich `selectionHydrationChanged`.

Die Form-Island rendert neu bei:

- `platform:lookup:*`
- `field:input:select`
- `field:change:immediate`
- `field:change`
- Änderungen an:
  - `drainSize`
  - `drainSizeManual`
  - `drainCapacity`
  - `drainHead`
  - `emergencyType`
  - `emergencyHead`
  - `emergencyWidth`
  - `emergencyDiameter`
  - `emergencyManufacturerDn`
  - `emergencyCapacity`
  - `emergencySafetyFactor`
  - `areaType`
  - `customCs`
  - `customCm`

Zusätzlich speichert der Dynamic-Cache nun:

- `drainSize`
- `emergencyType`
- `areaType`

## AreaType-Hydration
`lookupPatch('areaType')` leert `customCs` und `customCm`, wenn auf eine nicht-kundenspezifische Flächenart gewechselt wird.

## Nicht geändert
- Keine View-Struktur
- Keine Saved-Record-Pfade
- Keine Collection-Logik
