# Phase 36R – Tab-/Enter-Navigation h,x und Trinkwasser

## h,x-Diagramm
Der lokale `keydown`-Handler folgt jetzt der zentralen Event-Pipeline-Reihenfolge:

1. Feldwert silent committen
2. Fokus per `handlePlatformFieldNavigation(...)` bewegen
3. notifying Refresh erst im nächsten Frame
4. Refresh mit `PlatformFocusManager.preserveFocusDuring(...)`

Zusätzlich wurde der finale, syntaxsaubere `renderDynamicSections()`-Stand wiederhergestellt.

## Trinkwasser
Der bisherige Handler hat `refreshDrinkingWater(root)` vor dem Fokuswechsel ausgeführt.
Das wurde korrigiert:

1. Feldwert silent committen
2. Fokus bewegen
3. Refresh in `requestAnimationFrame`
4. Refresh in `PlatformFocusManager.preserveFocusDuring(...)`

## Nicht geändert
- Keine Saved-Record-Änderungen
- Keine Layout-/Spacing-Änderungen
- Keine Berechnungslogik
