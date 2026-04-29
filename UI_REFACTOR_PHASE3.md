# TechCalc Pro – UI Refactoring Phase 3

## Ziel
Phase 3 stabilisiert die zentrale UX/UI-Sprache für neue und bestehende Module. Die bisherigen Modulwrapper bleiben kompatibel, werden aber durch semantische `tcp-*`-Klassen ergänzt.

## Änderungen

### 1. Semantische UI-Klassen eingeführt
- `tcp-layout` für Tab-Layouts
- `tcp-col`, `tcp-col--left`, `tcp-col--right` für Desktop-Spalten
- `tcp-card` für Karten
- `tcp-input-group` für Eingabeblöcke
- `tcp-stack`, `tcp-field-grid`, `tcp-primary-btn`, `tcp-sign-btn`, `tcp-muted`, `tcp-card-title` als neue zentrale Bausteine

### 2. HTML strukturell vorbereitet
- Bestehende `.tab-inner` wurden zusätzlich zu `.tcp-layout` erweitert.
- Bestehende `.gc` und `.out-card` wurden zusätzlich zu `.tcp-card` erweitert.
- Bestehende `.igrp` wurden zusätzlich zu `.tcp-input-group` erweitert.
- Bestehende Desktop-Spalten von Lüftung, Trinkwasser, MAG und Entwässerung wurden mit `tcp-col`-Aliasen ergänzt.

### 3. Zentrale Desktop-/Mobile-Regeln geschärft
- Desktop: zweispaltiges Grid über `.tcp-layout`, gleiche Spaltenbreiten, gleicher Abstand.
- Mobile: einspaltige Stack-Darstellung, gleiche Karten- und Gruppenabstände.
- Bottom-Pill bleibt am unteren Viewport-Rand geführt.

### 4. Legacy-Brücke reduziert Risiko
Die alten Klassennamen bleiben bestehen, damit bestehende JS-Selektoren und Modul-Styles nicht brechen. Neue Module sollen aber ausschließlich die `tcp-*`-Sprache verwenden.

## Vorgabe für neue Module

```html
<div id="tab-neu" class="tab-panel tcp-module tcp-module--air">
  <div class="tab-inner tcp-layout">
    <div class="tcp-col tcp-col--left">
      <div class="tcp-card">...</div>
    </div>
    <div class="tcp-col tcp-col--right">
      <div class="tcp-card">...</div>
    </div>
  </div>
</div>
```

Nur die Modulfarbe wird über `tcp-module--...` gesteuert. Layout, Abstände, Cards, Inputs und Ergebniszeilen kommen zentral aus `style.css`.

## Nächste Phase
Phase 4 sollte die alten Inline-Styles systematisch aus `index.html` entfernen und in zentrale Hilfsklassen überführen. Danach kann `layout.css` konsequent auf PDF-Export reduziert werden.
