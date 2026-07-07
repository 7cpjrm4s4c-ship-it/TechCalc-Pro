# Phase 36S.3 – Platform Navigation Parity

## Ziel
HX-Diagramm und Trinkwasser sollen bei Tab/Enter denselben Navigationspfad verwenden wie die Referenzmodule Heizung, Lüftung, Druckhaltung und Pufferspeicher.

## Umsetzung

### HX-Diagramm
Entfernt:
- lokaler `rootEl.addEventListener('keydown', ...)`
- eigener `handlePlatformFieldNavigation(...)`-Aufruf
- lokaler RAF-Refresh aus dem Keydown-Pfad
- Keydown-gekoppelter Reset von `activePath` / `points`

Verbleibend:
- `input` / `change` setzen weiterhin `clearGeneratedPath()`
- Prozess-, Clear- und Saved-Actions bleiben unverändert
- zentrale Plattform-Pipeline aus `bindCommonInputs()` übernimmt Tab/Enter

### Trinkwasser
Entfernt:
- lokaler `handleFieldConfirmNavigation`
- eigener `handlePlatformFieldNavigation(...)`-Aufruf
- direkter `refreshDrinkingWater(root)` aus dem Tab/Enter-Pfad
- `stopImmediatePropagation()` im Feldnavigation-Handler

Verbleibend:
- Navigation-Persistence-Guard für Keyboard-Klasse bleibt erhalten
- Click-/Collection-/Saved-Actions bleiben unverändert
- zentrale Plattform-Pipeline aus `bindCommonInputs()` übernimmt Tab/Enter

## Ergebnis
Problem-Module besitzen keine konkurrierende lokale Tab-/Enter-Feldnavigation mehr.
