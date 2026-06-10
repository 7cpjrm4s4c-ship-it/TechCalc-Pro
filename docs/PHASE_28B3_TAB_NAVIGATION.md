# Phase 28B.3 - Platform Tab Navigation

## Ziel

Tab- und Shift+Tab-Navigation werden ueber den zentralen `PlatformFocusManager` gefuehrt. Dadurch verwendet die Plattform fuer Enter, Tab und Shift-Varianten dieselbe Feldreihenfolge, dieselbe `preventScroll`-Absicherung und dieselbe Commit-before-navigation-Semantik.

## Aenderungen

- `shouldHandleTabNavigation()` ergaenzt
- `focusByTab()` ergaenzt
- `handleTabNavigation()` ergaenzt
- `handlePlatformFieldNavigation()` als gemeinsame Enter/Tab-Delegation eingefuehrt
- zentrale Event-Pipeline commitet bei Tab vor dem Fokuswechsel
- Legacy-State-Binding-Fallback delegiert Tab ebenfalls an den Focus-Service

## Abgrenzung

Dynamische collection-spezifische Inputs bleiben Scope von 28B.4.
