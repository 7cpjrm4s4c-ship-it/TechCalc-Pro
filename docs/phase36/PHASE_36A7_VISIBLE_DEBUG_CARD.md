# Phase 36A.7 – Visible Debug Card

## Nutzung auf iPhone

Debug aktivieren über URL:

```text
?debug=1
```

oder:

```text
#debug
```

Beispiel lokal:

```text
index.html?debug=1
```

## Was sichtbar wird

In Schmutzwasser und Regenwasser erscheint eine Debug Card mit LineSection Events:

- `line:handle`
- `line:load:start`
- `line:load:select`
- `line:load:deselect`
- `line:toggle:start`
- `line:handled`
- `line:skip-click-replay`

## Ziel

Ohne Browser DevTools erkennen:
- ob ein Klick doppelt verarbeitet wird
- ob der State nach dem ersten Klick zurückgesetzt wird
- ob Accordion durch Toggle doppelt feuert
