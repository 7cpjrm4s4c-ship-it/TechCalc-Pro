# Phase 28A.4 – Module Switch Scroll Integration

## Ziel

Modulwechsel duerfen keine unbeabsichtigten Scrollspruenge mehr erzeugen. Die Integration schuetzt den zentralen Mount-Pfad der Plattform, damit Navigation, Hash-/History-Wechsel und programmatische Modulwechsel denselben Scroll-Stabilitaetsvertrag nutzen.

## Umsetzung

- `js/core/scrollManager.js`
  - `preserveModuleSwitchScroll()` nutzt jetzt den nativen `runWithoutScrollJump()`-Pfad.
  - `runWithoutScrollJump()` ist Promise-aware und restauriert Scrollpositionen auch nach asynchronen Modul-Mounts erneut.
- `js/core/moduleRuntime.js`
  - `mount()` ist zentral ueber `preserveModuleSwitchScroll()` gekapselt.
  - Unmount, Loading View, Lazy Mount, `afterMount()` und Fehlerpfad laufen unter demselben Scrollschutz.
- Navigation bleibt unveraendert zentral:
  - globale Navigation delegiert weiterhin an `navigate(id)`.
  - Router behaelt genau einen Content-Renderpfad.

## Audit-Artefakte

- `scripts/audit-scroll-module-switch-phase28a4.mjs`
- `tests/platform-scroll-module-switch-phase28a4.test.mjs`
- `platform-scroll-module-switch-phase28a4.json`

## Ergebnis

- Score: 5.00 / 5
- Grade: A
- P0: keine
- P1: keine

## Abgrenzung

Diese Phase veraendert nicht die fachliche Modullogik. Sie haertet ausschliesslich den Plattform-Mount gegen Scrollspruenge beim Modulwechsel.
