# Architecture Principles

## 1. Contract first

Bestehende Architekturvertraege sind die primaere Quelle der Wahrheit. Code folgt dem Contract, nicht umgekehrt.

## 2. Central platform over module special cases

Querschnittsthemen werden zentral geloest:

- Save/Edit/Selection
- Keyboard/Focus
- Scroll-Stabilitaet
- Theme/Design Tokens
- Render-Koordination
- PDF-Export
- Projektverwaltung

Module duerfen fachliche Berechnung, Schema, ViewModel und notwendige Adapter liefern, aber keine parallele Infrastruktur etablieren.

## 3. Reference modules

Bestaetigte Referenzen bleiben verbindlich:

- Save/Edit/Selection: `heating-cooling`, `pressure-holding`
- Diagramm-/Outlet-Vertrag: `hx-diagram`
- Mobile Input Contract: `drinking-water` nach Phase 42E.5

## 4. Minimal DOM mutation

Einfache Field-Commits, Saved-Selection und Collection-Aktionen duerfen keine unnoetigen strukturellen Rebuilds ausloesen.

## 5. No additive hotfix layers

Fehler werden durch Entfernen der Ursache behoben. Additive Guards, neue CSS-Stability-Dateien oder doppelte Regeln sind nur als kurzfristige Diagnose erlaubt und muessen vor Phasenabschluss entfernt werden.

## 6. Testable changes

Jede Aenderung muss ein klares Testziel haben. Wenn ein Problem nicht reproduzierbar ist, wird zuerst instrumentiert oder analysiert, nicht blind gepatcht.
