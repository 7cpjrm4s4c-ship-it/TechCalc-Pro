# Phase 28B.2 - Platform Enter Navigation

## Ziel

Enter-Navigation wird zentral im `PlatformFocusManager` definiert. Module sollen keine eigene Semantik fuer `Enter -> naechstes Feld` besitzen.

## Umsetzung

- `shouldHandleEnterNavigation()` im Focus Manager ergaenzt.
- `focusByEnter()` im Focus Manager ergaenzt.
- `handleEnterNavigation()` im Focus Manager ergaenzt.
- Zentrale Event Pipeline delegiert Enter-Fokusbewegung an den Focus Manager.
- Legacy State Binding delegiert Enter-Fokusbewegung ebenfalls an den Focus Manager.
- Field-Commit vor Navigation bleibt erhalten.
- `preventScroll` bleibt Standard fuer Fokusbewegung.

## Semantik

- `Enter`: aktuelles Feld committen und zum naechsten Plattformfeld wechseln.
- `Shift+Enter`: aktuelles Feld committen und zum vorherigen Plattformfeld wechseln.
- `Alt/Ctrl/Meta+Enter`: keine Plattformnavigation.

## Abgrenzung

Tab-Reihenfolge und explizite Tab-Hardening-Regeln bleiben Scope von 28B.3.
