# Phase 36V.2 – h,x Platform Focus Targets

## Problem
Nach 36V.1 blieb ein h,x-spezifischer Navigationsbruch möglich:

Die zentrale Plattformnavigation bewegt den Fokus bei Tab/Enter über `focusManager.getPlatformFields()`.
Diese Liste enthielt nur echte `[data-field]` Formfelder.

Im h,x-Modul folgen nach den vier Eingabefeldern aber Prozess-Buttons:

```html
<button data-segment="process">...</button>
```

Diese Buttons sind fachlich Teil der Eingabestrecke, wurden aber von der Plattformnavigation nicht als nächstes Ziel erkannt.

## Folge
Am letzten h,x-Eingabefeld konnte Tab/Enter kein gültiges nächstes Plattformziel finden.
Da die zentrale Pipeline das native Tab-Event verhindert, wirkt die Navigation dann defekt oder bleibt stehen.

## Fix
Es wurde ein expliziter Opt-in-Fokusmarker eingeführt:

```html
data-platform-focus
```

Der `focusManager` berücksichtigt jetzt zusätzlich:

```js
[data-platform-focus]:not([disabled])
```

Im h,x-Modul erhalten:

- Prozess-Buttons (`data-segment="process"`)
- Diagramm-leeren-Button (`data-tc-action="hx:clear"`)

diesen Marker.

## Warum Opt-in statt alle Buttons?
Nicht jeder Button ist Teil einer Feldnavigation. Mit `data-platform-focus` bleiben andere Module stabil und nur explizit markierte Controls werden in die Enter-/Tab-Strecke aufgenommen.

## Nicht geändert
- kein lokaler h,x-Keydown-Handler
- keine Berechnungslogik
- kein Saved-Record-Pfad
- keine CSS-Änderungen
