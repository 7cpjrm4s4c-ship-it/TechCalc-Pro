# TechCalc Pro — UI Refactoring Phase 2

## Ziel
Phase 2 stabilisiert die zentrale App-UI-Sprache, ohne die bestehende Fachlogik anzufassen. Die App bleibt lauffähig, während alte modulbezogene Layout-Sonderregeln schrittweise entmachtet werden.

## Geändert

### 1. Zentrale App-Klammer
- `<body>` besitzt jetzt `class="tc-app"`.
- Alle neuen zentralen Regeln sind an `body.tc-app` gebunden.
- Vorteil: App-UI-Regeln lassen sich klar von PDF/Print und Legacy-Regeln abgrenzen.

### 2. Zentrale UI-Primitiven per Normalisierung
In `app.js` wurde `_normalizeUiPrimitives()` ergänzt:
- `.gc`, `.out-card`, `.hx-card` erhalten zusätzlich `.tcp-card`
- `.igrp` erhält zusätzlich `.tcp-input-group`
- `.ob`, `.out-row` erhalten zusätzlich `.tcp-result-row`

Das ist bewusst eine Übergangsstrategie: Phase 3 kann diese Klassen direkt in `index.html` übernehmen und alte Klassen/Overrides reduzieren.

### 3. Einheitliche Cards
`style.css` enthält jetzt eine zentrale Card-Definition für:
- Eingabekarten
- Ergebniskarten
- h,x-Karten

Damit werden Schatten, Radius, Border und Hintergrund einheitlich geführt.

### 4. Einheitliche Eingaben
Inputs, Selects und h,x-Felder nutzen jetzt zentral:
- einheitliche Mindesthöhe
- einheitlichen Radius
- modulbezogene Focus-Farbe über `--module-accent`

### 5. Einheitliche Ergebniszeilen
Ergebniszeilen sind jetzt über `.tcp-result-row` zentralisiert. Das umfasst auch den Einheiten-Tab (`.out-row`).

### 6. Desktop-Grids weiter stabilisiert
Für die Module mit Zwei-Spalten-Layout gewinnen die expliziten Wrapper:
- `.luft-desktop-left/right`
- `.hx-desktop-left/right`
- `.wrg-desktop-left/right`
- `.tw-desktop-left/right`
- `.mag-desktop-left/right`
- `.ew-desktop-left/right`

Diese Regeln überschreiben die alten `nth-of-type`-Platzierungen kontrolliert über die Kaskade.

### 7. Mobile Bottom-Pill fixiert
Die Bottom-Pill wird im zentralen UI-Layer an den unteren Bildschirmrand gebunden. Damit rutscht sie nicht mehr durch Grid-/Tab-Inhalte nach oben.

### 8. Print/PDF-Schutz
Navigation, Overlays und Sheets werden im Print/PDF-Kontext ausgeblendet.

## Nicht verändert
- Keine Rechenlogik geändert.
- Keine IDs geändert.
- Keine Fachmodule entfernt.
- `layout.css` bleibt in dieser Phase noch als Legacy-App/PDF-Datei geladen.

## Nächste Phase
Phase 3 sollte `layout.css` aufteilen:

```text
layout.css       -> nur noch PDF/Print
legacy-ui.css    -> temporär alte App-Regeln, danach entfernen
style.css        -> einzige App-UI-Wahrheit
```

Zusätzlich sollten die durch `_normalizeUiPrimitives()` ergänzten Klassen direkt ins HTML übertragen werden.
