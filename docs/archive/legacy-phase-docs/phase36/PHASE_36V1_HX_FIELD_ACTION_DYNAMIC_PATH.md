# Phase 36V.1 – h,x Tab/Enter Dynamic Action Path

## Problem
Nach 36S.3 nutzt h,x wieder die zentrale Plattform-Pipeline für Tab/Enter. Diese Pipeline erzeugt bei Keyboard-Navigation generische Aktionen:

- `field:tab`
- `field:tab:refresh`
- `field:enter`
- `field:enter:refresh`
- `input:confirm`

Die h,x-Funktion `isDynamicHxDiagramAction()` erkannte aber nur:

- `platform:field:`
- `hx:`
- `line:`
- `saved:`

## Ursache
`field:tab:refresh` und `field:enter:refresh` wurden nicht als Dynamic-Actions erkannt.

Dadurch hat `moduleRuntime` bei Tab/Enter keinen Dynamic-Update ausgeführt, sondern einen vollständigen Root-Render:

```text
Tab/Enter
→ central event pipeline
→ action field:tab:refresh
→ isDynamicHxDiagramAction false
→ fullRender()
→ root.innerHTML = view(snapshot)
→ fokussiertes Input wird ersetzt
→ Tab/Enter wirkt defekt
```

## Fix
`isDynamicHxDiagramAction()` erkennt jetzt zusätzlich:

```js
action.startsWith('field:')
action === 'input:confirm'
```

Damit bleibt h,x auf dem dynamischen Renderpfad:

```text
Tab/Enter
→ central event pipeline
→ action field:tab:refresh
→ isDynamicHxDiagramAction true
→ updateHxDiagramDynamic()
→ renderDynamicSections()
→ nur Prozess/Ergebnis/Diagramm aktualisieren
→ Eingabe-Inputs bleiben erhalten
```

## Nicht geändert
- kein lokaler h,x-Keydown-Handler wieder eingeführt
- keine View-Struktur geändert
- keine Berechnungslogik geändert
- kein Saved-Record-Pfad geändert
