# Phase 11 – Saved Entry Selection Stabilisierung

## Problem
Nach den mobilen Scroll-Stabilisierungen konnten gespeicherte Einträge nicht mehr zuverlässig angewählt werden. Das betraf Desktop und Mobile und zeigte, dass die bisherige direkte Listener-Bindung an Karten zu empfindlich gegen Re-Render, Pointer-/Click-Reihenfolge und konkurrierende Outside-Click-Handler war.

## Änderung
- `bindSavedRecordList` arbeitet jetzt über eine capture-basierte, scoped Event-Delegation am Modul-Root.
- Selektion, Toggle und Delete werden vor konkurrierenden Handlern abgefangen.
- Gespeicherte Karten erhalten `data-saved-record-card`, `role="button"` und `tabindex="0"`.
- Tastaturauswahl über Enter/Space ist möglich.
- Direkte per-Card-Listener wurden durch robuste zentrale Delegation ersetzt.

## Zielregel
Saved-Record-Interaktionen dürfen nicht mehr von frisch gerenderten DOM-Knoten oder Listener-Reihenfolgen abhängen. Die Auswahl muss zentral am Modul-Root funktionieren.
