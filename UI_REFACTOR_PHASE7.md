# TechCalc Pro — UI Refactoring Phase 7

## Ziel
Phase 7 härtet den zentralen UI-Vertrag weiter ab. Die App nutzt jetzt zusätzlich die Versionsklammer `tc-ui-v7` am `<body>`, damit neue UI-Regeln eindeutig von Alt-/Fallback-Regeln getrennt werden können.

## Änderungen

### 1. V7-App-Klammer
`index.html`:

```html
<body class="tc-app tc-ui-v7">
```

Damit können neue Regeln gezielt und ohne Seiteneffekte über `body.tc-app.tc-ui-v7` greifen.

### 2. Einheitliche Rhythmik
In `style.css` wurden V7-Tokens ergänzt:

- `--tcp-v7-header-gap-mobile`
- `--tcp-v7-header-gap-desktop`
- `--tcp-v7-card-radius`
- `--tcp-v7-control-gap`
- `--tcp-v7-result-gap`
- `--tcp-v7-module-bottom-mobile`
- `--tcp-v7-module-bottom-desktop`

Diese Tokens steuern Header-Abstand, Card-Radien, Eingabereihen, Ergebnisabstände und unteren Sicherheitsabstand.

### 3. Legacy-Quarantäne
Die neuen Regeln erzwingen für sichtbare App-Module:

- kein `top`/`transform` auf Cards
- keine modulweisen Card-Margins
- einheitliche Grid-/Stack-Abstände
- einheitliche Eingabehöhen
- einheitliche Ergebniszeilen
- tabellarische Zahlendarstellung bei Ergebniswerten

### 4. Desktop/Mobile-Schärfung
Desktop bleibt bei zentralem Zwei-Spalten-Raster für Module mit `.tcp-col`.
Mobile bleibt konsequent einspaltig mit fixierter Bottom-Pill außerhalb des Inhaltsflusses.

### 5. Modul-Akzent-Regel
Module dürfen nur noch über `--module-accent`, `--module-accent-t` und `--module-accent-b` farblich abweichen. Layout, Controls, Cards und Ergebnisfelder bleiben zentral.

## Betroffene Dateien

- `index.html`
- `style.css`
- `UI_REFACTOR_PHASE7.md`
- `CSS_AUDIT_PHASE7.md`
- `UI_CONTRACT.md`

## Nächster sinnvoller Schritt
Phase 8 sollte nicht mehr weitere Overrides hinzufügen, sondern Legacy-CSS aktiv abbauen:

1. `layout.css` auf reine PDF-Regeln reduzieren.
2. `components.css` nach `style.css` überführen oder eindeutig als Legacy markieren.
3. verbliebene Inline-Styles in `index.html` systematisch entfernen.
4. nicht mehr gelinkte/duplizierte CSS-Dateien aus dem produktiven Pfad entfernen.
