# Phase 36V.3 – h,x Segment Keyboard Pipeline

## Ziel
Nach 36V.2 sind h,x-Prozessbuttons per Tab/Enter erreichbar. 36V.3 härtet die Bedienung dieser Fokusziele.

## Problem
`data-platform-focus` war in 36V.2 zwar Teil der Fokusziel-Liste. Der `focusManager` erlaubte aber als aktuelles Navigationselement weiterhin nur `[data-field]`.

Zusätzlich behandelte die zentrale Event-Pipeline Keyboard-Events für `[data-segment]` noch nicht explizit. Prozessbuttons konnten per nativer Button-Interaktion funktionieren, lagen aber nicht vollständig auf dem zentralen Segment-Pfad.

## Fix
### focusManager
`focusByEnter()` und `focusByTab()` akzeptieren jetzt:

```js
[data-field], [data-platform-focus]
```

### eventPipeline
`onKeydown` behandelt jetzt fokussierte Segmente:

```js
const segment = event.target?.closest?.('[data-segment]');
if (segment && root.contains(segment) && (event.key === 'Enter' || event.key === ' ')) {
  const handled = handleSegment(segment, event);
  if (handled && event.key === 'Enter') {
    handlePlatformFieldNavigation(root, segment, event, { select: false, defer: false, preventDefault: false });
  }
  return;
}
```

## Ergebnis
- Eingabefeld → Enter/Tab → Prozessbutton funktioniert.
- Prozessbutton → Enter wählt Prozess und navigiert weiter.
- Prozessbutton → Space wählt Prozess, ohne zwangsläufig weiterzuspringen.
- Kein lokaler h,x-Keydown-Handler nötig.
- h,x bleibt auf zentraler Plattform-Pipeline.
