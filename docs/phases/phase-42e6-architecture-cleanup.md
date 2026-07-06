# Phase 42E.6 – Architecture Cleanup and Closure

## Basis

`techcalc-pro-1.3.2-dev.36-phase42e5-mobile-input-contract`

## Ziel

Phase 42E.6 schliesst die Architekturkonsolidierung organisatorisch ab. Es werden keine Runtime-, CSS- oder Modulmechanismen geaendert. Ziel ist die Bereinigung verstreuter Root-Notizen, die finale Konsolidierung der Phase-42-Dokumentation und die Festlegung des gueltigen Architekturstands fuer die anschliessende RC-Vorbereitung.

## Durchgefuehrte Bereinigung

- Die Root-Datei `PHASE39B_NOTES.md` wurde entfernt.
- Der Inhalt der Root-Notiz wurde unter `docs/phases/phase-39.md` historisch eingeordnet.
- `docs/phases/phase-42.md` wurde als abschliessende Hauptreferenz bereinigt.
- `docs/phases/README.md` wurde um alle Phase-42E-Unterphasen ergaenzt.
- Die Release Notes wurden um den Abschluss der Phase 42 ergaenzt.

## Verbindlicher Architekturstand nach Phase 42

### Dokumentation-first

Vor neuen Codeaenderungen werden bestehende Docs, Audits und Phasenberichte geprueft. Neue Regeln entstehen nur, wenn kein vorhandener Vertrag existiert oder eine dokumentierte Entscheidung explizit ersetzt wird.

### Save/Edit/Selection

Der zentrale Save-/Edit-/Selection-Vertrag ist verbindlich. Referenzmodule sind:

- `heating-cooling`
- `pressure-holding`

Module duerfen fuer dieselbe Saved-Action keine konkurrierenden lokalen Save-, Selection- oder Edit-Pfade fuehren.

### Render/Outlet

`hx-diagram` bleibt nur beim Renderziel ein Sonderfall. Diagramm, Prozessauswahl und Ergebnisblock sind fachlich notwendige Outlets, aber der Save-/Selection-Vertrag bleibt zentral.

### Scroll-Stabilitaet

Scroll-Stabilitaet wird ueber minimale DOM-Mutationen, zentrale Anchors und den Referenzvertrag erreicht. Lokale Scroll-Restore-Ketten, Pointerdown-Saved-Selection und Full-Card-Rebuilds bei reinen Saved-Row-Aktionen sind Legacy.

### Keyboard/Focus

Tab, Shift+Tab, Enter und Shift+Enter laufen ueber den zentralen Keyboard-/Focus-Vertrag. Module duerfen keine eigene Tab-/Enter-Reihenfolge etablieren. Das Integration-Gate prueft dies ueber `npm run audit:keyboard-contract`.

### Mobile Input Contract

Standard-Field-Commits duerfen keine komplette Input-Card oder Input-Island ersetzen. Trinkwasser bestaetigt diese Regel als Referenzfall fuer mobile Tap-Wechsel zwischen Eingabefeldern.

### Theme/UI

Es werden keine neuen CSS-Hotfixdateien oder additive Stability-Schichten eingefuehrt. Bestehende zentrale Theme-, Token- und Komponentenvertraege bleiben massgeblich.

## Tests/Gates

Gepruefte Gates fuer den Abschluss:

- `npm test`
- `npm run test:integration`
- `npm run build`

## Ergebnis

Phase 42 ist abgeschlossen. Der naechste Entwicklungsschritt soll auf diesem konsolidierten Vertragsstand aufbauen und keine neuen Parallelvertraege fuer Save, Selection, Render, Scroll, Keyboard, Mobile Input oder Theme einfuehren.
